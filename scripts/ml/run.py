# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Build offline, attributed GeoJSON, an honest model report and a confidence PNG."""
import argparse
from collections import Counter
import hashlib
import importlib.metadata
import json

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap, BoundaryNorm
import numpy as np
from pyproj import Transformer
from shapely.geometry import mapping, shape
from shapely import union_all
from shapely import transform as transform_geometry

from common import CACHE, DERIVED, DEFAULT_BBOX, STAC, WORLDCOVER, envelope, write_json
from features import FEATURE_NAMES, segment_and_features
from train import fit_target

LIMITATION = ('Preliminary SLIC analysis unit, not a farm or cadastral boundary. '
              'Weak labels and uncalibrated model votes; no field validation. '
              'NDVI alone does not establish irrigation, crop identity or bare soil.')


def provenance(acquisition):
    return {'sourceId': 'sentinel-2-l2a', 'sourceName': 'Copernicus Sentinel-2 L2A / Element 84 Earth Search',
            'url': STAC + '/collections/sentinel-2-l2a',
            'periodStart': acquisition['config']['start'] + 'T00:00:00Z',
            'periodEnd': acquisition['config']['end'] + 'T23:59:59Z',
            'resolution': {'value': 10, 'unit': 'm', 'note': 'Red/NIR 10 m; SCL 20 m resampled nearest'},
            'scale': 'parcel', 'method': 'satellite_observation',
            'citation': 'Contains modified Copernicus Sentinel data (2024–2026), served by Element 84.',
            'license': 'Copernicus Sentinel Data Legal Notice'}


def make_figure(labels, records, cover_predictions, water_predictions, report):
    grid_shape = labels.shape
    panels = [np.full(grid_shape, np.nan) for _ in range(6)]
    for r in records:
        mask = labels == r['label']
        cover = cover_predictions.get(r['label'])
        water = water_predictions.get(r['label'])
        if cover:
            panels[0][mask] = ['bare_soil', 'crop'].index(cover['class'])
            panels[1][mask] = cover['confidence']
        if water:
            panels[3][mask] = ['irrigation_signal', 'rainfed_signal'].index(water['class'])
            panels[4][mask] = water['confidence']
        panels[2][mask] = r['bare_months']
        panels[5][mask] = r['observed_months']
    fig, axes = plt.subplots(2, 3, figsize=(16, 11))
    axes = axes.ravel()
    extent = [0, grid_shape[1]*0.01, 0, grid_shape[0]*0.01]
    titles = ['Latest observed cover: weak-label prototype', 'Cover votes (not field accuracy)',
              'Low NDVI months; gaps excluded', 'Water regime: unvalidated prototype',
              'Water votes (not field accuracy)', 'Temporal observation coverage']
    for i, ax in enumerate(axes):
        if i in (0, 3):
            colors = ['#b78c52', '#4c9d46'] if i == 0 else ['#217db0', '#e4bd52']
            im = ax.imshow(panels[i], extent=extent, cmap=ListedColormap(colors),
                           norm=BoundaryNorm([-0.5, 0.5, 1.5], 2))
            cb = fig.colorbar(im, ax=ax, fraction=0.046, ticks=[0, 1])
            cb.ax.set_yticklabels(['Bare soil', 'Crop'] if i == 0 else
                                 ['Irrigation signal', 'Rainfed signal'], fontsize=8)
        else:
            vote = i in (1, 4)
            im = ax.imshow(panels[i], extent=extent, cmap='viridis' if vote else 'YlOrBr',
                           vmin=0.5 if vote else 0, vmax=1 if vote else report['acquisition']['monthCount'])
            fig.colorbar(im, ax=ax, fraction=0.046,
                         label='Uncalibrated RF vote fraction' if vote else 'Observed months')
        ax.set_title(titles[i], fontsize=11)
        ax.set_xlabel('Eastward distance (km)')
        ax.set_ylabel('Northward distance (km)')
    fig.suptitle('San Juan Valley: approximate analysis units, 2024–2026', fontsize=16)
    fig.text(0.5, 0.025, 'Source: Copernicus Sentinel-2 L2A (10 m), Earth Search; ESA WorldCover 2021 (10 m).\n'
             'Weak labels; no field validation. White = unavailable. Low NDVI threshold: 0.2. '             'AI assistance: Codex, 2026-11-14; Frainer review pending.', ha='center', fontsize=9)
    fig.tight_layout(rect=[0, 0.07, 1, 0.95])
    fig.savefig(DERIVED / 'parcels_san_juan.png', dpi=150)
    plt.close(fig)


