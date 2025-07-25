# scripts/infer_single.py

import torch
from transformers import BertForSequenceClassification, BertTokenizer
import os

def predict_license_validity(license_number: str):
    # Load the pre-trained model and tokenizer
    model_path = r"C:\Users\anshu\OneDrive\Desktop\BERT_LICENSE_CHECKER\models\bert_license_classifier"
    model = BertForSequenceClassification.from_pretrained(model_path)
    tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

    # Tokenize the input
    inputs = tokenizer(license_number, padding="max_length", truncation=True, max_length=20, return_tensors="pt")
    
    # Make the prediction
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        prediction = torch.argmax(logits, dim=-1).item()

    return "Valid" if prediction == 1 else "Invalid"

if __name__ == "__main__":
    license_number = input("Enter a license number to check: ")
    result = predict_license_validity(license_number)
    print(f"The license number is: {result}")
