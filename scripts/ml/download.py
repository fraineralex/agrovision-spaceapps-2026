# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Anonymous STAC discovery and small COG windows; no fabricated observations."""
import argparse
import calendar
from concurrent.futures import ThreadPoolExecutor
from datetime import date
import json
import warnings

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.warp import reproject, transform_bounds
from rasterio.windows import from_bounds
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from common import CACHE, DEFAULT_BBOX, STAC, WORLDCOVER, envelope, write_json


def session():
    s = requests.Session()
    s.mount('https://', HTTPAdapter(max_retries=Retry(total=4, backoff_factor=1,
                         status_forcelist=[429, 500, 502, 503, 504])))
    return s


def discover(start, end, bbox):
    """Follow every STAC page, using GET to support proxies that reject POST."""
    url = STAC + '/search'
    params = {'collections': 'sentinel-2-l2a', 'bbox': ','.join(map(str, bbox)),
              'datetime': f'{start}T00:00:00Z/{end}T23:59:59Z', 'limit': 100}
    items = []
    s = session()
    while url:
        response = s.get(url, params=params, timeout=90)
        response.raise_for_status()
        page = response.json()
        items.extend(page['features'])
        link = next((x for x in page.get('links', []) if x['rel'] == 'next'), None)
        url, params = (link['href'], None) if link else (None, None)
    return items


def grid(bbox):
    left, bottom, right, top = transform_bounds('EPSG:4326', 'EPSG:32619', *bbox)
    left, bottom = np.floor(left / 10) * 10, np.floor(bottom / 10) * 10
    right, top = np.ceil(right / 10) * 10, np.ceil(top / 10) * 10
    return from_origin(left, top, 10, 10), (int((top-bottom)/10), int((right-left)/10))


def read_window(url, transform, shape, categorical=False):
    """Read only intersecting blocks, then align every asset to one 10 m grid."""
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',
                      GDAL_HTTP_TIMEOUT='60', GDAL_HTTP_MAX_RETRY='3',
                      GDAL_HTTP_MULTIRANGE='YES', CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif'):
        with rasterio.open(url) as src:
            bounds = rasterio.transform.array_bounds(*shape, transform)
            bounds = transform_bounds('EPSG:32619', src.crs, *bounds, densify_pts=21)
            window = from_bounds(*bounds, src.transform).round_offsets().round_lengths()
            raw = src.read(1, window=window, boundless=True, fill_value=0)
            out = np.zeros(shape, dtype=raw.dtype)
            reproject(raw, out, src_transform=src.window_transform(window), src_crs=src.crs,
                      dst_transform=transform, dst_crs='EPSG:32619',
                      src_nodata=0, dst_nodata=0,
                      resampling=Resampling.nearest if categorical else Resampling.bilinear)
            return out


def reflectance(raw, asset, properties):
    band = asset['raster:bands'][0]
    scale = band['scale']
    # Earth Search COGs can already have the ESA BOA offset removed.
    applied = properties.get('earthsearch:boa_offset_applied')
    if applied is None:
        raise ValueError('Missing BOA offset provenance; refusing ambiguous NDVI')
    offset = 0 if applied else band.get('offset', 0)
    return raw.astype('float32') * scale + offset


def fetch_scene(item, transform, shape):
    path = CACHE / 'scenes' / (item['id'] + '.npz')
    if path.exists():
        with np.load(path) as cached:
            return cached['ndvi']
    assets, props = item['assets'], item['properties']
    red_raw = read_window(assets['red']['href'], transform, shape)
    nir_raw = read_window(assets['nir']['href'], transform, shape)
    scl = read_window(assets['scl']['href'], transform, shape, True)
    red = reflectance(red_raw, assets['red'], props)
    nir = reflectance(nir_raw, assets['nir'], props)
    # Only clear vegetation/non-vegetation. Reject unclassified, water, clouds,
    # shadows, snow, saturation and nodata, including a 20 m cloudy-edge buffer.
    from scipy.ndimage import binary_dilation
    bad = ~np.isin(scl, [4, 5])
    bad = binary_dilation(bad, iterations=2)
    valid = (~bad) & (red_raw > 0) & (nir_raw > 0) & (nir+red > 0)
    ndvi = np.full(shape, np.nan, dtype='float32')
    np.divide(nir-red, nir+red, out=ndvi, where=valid)
    ndvi[(ndvi < -1) | (ndvi > 1)] = np.nan
    path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(path, ndvi=ndvi.astype('float16'))
    return ndvi


