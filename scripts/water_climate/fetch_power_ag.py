import csv
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DERIVED, LAT, LON, PERIOD_END, PERIOD_START, POWER_CSV, ROOT, dump

API = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = [
    "T2M_MAX",
    "T2M_MIN",
    "T2M",
    "RH2M",
    "WS2M",
    "ALLSKY_SFC_SW_DWN",
    "PRECTOTCORR",
]


def fetch(output=POWER_CSV):
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "longitude": LON,
        "latitude": LAT,
        "start": PERIOD_START.replace("-", ""),
        "end": PERIOD_END.replace("-", ""),
        "format": "JSON",
    }
    response = requests.get(API, params=params, timeout=180)
    response.raise_for_status()
    payload = response.json()
    header = payload.get("header") or {}
    if header.get("fill_value") is None:
        raise RuntimeError("POWER response has no fill_value")
    coordinates = payload.get("geometry", {}).get("coordinates") or []
    if len(coordinates) < 3:
        raise RuntimeError(f"POWER geometry has no elevation: {coordinates}")
    parameter = payload.get("properties", {}).get("parameter") or {}
    missing = [name for name in PARAMETERS if name not in parameter]
    if missing:
        raise RuntimeError(f"POWER response missing {missing}")
    dates = sorted(set().union(*(set(parameter[name]) for name in PARAMETERS)))
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            ["date", "latitude", "longitude", "elevation_m", *PARAMETERS]
        )
        for day in dates:
            writer.writerow(
                [
                    day,
                    LAT,
                    LON,
                    coordinates[2],
                    *[parameter[name].get(day, "") for name in PARAMETERS],
                ]
            )
    meta = {
        "requestUrl": response.url,
        "apiVersion": (header.get("api") or {}).get("version"),
        "sources": header.get("sources"),
        "fillValue": header.get("fill_value"),
        "timeStandard": header.get("time_standard"),
        "latitude": LAT,
        "longitude": LON,
        "elevationM": coordinates[2],
        "parameterUnits": payload.get("parameters"),
        "rowCount": len(dates),
        "output": str(output.relative_to(ROOT)),
    }
    meta_path = DERIVED / "power_request.json"
    dump(meta_path, meta)
    return output, meta


if __name__ == "__main__":
    path, meta = fetch()
    print(json.dumps({"csv": str(path), "rows": meta["rowCount"], "elevationM": meta["elevationM"]}))
