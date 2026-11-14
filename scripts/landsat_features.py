#!/usr/bin/env python3
"""Preliminary Landsat features; no trained classifier. AI: Codex/OpenAI, 2026-11-14; Frainer review pending."""
import json
from pathlib import Path


def derive(row):
    values = dict(zip(row["response"]["band_names"], row["response"]["values"]))
    red, nir = values["red_b1"], values["nir08_b1"]
    qa, saturation = values["qa_pixel_b1"], values["qa_radsat_b1"]
    valid = all(value is not None for value in [red, nir, qa, saturation])
    # USGS QA_PIXEL bits 0–5: fill/dilated cloud/cirrus/cloud/shadow/snow.
    # Bit 7: water. Red/NIR saturation bits 3/4, terrain occlusion bit 11.
    valid = valid and not (int(qa) & 0b10111111) and not (int(saturation) & ((1 << 3) | (1 << 4) | (1 << 11)))
    if valid:
        red = red * 0.0000275 - 0.2
        nir = nir * 0.0000275 - 0.2
        valid = red >= 0 and nir >= 0 and red + nir > 0
    ndvi = round((nir - red) / (nir + red), 4) if valid else None
    label = "masked / missing"
    if ndvi is not None:
        label = "low vegetation signal" if ndvi < 0.2 else "vegetation signal" if ndvi >= 0.4 else "ambiguous cover"
    return {"parcelId": row["parcelId"], "date": row["date"], "sceneId": row["sceneId"], "ndvi": ndvi, "unit": "unitless NDVI", "signal": label, "confidence": None, "quality": "preliminary, not field-validated" if valid else "QA masked; not interpolated", "sourceUrl": row["url"]}


def export(root: Path):
    raw = json.loads((root / "data/cache/landsat_point_sample.json").read_text())
    output = {key: raw[key] for key in ["schemaVersion", "generatedAt", "caseId", "source"]}
    output.update(method="USGS scaled red/NIR NDVI; QA_PIXEL and QA_RADSAT mask; uncalibrated exploratory thresholds at 0.2 and 0.4", limitation="Six selected 2024 dates per synthetic area, one 30 m pixel each; not monthly coverage or parcel means. No training labels or accuracy estimate; bare soil/crop identity/irrigation cannot be confirmed.", irrigationClassification=None, rows=[derive(row) for row in raw["rows"]])
    (root / "web/public/data/ndvi-series.json").write_text(json.dumps(output, indent=2) + "\n")
