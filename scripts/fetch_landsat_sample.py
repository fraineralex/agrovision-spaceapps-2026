#!/usr/bin/env python3
"""Real Landsat sample via public STAC/point service. AI: Codex/OpenAI, 2026-11-14; Frainer review pending."""
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests

ROOT = Path(__file__).resolve().parents[1]
STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
POINT = "https://planetarycomputer.microsoft.com/api/data/v1/item/point"

def main():
    response = requests.get(STAC, params={"collections": "landsat-c2-l2", "bbox": "-71.28,18.77,-71.19,18.82", "datetime": "2024-01-01T00:00:00Z/2024-12-31T23:59:59Z", "limit": 100}, timeout=30)
    response.raise_for_status()
    features = response.json()["features"]
    # One least-cloudy available scene per two-month block, at most six scenes.
    selected = []
    for block in range(6):
        candidates = [f for f in features if (int(f["properties"]["datetime"][5:7]) - 1) // 2 == block]
        if candidates:
            selected.append(min(candidates, key=lambda f: f["properties"].get("eo:cloud_cover", 100)))
    parcels = json.loads((ROOT / "web/public/data/demo-parcels.geojson").read_text())["features"]
    def fetch(task):
        feature, parcel = task
        lon, lat = parcel["geometry"]["coordinates"][0][0]
        lon, lat = round(lon + .005, 6), round(lat + .004, 6)
        params = [("collection", "landsat-c2-l2"), ("item", feature["id"]), ("assets", "red"), ("assets", "nir08"), ("assets", "qa_pixel"), ("assets", "qa_radsat")]
        url = f"{POINT}/{lon},{lat}"
        result = requests.get(url, params=params, timeout=30)
        result.raise_for_status()
        return {"parcelId": parcel["id"], "sceneId": feature["id"], "date": feature["properties"]["datetime"][:10], "sceneCloudPct": feature["properties"].get("eo:cloud_cover"), "url": result.url, "response": result.json()}
    with ThreadPoolExecutor(max_workers=3) as pool:
        rows = list(pool.map(fetch, [(feature, parcel) for feature in selected for parcel in parcels]))
    payload = {"schemaVersion": 1, "generatedAt": "2026-11-14T00:00:00Z", "caseId": "san-juan-valley-demo", "source": {"name": "USGS/NASA Landsat Collection 2 Level-2 via Microsoft Planetary Computer", "url": "https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-reflectance", "service": STAC, "period": "2024-01-01/2024-12-31; six selected scenes", "scale": "30 m point pixels at synthetic demo area centers; not parcel averages", "quality": "Small real sample; QA masked; no field validation", "method": "satellite_observation"}, "rows": rows}
    (ROOT / "data/cache/landsat_point_sample.json").write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Cached {len(rows)} real Landsat point observations", flush=True)

if __name__ == "__main__":
    main()
