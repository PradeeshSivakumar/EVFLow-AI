import pandas as pd
import os

PROCESSED_DATA_FILE = r'e:\EVFlow AI\data\processed\processed_data.csv'

if not os.path.exists(PROCESSED_DATA_FILE):
    print("File not found!")
    exit(1)

df = pd.read_csv(PROCESSED_DATA_FILE)
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(f"Nulls: \n{df.isnull().sum()}")
print("\nFirst 5 rows:")
print(df.head())

# Check for logic
if df['Available Ports'].min() < 0:
    print("WARNING: Negative Available Ports detected!")
    
if df['Energy (kWh)'].isnull().any():
    print("WARNING: Null Energy detected!")
    
if df['future_energy'].isnull().any():
    print("WARNING: Null Future Energy detected!")
