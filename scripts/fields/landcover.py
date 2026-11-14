# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Cache only the WorldCover 2021 window used to reject non-cropland candidates."""
import argparse
import hashlib
import json
from datetime import datetime, timezone

import rasterio
from rasterio.windows import from_bounds
from acquire import CACHE

URL = ('https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/'
       'ESA_WorldCover_10m_2021_v200_N18W072_Map.tif')


def run(name):
    manifest = json.loads((CACHE / f'{name}.json').read_text())
    bbox = manifest['requested_bbox']
    path = CACHE / f'{name}_worldcover.tif'
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', GDAL_HTTP_TIMEOUT='60',
                      GDAL_HTTP_MAX_RETRY='2', CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif'):
        with rasterio.open(URL) as src:
            window = from_bounds(*bbox, src.transform).round_offsets().round_lengths()
            data = src.read(1, window=window)
            profile = src.profile.copy()
            profile.update(width=data.shape[1], height=data.shape[0],
                           transform=src.window_transform(window), compress='deflate')
            with rasterio.open(path, 'w', **profile) as dst:
                dst.write(data, 1)
    metadata = {'source': 'ESA WorldCover 2021 v200', 'url': URL,
                'period': '2021', 'resolution_m': 10, 'license': 'CC-BY-4.0',
                'citation': 'Zanaga et al. (2022), ESA WorldCover 10 m 2021 v200, doi:10.5281/zenodo.7254221',
                'retrieved_at': datetime.now(timezone.utc).isoformat(),
                'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'bbox': bbox, 'purpose': 'Coarse land cover rejection, not farm boundaries',
                'ai_assistance': 'Codex (OpenAI), 2026-11-14; Frainer review pending'}
    path.with_suffix('.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(path, data.shape, flush=True)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--name', default='san_juan_core')
    run(p.parse_args().name)