def build(n_segments=600):
    acquisition = json.loads((CACHE / 'acquisition.json').read_text())
    with np.load(CACHE / 'monthly.npz') as cache:
        labels, records = segment_and_features(cache, n_segments)
        months = cache['months'].tolist()
        valid_pixel_fraction = np.isfinite(cache['ndvi']).mean(axis=(1, 2)).tolist()
    cover_report, cover_predictions = fit_target(records, 'cover_weak_label', ['bare_soil', 'crop'])
    water_report, water_predictions = fit_target(records, 'water_weak_label', ['irrigation_signal', 'rainfed_signal'])
    prov = provenance(acquisition)
    versions = {p: importlib.metadata.version(p) for p in ['numpy', 'rasterio', 'scikit-image', 'scikit-learn', 'shapely', 'pyproj', 'scipy', 'requests', 'matplotlib', 'joblib']}
    report = {**envelope(), 'status': 'prototype_preliminary', 'periodStart': prov['periodStart'],
        'periodEnd': prov['periodEnd'], 'sensor': 'Sentinel-2 MSI L2A (no HLS/Landsat fusion)',
        'provenance': [prov, {'sourceId': 'esa-worldcover-2021', 'sourceName': 'ESA WorldCover 2021 v200',
             'url': WORLDCOVER, 'observedAt': '2021-01-01T00:00:00Z',
             'periodStart': '2021-01-01T00:00:00Z', 'periodEnd': '2021-12-31T23:59:59Z',
             'resolution': {'value': 10, 'unit': 'm'}, 'scale': 'pixel', 'method': 'derived_model',
             'citation': 'Zanaga et al. (2022), ESA WorldCover 10 m 2021 v200, doi:10.5281/zenodo.7254221',
             'license': 'CC BY 4.0'}],
        'bbox': acquisition['config']['bbox'], 'resolutionM': 10,
        'scope': 'Small approximate pilot window within San Juan Valley, not the whole valley',
        'unitCount': len(records), 'unitDefinition': 'SLIC superpixels; not independently validated parcels',
        'method': {'name': 'RandomForestClassifier', 'seed': 42, 'nEstimators': 300, 'minSamplesLeaf': 3,
                   'classWeight': 'balanced', 'features': FEATURE_NAMES, 'segmentation': 'SLIC',
                   'requestedSegments': n_segments, 'compactness': 0.15,
                   'monthlyComposite': 'Pixel median of up to two lowest tile-cloud scenes per calendar month',
                   'parcelAggregation': 'Mean clear pixel NDVI; month missing if <50% of unit has clear pixels',
                   'seasonality': 'Standard deviation of the 12 calendar-month NDVI means',
                   'bareMonths': 'Count of observed monthly means <0.2; unobserved months excluded',
                   'dryMonths': [1, 2, 3], 'wetMonths': [5, 6, 9, 10],
                   'seasonWindowStatus': 'Project heuristic; local rainfall and agronomist validation pending',
                   'mask': 'SCL 4/5 only with 20 m exclusion buffer; SCL has native 20 m resolution',
                   'confidence': 'Maximum uncalibrated forest vote fraction after fitting all weak labels',
                   'noTemporalImputation': True},
        'weakLabelRules': {'version': 'weak-rules-v1',
            'bare_soil': 'WorldCover crop+bare fraction >=0.6 and latest observed monthly NDVI <0.2',
            'crop': 'WorldCover crop fraction >=0.6 and latest observed monthly NDVI >=0.35',
            'irrigation_signal': 'WorldCover crop fraction >=0.6, dry NDVI >=0.48 and dry >=wet-0.10',
            'rainfed_signal': 'WorldCover crop fraction >=0.6, dry NDVI <=0.35, wet >=0.50 and wet-dry >=0.15',
            'minimumSeasonObservations': 3, 'unlabeled': 'Ambiguous units excluded from training'},
        'acquisition': {'sceneCount': len(acquisition['successfulSceneIds']), 'failedScenes': acquisition['failedScenes'],
                        'monthCount': len(months), 'monthlyClearLandPixelFraction': dict(zip(months, valid_pixel_fraction)),
                        'sourceManifest': '../cache/ml/selection.json'},
        'targets': {'cover': cover_report, 'waterRegime': water_report},
        'versions': versions, 'limitations': [LIMITATION,
            'Validation measures agreement with feature-derived weak rules, not independent accuracy.',
            'WorldCover is from 2021 and may be stale for 2024–2026.',
            'Dry-season greenness may indicate perennial vegetation, rain or other conditions; no irrigation ground truth.',
            'Two scenes per month can miss management events; cloud masks can contain errors.',
            '2026 ends on the requested cutoff; November 2026 is partial.',
            'Sentinel-2 is ESA/Copernicus, not NASA HLS or Landsat; NASA imagery integration remains pending.'],
        'cacheSha256': hashlib.sha256((CACHE / 'monthly.npz').read_bytes()).hexdigest()}
    converter = Transformer.from_crs('EPSG:32619', 'EPSG:4326', always_xy=True)
    features = []
    for r in records:
        cover, water = cover_predictions.get(r['label']), water_predictions.get(r['label'])
        # A withheld model remains null. Weak labels are exposed separately.
        selected = water or cover
        model_prov = {**prov, 'sourceId': 'rf-weak-rules-v1', 'sourceName': 'AgroVision prototype RandomForest',
                      'method': 'derived_model', 'citation': 'scripts/ml/train.py; model_report.json'}
        metrics = []
        values = {**r['features'], 'bare_months': r['bare_months'], 'observed_months': r['observed_months']}
        for key, value in values.items():
            metrics.append({'id': key, 'label': key.replace('_', ' ').capitalize(), 'value': value,
                       'unit': 'month' if key.endswith('_months') else '1',
                       'confidence': None, 'quality': 'estimated' if value is not None else 'missing',
                       'provenance': prov, 'limitation': 'Derived from clear sampled observations; no temporal gap filling or field calibration.'})
        properties = {'parcelId': f'sj-unit-{r["label"]:04d}', 'name': f'Demo analysis unit {r["label"]}',
            'demo': True, 'boundaryType': 'approximate_slic_analysis_unit', 'status': 'prototype_preliminary',
            'class': selected['class'] if selected else None,
            'confidence': selected['confidence'] if selected else None,
            'coverValidationStatus': cover_report['status'], 'waterValidationStatus': water_report['status'],
            'coverClass': cover['class'] if cover else None, 'coverConfidence': cover['confidence'] if cover else None,
            'waterRegimeClass': water['class'] if water else None, 'waterConfidence': water['confidence'] if water else None,
            'classificationProvenance': model_prov, 'confidenceMeaning': 'Uncalibrated model vote; not field accuracy',
            'weakLabels': {'cover': r['cover_weak_label'], 'waterRegime': r['water_weak_label']},
            'irrigationStatus': 'unconfirmed', 'periodStart': prov['periodStart'], 'periodEnd': prov['periodEnd'],
            'latestObservedMonth': r['latest_month'], 'areaM2': r['size']*100,
            'worldcover2021Majority': r['worldcover_majority'], 'worldcoverCropFraction': r['crop_fraction'],
            'features': values, 'metrics': metrics,
            'ndviSeries': [{'month': m, 'value': v, 'unit': '1', 'clearPixelFraction': float(c),
                            'quality': 'observed' if v is not None else 'missing', 'confidence': None,
                            'sourceId': 'sentinel-2-l2a', 'resolutionM': 10}
                           for m, v, c in zip(months, r['series'], r['coverage'])],
            'limitation': LIMITATION}
        geometry = transform_geometry(r['geometry'].simplify(5, preserve_topology=True), converter.transform, interleaved=False)
        features.append({'type': 'Feature', 'geometry': mapping(geometry), 'properties': properties})
    DERIVED.mkdir(parents=True, exist_ok=True)
    write_json(DERIVED / 'parcels_san_juan.geojson', {**envelope(), 'type': 'FeatureCollection',
                   'bbox': list(union_all([shape(f['geometry']) for f in features]).bounds),
                   'provenance': report['provenance'], 'features': features}, compact=True)
    write_json(DERIVED / 'model_report.json', report)
    make_figure(labels, records, cover_predictions, water_predictions, report)
    print(f'Exported {len(records)} approximate analysis units')
    for name, result in report['targets'].items():
        print(name, json.dumps({k: result[k] for k in ['status', 'weakLabelCounts', 'validation']}))
    return report


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--download', action='store_true', help='Explicitly enable network acquisition before build')
    p.add_argument('--segments', type=int, default=600)
    args = p.parse_args()
    if args.download:
        from download import run
        run(argparse.Namespace(start='2024-01-01', end='2026-11-14', bbox=DEFAULT_BBOX, scenes_per_month=2, workers=4))
    build(args.segments)
