from fastapi import FastAPI
from pydantic import BaseModel
import random
from datetime import datetime

app = FastAPI()


# -----------------------------
# Data Model
# -----------------------------
class StockRow(BaseModel):
    symbol: str
    price: float
    change: float
    volume: int
    time: str


SYMBOLS = ["AAPL", "GOOG", "MSFT", "TSLA", "AMZN"]

# ✅ Persist state globally (important)
base_prices = {s: random.uniform(100, 500) for s in SYMBOLS}


# -----------------------------
# Simple API Endpoint
# -----------------------------
@app.get("/live-table")
def get_live_table():
    rows = []

    for symbol in SYMBOLS:
        change = random.uniform(-2, 2)
        base_prices[symbol] += change

        rows.append({
            "Symbol": symbol,
            "Price": round(base_prices[symbol], 2),
            "Change": round(change, 2),
            "Volume": random.randint(1000, 10000),
            "Time": datetime.now().strftime("%H:%M:%S")
        })

    return {
        "data": rows,
        "count": len(rows)
    }


# -----------------------------
# Health Check
# -----------------------------
@app.get("/")
def root():
    return {"status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("RealtimeDataUpdateTest:app", host="0.0.0.0", port=8080, reload=True)