import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DERIVED = ROOT / "data" / "derived" / "water_climate"
CACHE_POWER = ROOT / "data" / "cache" / "power_daily_18.8_-71.23_2016-01-01_2025-12-31.csv"
POWER_CSV = DERIVED / "power_daily_ag_18.8_-71.23_2016-01-01_2025-12-31.csv"

LAT = 18.8
LON = -71.23
PERIOD_START = "2016-01-01"
PERIOD_END = "2025-12-31"
CASE_ID = "valle-san-juan"
SCHEMA_VERSION = "1.0.0"
BBOX = {"lonMin": -71.40, "lonMax": -71.05, "latMin": 18.65, "latMax": 18.95}
TEMPLATE_YEAR = 2021

POWER_URL = "https://power.larc.nasa.gov/"
FAO56_URL = "https://www.fao.org/4/x0490e/x0490e00.htm"
IDIAF_BEAN_URL = "https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf"
CROPWAT_CITE = (
    "Smith, M. 1992. CROPWAT: a computer program for irrigation planning and "
    "management. FAO Irrigation and Drainage Paper 46. The USDA SCS monthly "
    "option used here is Peff = P*(125-0.2*P)/125 when P<=250 mm, else "
    "Peff = 125+0.1*P."
)


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def dump(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def base_document():
    return {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": now_iso(),
        "caseId": CASE_ID,
    }


def provenance(source_id, source_name, url, method, citation, scale, resolution, limitation_period=True):
    item = {
        "sourceId": source_id,
        "sourceName": source_name,
        "url": url,
        "periodStart": PERIOD_START if limitation_period else None,
        "periodEnd": PERIOD_END if limitation_period else None,
        "resolution": resolution,
        "scale": scale,
        "method": method,
        "citation": citation,
    }
    return item


def metric(metric_id, label, value, unit, confidence, quality, provenance_item, limitation):
    if isinstance(value, float):
        value = round(value, 4)
    return {
        "id": metric_id,
        "label": label,
        "value": value,
        "unit": unit,
        "confidence": confidence,
        "quality": quality,
        "provenance": provenance_item,
        "limitation": limitation,
    }
