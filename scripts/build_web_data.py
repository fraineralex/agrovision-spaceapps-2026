#!/usr/bin/env python3
"""Export a compact offline demo from the versioned NASA POWER cache.

AI assistance: Codex (OpenAI), 2026-11-14. Frainer review pending; see AI_USAGE.md.
"""
import csv
import json
import statistics
import hashlib
import shutil
from collections import defaultdict
from pathlib import Path
from landsat_features import export as export_landsat

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/cache/power_daily_18.8_-71.23_2016-01-01_2025-12-31.csv"
TARGET = ROOT / "web/public/data/climate-series.json"


def main() -> None:
    groups: dict[int, list[dict[str, str]]] = defaultdict(list)
    with SOURCE.open(newline="", encoding="utf-8") as stream:
        for row in csv.DictReader(stream):
            groups[int(row["date"][4:6])].append(row)

    monthly = []
    for month, rows in sorted(groups.items()):
        def average(field: str) -> float:
            values = [float(row[field]) for row in rows if float(row[field]) > -900]
            return round(statistics.mean(values), 2)

        monthly.append({
            "month": month,
            "temperatureC": average("T2M"),
            "precipitationMmDay": average("PRECTOTCORR"),
            "relativeHumidityPct": average("RH2M"),
            "sampleDays": len(rows),
        })

    payload = {
        "schemaVersion": 1,
        "generatedAt": "2026-11-14T00:00:00Z",
        "caseId": "san-juan-valley-demo",
        "source": {
            "name": "NASA POWER Daily Point API",
            "url": "https://power.larc.nasa.gov/",
            "periodStart": "2016-01-01",
            "periodEnd": "2025-12-31",
            "units": {"temperature": "°C", "precipitation": "mm/day", "relativeHumidity": "%"},
            "scale": "regional grid (~0.5° / ~50 km; not parcel measurement)",
            "method": "NASA POWER gridded meteorological data; monthly means calculated from cached daily values",
            "quality": "reanalysis; local cache sampled at 18.80, -71.23",
        },
        "monthlyClimatology": monthly,
        "notes": [
            "NASA POWER is gridded reanalysis and does not represent an individual parcel.",
            "Precipitation shown here is NASA POWER PRECTOTCORR; the team inventory identifies POWER rainfall as weak in the tropics. Use IMERG for rainfall analysis when available.",
        ],
    }
    TARGET.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    public = TARGET.parent
    shutil.copyfile(public / "demo-parcels.geojson", public / "demo-parcels.json")
    shutil.copyfile(ROOT / "data/cache/fao56-crops.json", public / "crop-catalog.json")
    gibs = ROOT / "data/cache/gibs"
    entries = json.loads((gibs / "manifest.json").read_text())
    for entry in entries:
        shutil.copyfile(gibs / entry["file"], public / entry["file"])
    metadata = {"schemaVersion": 1, "generatedAt": payload["generatedAt"], "caseId": payload["caseId"],
                "source": "NASA EOSDIS GIBS; imagery previews, not numeric measurements",
                "quality": "Satellite visualization; parcel inference unsupported", "tiles": entries}
    (public / "gibs-sample.json").write_text(json.dumps(metadata, indent=2) + "\n")
    export_landsat(ROOT)
    files = [p for p in sorted(public.iterdir()) if p.name != "manifest.json" and p.is_file()]
    manifest = {"schemaVersion": 1, "generatedAt": payload["generatedAt"], "caseId": payload["caseId"],
                "mode": "offline-demo", "files": [p.name for p in files],
                "sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
                "limitations": ["Synthetic demo boundaries; no identified farms.",
                  "Landsat NDVI is a small real point sample; no trained classifier, irrigation inference, IMERG time series, soil, pest or market scores.",
                  "FAO coefficient-day proxy is not irrigation demand or soil health."]}
    (public / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {len(monthly)} monthly groups to {TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
