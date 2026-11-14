# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""CPU MobileSAM proposals; conservative filtering, de-duplication and offline export."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import time

import cv2
import numpy as np
from PIL import Image, ImageDraw, PngImagePlugin
from pyproj import Transformer
import rasterio
from rasterio.enums import Resampling
from rasterio.features import shapes
from rasterio.transform import Affine
from rasterio.vrt import WarpedVRT
from rasterio.windows import Window
from shapely.geometry import box, mapping, shape
from shapely.ops import transform as project
from shapely.strtree import STRtree

from acquire import CACHE, ROOT

PARAMS = {'crop_size_px': 1536, 'stride_px': 1024, 'inference_size_px': 1024,
          'points_per_side': 24, 'pred_iou_thresh': .86, 'stability_score_thresh': .92,
          'crop_n_layers': 0, 'min_mask_region_area': 150,
          'min_area_ha': .05, 'max_area_ha': 50, 'min_crop_fraction': .75,
          'max_built_water_fraction': .05, 'max_aspect': 12, 'min_compactness': .06}
TO_UTM = Transformer.from_crs(3857, 32619, always_xy=True).transform
TO_LONLAT = Transformer.from_crs(32619, 4326, always_xy=True).transform
TO_MERC = Transformer.from_crs(32619, 3857, always_xy=True).transform


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, separators=(',', ':'), allow_nan=False) + '\n')
    temp.replace(path)


def starts(length):
    side, stride = PARAMS['crop_size_px'], PARAMS['stride_px']
    return sorted(set(list(range(0, max(1, length-side+1), stride)) + [max(0, length-side)]))


def candidates(masks, rgb, cover, affine):
    result, rejected = [], Counter()
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    for mask in masks:
        pixels = mask['segmentation']
        ys, xs = np.where(pixels)
        if not len(xs):
            continue
        # Never export an artificial rectangle along an inference window edge.
        if min(xs.min(), ys.min(), rgb.shape[1]-1-xs.max(), rgb.shape[0]-1-ys.max()) <= 2:
            rejected['window_edge'] += 1
            continue
        crop_fraction = float((cover[pixels] == 40).mean())
        built_water = float(np.isin(cover[pixels], [50, 80]).mean())
        if crop_fraction < PARAMS['min_crop_fraction'] or built_water > PARAMS['max_built_water_fraction']:
            rejected['landcover'] += 1
            continue
        # RGB-only heuristics are conservative rejection, not semantic proof.
        blue_water = ((hsv[:, :, 0] > 85) & (hsv[:, :, 0] < 135) &
                      (hsv[:, :, 1] > 45))
        bright_roof = (hsv[:, :, 1] < 35) & (hsv[:, :, 2] > 175)
        if blue_water[pixels].mean() > .15 or bright_roof[pixels].mean() > .25:
            rejected['rgb_water_roof'] += 1
            continue
        components = [shape(g) for g, value in shapes(pixels.astype('uint8'),
                      mask=pixels, transform=affine) if value == 1]
        polygon = max(components, key=lambda g: g.area)
        if polygon.area < .85 * sum(g.area for g in components):
            rejected['fragmented'] += 1
            continue
        # Holes (e.g. trees, small farm structures) remain excluded.
        polygon = project(TO_UTM, polygon).simplify(.8, preserve_topology=True)
        area = polygon.area / 10000
        if not PARAMS['min_area_ha'] <= area <= PARAMS['max_area_ha']:
            rejected['area'] += 1
            continue
        corners = list(polygon.minimum_rotated_rectangle.exterior.coords)
        sides = [math.dist(corners[i], corners[i+1]) for i in range(4)]
        aspect = max(sides) / max(min(sides), 1e-9)
        compactness = 4 * math.pi * polygon.area / polygon.length**2
        if aspect > PARAMS['max_aspect'] or compactness < PARAMS['min_compactness']:
            rejected['road_shape'] += 1
            continue
        result.append({'geometry': mapping(polygon), 'predicted_iou': float(mask['predicted_iou']),
                       'stability': float(mask['stability_score']), 'crop_fraction': crop_fraction})
    return result, rejected


def deduplicate(records, aoi):
    """Prefer smaller complete masks; reject containing and overlapping alternatives."""
    records = sorted(records, key=lambda r: (shape(r['geometry']).area, -r['predicted_iou']))
    geometries = [shape(r['geometry']) for r in records]
    tree = STRtree(geometries)
    kept, accepted, rejected = [], set(), Counter()
    for index, (record, geom) in enumerate(zip(records, geometries)):
        if not aoi.covers(geom):
            rejected['outside_requested_bbox'] += 1
            continue
        conflict = False
        for other in tree.query(geom):
            if int(other) not in accepted:
                continue
            overlap = geom.intersection(geometries[other]).area
            # A second candidate is never allowed to swallow another field.
            if overlap > 25 or overlap / min(geom.area, geometries[other].area) > .02:
                conflict = True
                break
        if conflict:
            rejected['overlap_or_nested'] += 1
        else:
            accepted.add(index)
            kept.append(record)
    return kept, rejected