def run(args):
    CACHE.mkdir(parents=True, exist_ok=True)
    if date.fromisoformat(args.end) > date.today():
        raise ValueError('End date must not be in the future')
    transform, shape = grid(args.bbox)
    metadata = CACHE / 'selection.json'
    config = {'bbox': args.bbox, 'start': args.start, 'end': args.end,
              'scenesPerMonth': args.scenes_per_month}
    if metadata.exists():
        selection = json.loads(metadata.read_text())
        if selection['config'] != config:
            raise ValueError('Cache configuration differs; use a separate checkout/cache directory')
    else:
        all_items = discover(args.start, args.end, args.bbox)
        months = sorted({i['properties']['datetime'][:7] for i in all_items})
        selected = []
        for month in months:
            candidates = [i for i in all_items if i['properties']['datetime'].startswith(month)]
            # Require full AOI coverage; rank tile-wide cloud cover, retain distinct days.
            from shapely.geometry import box, shape as geometry_shape
            candidates = [i for i in candidates if geometry_shape(i['geometry']).covers(box(*args.bbox))]
            candidates.sort(key=lambda i: (i['properties']['eo:cloud_cover'], i['id']))
            days = set()
            for item in candidates:
                day = item['properties']['datetime'][:10]
                if day not in days:
                    selected.append(item)
                    days.add(day)
                if len(days) >= args.scenes_per_month:
                    break
        selection = {**envelope(), 'config': config, 'discoveredCount': len(all_items),
                     'items': selected, 'selectionMethod': 'Lowest tile cloud cover, distinct days per month'}
        write_json(metadata, selection)
    items = selection['items']
    if not items:
        raise RuntimeError('No real scenes found')
    print(f'Selected {len(items)} real scenes from {selection["discoveredCount"]} STAC items; grid {shape}', flush=True)
    failures, arrays = [], {}
    def task(item):
        try:
            value = fetch_scene(item, transform, shape)
            print(f'{item["id"]}: clear land {np.isfinite(value).mean():.1%}', flush=True)
            return item['id'], value, None
        except Exception as exc:
            return item['id'], None, str(exc)
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for scene_id, value, error in pool.map(task, items):
            if error:
                failures.append({'id': scene_id, 'error': error})
                print(f'FAILED {scene_id}: {error}', flush=True)
            else:
                arrays[scene_id] = value
    # Calendar months include gaps, including months absent from the STAC search.
    months = []
    year, month = map(int, args.start[:7].split('-'))
    while f'{year:04d}-{month:02d}' <= args.end[:7]:
        months.append(f'{year:04d}-{month:02d}')
        month += 1
        if month == 13:
            year, month = year+1, 1
    monthly, counts = [], []
    for month in months:
        values = [arrays[i['id']] for i in items if i['id'] in arrays
                  and i['properties']['datetime'].startswith(month)]
        if values:
            cube = np.stack(values)
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', RuntimeWarning)
                monthly.append(np.nanmedian(cube, axis=0))
            counts.append(np.isfinite(cube).sum(axis=0).astype('uint8'))
        else:
            monthly.append(np.full(shape, np.nan))
            counts.append(np.zeros(shape, dtype='uint8'))
    wc = read_window(WORLDCOVER, transform, shape, True)
    np.savez_compressed(CACHE / 'monthly.npz', ndvi=np.array(monthly, dtype='float32'),
                        clear_count=np.array(counts), worldcover=wc,
                        months=np.array(months), transform=np.array(tuple(transform)[:6]))
    write_json(CACHE / 'acquisition.json', {**envelope(), 'config': config,
               'months': months, 'shape': list(shape), 'crs': 'EPSG:32619',
               'transform': list(transform)[:6], 'failedScenes': failures,
               'successfulSceneIds': list(arrays), 'worldcoverUrl': WORLDCOVER,
               'worldcoverClasses': dict(zip(*[x.tolist() for x in np.unique(wc, return_counts=True)]))})
    print(f'Saved monthly cache; {len(failures)} failed scenes', flush=True)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--start', default='2024-01-01')
    p.add_argument('--end', default='2026-11-14')
    p.add_argument('--bbox', type=float, nargs=4, default=DEFAULT_BBOX)
    p.add_argument('--scenes-per-month', type=int, default=2)
    p.add_argument('--workers', type=int, default=4)
    run(p.parse_args())
