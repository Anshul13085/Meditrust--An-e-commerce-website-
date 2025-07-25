import os
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Embedding, Concatenate, Dropout, Reshape
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.model_selection import train_test_split
import joblib

# Load data
df = pd.read_excel(r"C:\Users\anshu\OneDrive\Desktop\EDAI SY 2\Meditrust\server\enhanced_user_order_history.xlsx")
df['OrderDate'] = pd.to_datetime(df['OrderDate'])

# Sort and engineer time-based features
df = df.sort_values(by=['SR.NO.', 'OrderDate'])
df['DayOfWeek'] = df['OrderDate'].dt.dayofweek
df['Month'] = df['OrderDate'].dt.month
df['Day'] = df['OrderDate'].dt.day
df['Year'] = df['OrderDate'].dt.year
df['WeekOfYear'] = df['OrderDate'].dt.isocalendar().week

# Encode product IDs
le = LabelEncoder()
df['SR.NO.'] = le.fit_transform(df['SR.NO.'])
num_products = df['SR.NO.'].nunique()

# Rolling quantity per product (past 5 days)
df['RollingQuantity'] = df.groupby('SR.NO.')['Quantity'].rolling(window=5, min_periods=1).sum().reset_index(level=0, drop=True)

# Drop any missing values
df.dropna(inplace=True)

# Sequence window size
SEQ_LEN = 5

# Prepare sequences
X_seq, X_cat, y = [], [], []

for pid in df['SR.NO.'].unique():
    temp = df[df['SR.NO.'] == pid]

    if len(temp) > SEQ_LEN:
        for i in range(len(temp) - SEQ_LEN):
            seq = temp.iloc[i:i+SEQ_LEN]
            target = temp.iloc[i+SEQ_LEN]['Quantity']

            seq_features = seq[['RollingQuantity', 'DayOfWeek', 'Month', 'Day', 'WeekOfYear']].values
            X_seq.append(seq_features)
            X_cat.append(pid)
            y.append(target)

# Convert to numpy arrays
X_seq = np.array(X_seq)
X_cat = np.array(X_cat).reshape(-1, 1)
y = np.array(y)

# Check valid sequences
if len(X_seq) == 0:
    raise ValueError("No valid sequences created. Check the sequence length and data.")

# Scale sequence features
seq_scaler = MinMaxScaler()
X_seq = seq_scaler.fit_transform(X_seq.reshape(-1, X_seq.shape[-1])).reshape(X_seq.shape)

# Scale target
y_scaler = MinMaxScaler()
y = y_scaler.fit_transform(y.reshape(-1, 1))

# Train-test split
X_train_seq, X_val_seq, X_train_cat, X_val_cat, y_train, y_val = train_test_split(
    X_seq, X_cat, y, test_size=0.1, shuffle=False
)

# Model architecture
seq_input = Input(shape=(SEQ_LEN, X_seq.shape[2]), name='seq_input')
prod_input = Input(shape=(1,), name='product_input')

# Embedding for product ID
embed = Embedding(input_dim=num_products, output_dim=8)(prod_input)
embed = Dropout(0.2)(embed)
embed = Reshape((8,))(embed)

# LSTM path
lstm_out = LSTM(64)(seq_input)

# Merge and dense
combined = Concatenate()([lstm_out, embed])
x = Dense(64, activation='relu')(combined)
x = Dropout(0.3)(x)
output = Dense(1, activation='linear')(x)

model = Model(inputs=[seq_input, prod_input], outputs=output)
model.compile(optimizer=Adam(1e-4), loss='mae', metrics=['mae'])
model.summary()

# Train
es = EarlyStopping(patience=5, restore_best_weights=True)
model.fit(
    [X_train_seq, X_train_cat],
    y_train,
    validation_data=([X_val_seq, X_val_cat], y_val),
    epochs=100,
    batch_size=32,
    callbacks=[es],
    verbose=1
)

# Evaluate
val_loss, val_mae = model.evaluate([X_val_seq, X_val_cat], y_val)
print(f'Validation MAE: {val_mae:.4f}')

# Save everything
os.makedirs("models", exist_ok=True)
model.save("models/demand_predictor.keras")
joblib.dump(seq_scaler, "models/seq_scaler.pkl")
joblib.dump(y_scaler, "models/y_scaler.pkl")
joblib.dump(le, "models/label_encoder.pkl")