def rounded_geometry(geom):
    return json.loads(json.dumps(mapping(geom)), parse_float=lambda x: round(float(x), 7))


def export(records, report, src, args):
    metadata = json.loads((CACHE / f'{args.name}.json').read_text())
    ll_to_utm = Transformer.from_crs(4326, 32619, always_xy=True).transform
    aoi = project(ll_to_utm, box(*metadata['requested_bbox']))
    kept, rejection = deduplicate(records, aoi)
    report['rejected_final'] = dict(rejection)
    common = {'type': 'FeatureCollection', 'schemaVersion': '1.0.0',
              'generatedAt': datetime.now(timezone.utc).isoformat(), 'caseId': 'san-juan-field-boundaries',
              'bbox': metadata['requested_bbox'], 'source': 'Esri World Imagery + ESA WorldCover 2021 v200',
              'attribution': metadata['attribution'], 'method': 'MobileSAM vit_t; approximate field candidates',
              'observed_at': None, 'retrieved_at': metadata['retrieved_at'],
              'area_unit': 'ha', 'area_crs': 'EPSG:32619', 'coordinate_crs': 'EPSG:4326',
              'confidence_semantics': 'Product of SAM predicted IoU (clipped to [0,1]) and stability; uncalibrated mask quality, NOT probability of a true farm field.',
              'spatial_scale': 'Image-derived field candidate; imagery nominal sampling ~1.13 m at zoom 17; effective source resolution unverified. WorldCover 10 m.',
              'limitations': ['Approximate boundaries, not cadastral.', 'Human and field validation pending.',
                             'Incomplete coverage; small or weak boundaries may be missed or merged.',
                             'Non-field objects may remain; imagery acquisition date unverified.',
                             'No producer identities, ownership or irrigation status inferred.'],
              'ai_assistance': {'tool': 'Codex (OpenAI); MobileSAM vit_t', 'date': '2026-11-14',
                                'human_review': 'Pending Frainer review'}}
    full, web = [], []
    for record in sorted(kept, key=lambda r: shape(r['geometry']).centroid.coords[0]):
        utm = shape(record['geometry'])
        ll = project(TO_LONLAT, utm)
        identifier = 'sj-' + hashlib.sha256(utm.wkb).hexdigest()[:12]
        centroid = project(TO_LONLAT, utm.centroid)
        props = {'id': identifier, 'area_ha': round(utm.area / 10000, 4),
                 'centroid': [round(centroid.x, 7), round(centroid.y, 7)],
                 'source': 'esri-world-imagery-z17',
                 'confidence': round(min(1., max(0., record['predicted_iou'])) * record['stability'], 3),
                 'quality': 'unvalidated', 'observed_at': None,
                 'predicted_iou': round(record['predicted_iou'], 3),
                 'stability': round(record['stability'], 3),
                 'cropland_fraction_2021': round(record['crop_fraction'], 3)}
        feature = {'type': 'Feature', 'id': identifier, 'properties': props,
                   'geometry': rounded_geometry(ll)}
        full.append(feature)
        web.append({**feature, 'geometry': rounded_geometry(project(TO_LONLAT,
                    utm.simplify(args.simplify_m, preserve_topology=True)))})
    target = ROOT / 'data/derived/fields_san_juan.geojson'
    public = ROOT / 'web/public/data/fields_san_juan.geojson'
    write_json(target, {**common, 'simplification_m': .8, 'features': full})
    write_json(public, {**common, 'simplification_m': args.simplify_m,
                       'area_note': 'Area and centroid refer to full geometry, before web simplification.',
                       'features': web})
    if public.stat().st_size >= 3_000_000:
        raise ValueError('Web artifact exceeds 3 MB; increase simplification or split explicitly')
    report.update(feature_count=len(full), full_bytes=target.stat().st_size,
                  web_bytes=public.stat().st_size,
                  total_candidate_area_ha=round(sum(f['properties']['area_ha'] for f in full), 3),
                  area_range_ha=[min((f['properties']['area_ha'] for f in full), default=0),
                                 max((f['properties']['area_ha'] for f in full), default=0)],
                  parameters=PARAMS, checkpoint_sha256=hashlib.sha256(Path(args.checkpoint).read_bytes()).hexdigest()
                  if Path(args.checkpoint).exists() else None,
                  imagery_manifest=f'data/cache/fields/{args.name}.json',
                  ai_assistance=common['ai_assistance'])
    write_json(ROOT / 'data/derived/fields_report.json', report)
    preview(src, kept, ROOT / 'data/derived/fields_preview.png')
    print(json.dumps({k: report[k] for k in ['feature_count', 'full_bytes', 'web_bytes', 'total_candidate_area_ha']}), flush=True)


