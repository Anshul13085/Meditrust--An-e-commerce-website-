import pandas as pd
import pymysql
import math

# Load Excel
df = pd.read_excel("medicines.xlsx")

# Clean column names
df.columns = df.columns.str.strip().str.replace('\n', ' ').str.replace('\xa0', ' ').str.upper()

# Rename problematic column to match the database column name
df.rename(columns={
    'PACK SIZE                  (T=TABLETS, C=CAPSULES)': 'PACK_SIZE'
}, inplace=True)

# MySQL connection
conn = pymysql.connect(
    host="localhost",
    user="root",
    password="InsIdIous",
    database="meditrust"
)
cursor = conn.cursor()

# Replace NaN with None manually for each value
def safe_value(val):
    if isinstance(val, float) and math.isnan(val):
        return None
    return val

# Insert data
for index, row in df.iterrows():
    sql = """
    INSERT INTO medicines (
        sr_number, product_name, generic_name, composition, packet_size,
        uses, transfer_price, storage_condition
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        safe_value(row['SR.NO.']),
        safe_value(row['PRODUCT NAME']),
        safe_value(row['GENERIC NAME']),
        safe_value(row['COMPOSITION']),
        safe_value(row['PACK_SIZE']),  # Updated column name here
        safe_value(row['USES']),
        safe_value(row['TRANSFER PRICE (RS)']),
        safe_value(row['STORAGE CONDITION'])
    ))

conn.commit()
cursor.close()
conn.close()
