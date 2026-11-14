#!/usr/bin/env python3
"""Descarga datos diarios de NASA POWER a data/cache. Generado con asistencia de IA (Codex)."""
import argparse
import csv
from datetime import date
from pathlib import Path
import requests

API = "https://power.larc.nasa.gov/api/temporal/daily/point"
ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description="Descarga clima diario de NASA POWER")
    parser.add_argument("--lat", type=float, required=True)
    parser.add_argument("--lon", type=float, required=True)
    parser.add_argument("--start", type=date.fromisoformat, required=True, help="YYYY-MM-DD")
    parser.add_argument("--end", type=date.fromisoformat, required=True, help="YYYY-MM-DD")
    parser.add_argument("--output", type=Path, help="Ruta CSV (por defecto data/cache/)")
    args = parser.parse_args()
    if args.start > args.end:
        parser.error("--start debe ser anterior o igual a --end")
    params = {
        "parameters": "T2M,PRECTOTCORR,RH2M",
        "community": "AG",
        "longitude": args.lon,
        "latitude": args.lat,
        "start": args.start.strftime("%Y%m%d"),
        "end": args.end.strftime("%Y%m%d"),
        "format": "JSON",
    }
    response = requests.get(API, params=params, timeout=90)
    response.raise_for_status()
    payload = response.json()
    props = payload.get("properties", {})
    param_data = props.get("parameter", {})
    if not param_data:
        raise RuntimeError(f"Respuesta POWER sin parámetros: {payload}")
    names = list(param_data)
    dates = sorted(set().union(*(set(param_data[k]) for k in names)))
    output = args.output or ROOT / "data" / "cache" / f"power_daily_{args.lat}_{args.lon}_{args.start}_{args.end}.csv"
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "latitude", "longitude", *names])
        for day in dates:
            writer.writerow([day, args.lat, args.lon, *(param_data[k].get(day, "") for k in names)])
    print(f"Guardadas {len(dates)} fechas en {output}")


if __name__ == "__main__":
    main()
