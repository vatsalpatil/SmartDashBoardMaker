import polars as pl
import requests
from io import StringIO

# Direct link for this specific sheet
sheet_url = "https://docs.google.com/spreadsheets/d/1L5F05Qc7VG_azdTjvAlHxS4QKrtfAVA3lo_5Pab-ktg/export?format=csv"

# Stream the data (no file saved)
response = requests.get(sheet_url)
response.raise_for_status()

# Load directly into Polars (very fast & memory efficient)
df = pl.read_csv(StringIO(response.text))

print(df.head())