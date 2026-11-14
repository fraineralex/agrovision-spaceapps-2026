# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Acquire a bounded XYZ mosaic, preserving provenance and a reusable local cache."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
import math
from pathlib import Path
import time

import numpy as np
from PIL import Image
import rasterio
from rasterio.transform import from_origin
import requests

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'data/cache/fields'
URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'


def tile(lon, lat, zoom):
    return (int((lon + 180) / 360 * 2**zoom),
            int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2**zoom))


def run(args):
    CACHE.mkdir(parents=True, exist_ok=True)
    existing = CACHE / f'{args.name}.json'
    previous = json.loads(existing.read_text()) if existing.exists() else None
    if previous and (previous['requested_bbox'] != args.bbox or previous['zoom'] != args.zoom):
        raise ValueError('Existing acquisition differs; use another --name to protect cached inference')
    west, south, east, north = args.bbox
    x0, y0 = tile(west, north, args.zoom)
    x1, y1 = tile(east, south, args.zoom)
    keys = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    if len(keys) > args.max_tiles:
        raise ValueError(f'{len(keys)} tiles exceed explicit budget {args.max_tiles}')
    service = CACHE / 'esri_service.json'
    if not service.exists():
        if args.offline:
            raise FileNotFoundError(service)
        response = requests.get(URL, params={'f': 'pjson'}, timeout=60)
        response.raise_for_status()
        service.write_text(json.dumps(response.json(), indent=2) + '\n')

    def fetch(key):
        x, y = key
        path = CACHE / f'{args.zoom}_{x}_{y}.jpg'
        href = f'{URL}/tile/{args.zoom}/{y}/{x}'
        if not path.exists():
            if args.offline:
                raise FileNotFoundError(path)
            for attempt in range(4):
                try:
                    response = requests.get(href, timeout=45)
                    response.raise_for_status()
                    Image.open(BytesIO(response.content)).verify()
                    path.write_bytes(response.content)
                    break
                except (requests.RequestException, OSError):
                    if attempt == 3:
                        raise
                    time.sleep(2**attempt)
        with Image.open(path) as im:
            rgb = np.asarray(im.convert('RGB'))
        if rgb.shape != (256, 256, 3):
            raise ValueError(f'Unexpected tile dimensions: {path}')
        return key, rgb, {'file': path.name, 'url': href,
                         'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}

    size = 40075016.68557849 / 2**args.zoom / 256
    transform = from_origin(-20037508.342789244 + x0 * 256 * size,
                            20037508.342789244 - y0 * 256 * size, size, size)
    target = CACHE / f'{args.name}.tif'
    records = []
    with rasterio.open(target, 'w', driver='GTiff', width=(x1-x0+1)*256,
                       height=(y1-y0+1)*256, count=3, dtype='uint8',
                       crs='EPSG:3857', transform=transform, compress='deflate',
                       tiled=True) as out:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for (x, y), rgb, record in pool.map(fetch, keys):
                out.write(rgb.transpose(2, 0, 1), window=rasterio.windows.Window(
                    (x-x0)*256, (y-y0)*256, 256, 256))
                records.append(record)
                if len(records) % 50 == 0:
                    print(f'{len(records)}/{len(keys)} tiles', flush=True)
    manifest = {'source': 'Esri World Imagery', 'url': URL,
                'attribution': json.loads(service.read_text())['copyrightText'],
                'retrieved_at': previous['retrieved_at'] if previous else datetime.now(timezone.utc).isoformat(),
                'imagery_observed_at': None,
                'imagery_date_note': 'Acquisition date not supplied by XYZ tiles; unverified.',
                'requested_bbox': args.bbox, 'zoom': args.zoom,
                'pixel_size_web_mercator_m': size, 'tile_count': len(keys),
                'mosaic_sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                'tiles': records, 'ai_assistance': 'Codex (OpenAI), 2026-11-14; Frainer review pending'}
    (CACHE / f'{args.name}.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Cached {target}, {len(keys)} tiles', flush=True)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--bbox', type=float, nargs=4, default=[-71.28, 18.77, -71.24, 18.81])
    p.add_argument('--zoom', type=int, choices=[17, 18], default=17)
    p.add_argument('--name', default='san_juan_core')
    p.add_argument('--max-tiles', type=int, default=1200)
    p.add_argument('--workers', type=int, default=6)
    p.add_argument('--offline', action='store_true')
    run(p.parse_args())