def preview(src, kept, target):
    # A detail inset preserves visible smallholder boundaries beside the overview.
    width = 1500
    height = round(src.height * width / src.width)
    image = Image.fromarray(src.read(out_shape=(3, height, width), resampling=Resampling.bilinear).transpose(1, 2, 0))
    inverse = ~src.transform
    draw = ImageDraw.Draw(image)
    for record in kept:
        geom = project(TO_MERC, shape(record['geometry']))
        for ring in [geom.exterior, *geom.interiors]:
            xy = [inverse * p for p in ring.coords]
            draw.line([(x * width/src.width, y * height/src.height) for x, y in xy], fill=(255, 35, 35), width=1)
    banner = 80
    canvas = Image.new('RGB', (width, height+banner), '#18251b')
    canvas.paste(image, (0, banner))
    text = ImageDraw.Draw(canvas)
    text.text((15, 10), f'San Juan | {len(kept)} approximate field candidates | Red: MobileSAM boundaries | NOT CADASTRAL', fill='white')
    text.text((15, 30), 'Imagery: Esri, Vantor, Earthstar Geographics, GIS User Community | Acquisition date unverified', fill='white')
    text.text((15, 50), 'AI-assisted analysis: Codex/OpenAI + MobileSAM, 2026-11-14 | Frainer review and field validation pending', fill='white')
    info = PngImagePlugin.PngInfo()
    info.add_text('Attribution', 'Esri, Vantor, Earthstar Geographics, GIS User Community; ESA WorldCover 2021 v200 CC-BY-4.0')
    info.add_text('AI assistance', 'Codex (OpenAI) and MobileSAM; 2026-11-14; Frainer review pending. Actual imagery, not generated.')
    canvas.save(target, pnginfo=info, optimize=True)


def run(args):
    start_time = time.monotonic()
    signature = hashlib.sha256(json.dumps(PARAMS, sort_keys=True).encode()).hexdigest()[:12]
    attempt_dir = CACHE / 'attempts' / f'{args.name}-{signature}'
    attempt_dir.mkdir(parents=True, exist_ok=True)
    records, rejected = [], Counter()
    generator = None
    report = {'method': 'MobileSAM vit_t automatic mask generator CPU', 'crops': [], 'complete': True}
    with rasterio.open(CACHE / f'{args.name}.tif') as src, rasterio.open(
            CACHE / f'{args.name}_worldcover.tif') as wc:
        with WarpedVRT(wc, crs=src.crs, transform=src.transform, width=src.width,
                       height=src.height, resampling=Resampling.nearest) as cover_src:
            for y in starts(src.height):
                for x in starts(src.width):
                    path = attempt_dir / f'{x}_{y}.json'
                    if path.exists():
                        crop = json.loads(path.read_text())
                    elif args.export_only or time.monotonic()-start_time > args.max_minutes*60:
                        report['complete'] = False
                        continue
                    else:
                        window = Window(x, y, min(PARAMS['crop_size_px'], src.width-x),
                                        min(PARAMS['crop_size_px'], src.height-y))
                        size = PARAMS['inference_size_px']
                        cover = cover_src.read(1, window=window, out_shape=(size, size))
                        t = time.monotonic()
                        if (cover == 40).mean() < .15:
                            found, reject, count = [], Counter({'noncrop_window': 1}), 0
                        else:
                            if generator is None:
                                import torch
                                from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator
                                torch.set_num_threads(args.threads)
                                model = sam_model_registry['vit_t'](checkpoint=args.checkpoint)
                                model.eval()
                                generator = SamAutomaticMaskGenerator(model,
                                    points_per_side=PARAMS['points_per_side'], points_per_batch=32,
                                    pred_iou_thresh=PARAMS['pred_iou_thresh'],
                                    stability_score_thresh=PARAMS['stability_score_thresh'],
                                    crop_n_layers=0, min_mask_region_area=PARAMS['min_mask_region_area'])
                            rgb = src.read(window=window, out_shape=(3, size, size),
                                           resampling=Resampling.bilinear).transpose(1, 2, 0)
                            affine = src.window_transform(window) * Affine.scale(window.width/size, window.height/size)
                            masks = generator.generate(rgb)
                            found, reject = candidates(masks, rgb, cover, affine)
                            count = len(masks)
                        crop = {'x': x, 'y': y, 'raw_masks': count, 'candidates': found,
                                'rejected': dict(reject), 'seconds': round(time.monotonic()-t, 2)}
                        write_json(path, crop)
                    records.extend(crop['candidates'])
                    rejected.update(crop['rejected'])
                    report['crops'].append({k: v for k, v in crop.items() if k != 'candidates'})
                    print(f"crop {x},{y}: {crop['raw_masks']} masks, {len(crop['candidates'])} candidates, {crop['seconds']}s", flush=True)
        report.update(raw_masks=sum(c['raw_masks'] for c in report['crops']),
                      candidate_count_before_dedup=len(records), rejected_masks=dict(rejected),
                      elapsed_seconds=round(time.monotonic()-start_time, 2),
                      expected_crops=len(starts(src.width))*len(starts(src.height)))
        export(records, report, src, args)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--name', default='san_juan_core')
    p.add_argument('--checkpoint', default='/tmp/mobile_sam.pt')
    p.add_argument('--threads', type=int, default=4)
    p.add_argument('--max-minutes', type=float, default=25)
    p.add_argument('--simplify-m', type=float, default=2.5)
    p.add_argument('--export-only', action='store_true', help='Rebuild only from cached per-window proposals, no model/network')
    run(p.parse_args())
