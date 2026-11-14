"""API mínima de AgroVision."""
import csv
from pathlib import Path
from fastapi import FastAPI, HTTPException

app = FastAPI(title="AgroVision API", version="0.1.0")
CACHE_DIR = Path(__file__).resolve().parents[1] / "data" / "cache"
DEMO_CSV = CACHE_DIR / "power_daily_18.8_-71.23_2016-01-01_2025-12-31.csv"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/climate")
def climate():
    if not DEMO_CSV.exists():
        raise HTTPException(status_code=404, detail="No se encontró la caché de demostración")
    with DEMO_CSV.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    return {
        "source": "NASA POWER Daily Point API",
        "latitude": 18.80,
        "longitude": -71.23,
        "period": "2016-01-01/2025-12-31",
        "spatial_note": "Dato de rejilla regional; no es medición de parcela.",
        "count": len(rows),
        "data": rows,
    }
