from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
import mysql.connector
import os
import torch
import mysql.connector.pooling
from collections import defaultdict
from datetime import datetime
from transformers import BertForSequenceClassification, BertTokenizer

# === Load demand prediction ML model ===
demand_model = tf.keras.models.load_model("models/demand_predictor.keras")
seq_scaler = joblib.load("models/seq_scaler.pkl")
y_scaler = joblib.load("models/y_scaler.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")

# === Flask app setup ===
app = Flask(__name__)
CORS(app)

# === MySQL connection pool ===
pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    host="localhost",
    user="root",
    password="InsIdIous",  # Use environment variable in production
    database="meditrust"
)

bert_model = None
bert_tokenizer = None

def load_bert_model():
    """Load the BERT model for license verification"""
    global bert_model, bert_tokenizer
    try:
        model_path = r"C:\Users\anshu\OneDrive\Desktop\EDAI SY 2\Meditrust\server\bert_license_classifier"
        bert_model = BertForSequenceClassification.from_pretrained(model_path)
        bert_tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
        return True
    except Exception as e:
        print(f"Error loading BERT model: {str(e)}")
        return False

@app.route('/verify-license', methods=['POST'])
def verify_license():
    """Endpoint to verify license numbers"""
    try:
        data = request.get_json()
        license_number = data.get('licenseNumber')
        if not license_number:
            return jsonify({'error': 'License number is required'}), 400

        global bert_model, bert_tokenizer
        if bert_model is None or bert_tokenizer is None:
            if not load_bert_model():
                return jsonify({'error': 'BERT model could not be loaded'}), 500

        inputs = bert_tokenizer(license_number, padding="max_length", truncation=True, max_length=20, return_tensors="pt")
        with torch.no_grad():
            outputs = bert_model(**inputs)
            logits = outputs.logits
            prediction = torch.argmax(logits, dim=-1).item()

        is_verified = prediction == 1
        return jsonify({'verified': is_verified, 'licenseNumber': license_number})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        seq_data = data.get('seq')

        if not product_id or not seq_data:
            return jsonify({'error': 'Missing required fields: product_id and seq'}), 400

        try:
            product_idx = label_encoder.transform([product_id])[0]
        except Exception:
            return jsonify({'error': f'Product ID "{product_id}" not recognized.'}), 400

        # Pad or truncate sequence to 5
        padded_seq = seq_data[:5] + [{
            "RollingQuantity": 0,
            "DayOfWeek": 0,
            "Month": 1,
            "Day": 1,
            "WeekOfYear": 1
        }] * max(0, 5 - len(seq_data))

        features_df = pd.DataFrame(padded_seq)[['RollingQuantity', 'DayOfWeek', 'Month', 'Day', 'WeekOfYear']]
        features_scaled = seq_scaler.transform(features_df).reshape(1, -1, features_df.shape[1])

        pred_scaled = demand_model.predict([features_scaled, np.array([[product_idx]])])
        pred = y_scaler.inverse_transform(pred_scaled)[0][0]

        return jsonify({'predicted_quantity': float(round(pred, 2))})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user_recommendations', methods=['POST'])
def user_recommendations():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        conn = pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT oi.product_id, o.order_date
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = %s
            ORDER BY o.order_date DESC
            LIMIT 50;
        """, (user_id,))
        rows = cursor.fetchall()

        history = defaultdict(list)
        for row in rows:
            dt = row["order_date"]
            if isinstance(dt, str):
                dt = datetime.strptime(dt, "%Y-%m-%d %H:%M:%S")
            history[row["product_id"]].append({
                "RollingQuantity": 1,
                "DayOfWeek": dt.weekday(),
                "Month": dt.month,
                "Day": dt.day,
                "WeekOfYear": dt.isocalendar()[1]
            })

        predictions = []
        for pid, seq_data in history.items():
            try:
                product_idx = label_encoder.transform([pid])[0]
                padded_seq = seq_data[:5] + [{
                    "RollingQuantity": 0,
                    "DayOfWeek": 0,
                    "Month": 1,
                    "Day": 1,
                    "WeekOfYear": 1
                }] * max(0, 5 - len(seq_data))

                features_df = pd.DataFrame(padded_seq)[['RollingQuantity', 'DayOfWeek', 'Month', 'Day', 'WeekOfYear']]
                features_scaled = seq_scaler.transform(features_df).reshape(1, -1, features_df.shape[1])

                pred_scaled = demand_model.predict([features_scaled, np.array([[product_idx]])])
                pred = y_scaler.inverse_transform(pred_scaled)[0][0]
                predictions.append((pid, float(round(pred, 2))))
            except Exception as e:
                print(f"Prediction failed for {pid}: {e}")
                continue

        if not predictions:
            return jsonify({"recommended_products": []})

        top_3_ids = [pid for pid, _ in sorted(predictions, key=lambda x: x[1], reverse=True)[:3]]

        format_strings = ','.join(['%s'] * len(top_3_ids))
        cursor.execute(f"""
            SELECT sr_number AS product_id, product_name, generic_name, composition, packet_size, uses, transfer_price, storage_condition
            FROM medicines
            WHERE sr_number IN ({format_strings})
        """, tuple(top_3_ids))
        product_info = cursor.fetchall()

        recommended_products = []
        for product in product_info:
            product_id = product['product_id']
            predicted_quantity = next((q for pid, q in predictions if pid == product_id), 0)
            recommended_products.append({
                **product,
                'predicted_quantity': predicted_quantity
            })

        return jsonify({'recommended_products': recommended_products})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(port=5001, debug=True)
