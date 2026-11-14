# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Shared paths and strict JSON serialization for the public, approximate pilot."""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'data/cache/ml'
DERIVED = ROOT / 'data/derived'
MODEL = ROOT / 'data/model'
STAC = 'https://earth-search.aws.element84.com/v1'
WORLDCOVER = ('https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/'
              'ESA_WorldCover_10m_2021_v200_N18W072_Map.tif')
DEFAULT_BBOX = [-71.28, 18.77, -71.24, 18.81]


def utcnow():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')
    temporary.replace(path)


def envelope():
    return {'schemaVersion': '1.0.0', 'generatedAt': utcnow(),
            'caseId': 'san-juan-ml-pilot',
            'aiAssistance': {'tool': 'Codex (OpenAI)', 'date': '2026-11-14',
                             'humanReview': 'Pending Frainer review'}}
