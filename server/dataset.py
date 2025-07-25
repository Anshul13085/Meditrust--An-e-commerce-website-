import pandas as pd
import random
import numpy as np
from faker import Faker
from datetime import datetime

# Load the product Excel sheet
df = pd.read_excel("medicines.xlsx")
df.columns = df.columns.str.strip()

# Extract SR.NO. values
products = df[['SR.NO.']].dropna().astype(int)['SR.NO.'].tolist()

# Faker setup for dates
fake = Faker()
start_date = datetime(2023, 1, 1)
end_date = datetime(2025, 1, 1)

# Generate 1000 order entries
orders = []
order_history = {}

for i in range(2000):
    order_id = f"ORD{100000 + i}"
    sr_no = random.choice(products)
    order_date = fake.date_between(start_date=start_date, end_date=end_date)
    quantity = random.choice([10, 20, 30, 50])
    reordered = "Yes" if sr_no in order_history else "No"
    order_history.setdefault(sr_no, []).append(order_date)

    orders.append({
        "OrderID": order_id,
        "SR.NO.": sr_no,
        "OrderDate": order_date,
        "Quantity": quantity,
        "Reordered": reordered
    })

# Create DataFrame and sort by OrderDate
orders_df = pd.DataFrame(orders).sort_values("OrderDate")

# Feature engineering for time series prediction
orders_df['OrderDate'] = pd.to_datetime(orders_df['OrderDate'])
orders_df['DayOfWeek'] = orders_df['OrderDate'].dt.dayofweek
orders_df['Month'] = orders_df['OrderDate'].dt.month
orders_df['WeekOfYear'] = orders_df['OrderDate'].dt.isocalendar().week

# Rolling quantity per product (5-day rolling window)
orders_df['RollingQty5'] = orders_df.groupby('SR.NO.')['Quantity'].transform(lambda x: x.rolling(5, min_periods=1).mean())

# Lag features (previous quantities)
for lag in range(1, 4):  # lag features for t-1, t-2, t-3
    orders_df[f'Qty_t-{lag}'] = orders_df.groupby('SR.NO.')['Quantity'].shift(lag)

# Drop rows with NaN values due to lag features
orders_df = orders_df.dropna().reset_index(drop=True)

# Save the final dataset with the features
orders_df.to_excel("enhanced_user_order_history.xlsx", index=False)
print("Enhanced dataset saved as enhanced_user_order_history.xlsx")
