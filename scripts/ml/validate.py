# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Check the real delivered artifacts, provenance, finite JSON and spatial separation."""
import hashlib
import json

import numpy as np
from shapely.geometry import shape
from shapely import transform
from pyproj import Transformer

from common import CACHE, DERIVED


def strict_load(path):
    def reject(value):
        raise ValueError(f'Non-finite JSON value: {value}')
    return json.loads(path.read_text(), parse_constant=reject)


def validate():
    parcels = strict_load(DERIVED / 'parcels_san_juan.geojson')
    report = strict_load(DERIVED / 'model_report.json')
    acquisition = strict_load(CACHE / 'acquisition.json')
    for artifact in [parcels, report, acquisition]:
        assert all(k in artifact for k in ['schemaVersion', 'generatedAt', 'caseId'])
    assert len(parcels['features']) == report['unitCount'] > 0
    assert report['cacheSha256'] == hashlib.sha256((CACHE / 'monthly.npz').read_bytes()).hexdigest()
    assert report['acquisition']['sceneCount'] == len(acquisition['successfulSceneIds'])
    lookup = {}
    to_utm = Transformer.from_crs('EPSG:4326', 'EPSG:32619', always_xy=True)
    for f in parcels['features']:
        geom, props = shape(f['geometry']), f['properties']
        assert geom.is_valid and not geom.is_empty
        assert -180 <= geom.bounds[0] <= 180 and -90 <= geom.bounds[1] <= 90
        lookup[props['parcelId']] = transform(geom, to_utm.transform, interleaved=False)
        assert props['demo'] and props['irrigationStatus'] == 'unconfirmed'
        assert props['confidence'] is None or 0 <= props['confidence'] <= 1
        assert len(props['ndviSeries']) == report['acquisition']['monthCount']
        observed = [m for m in props['ndviSeries'] if m['value'] is not None]
        assert props['features']['observed_months'] == len(observed)
        assert props['features']['bare_months'] == sum(m['value'] < 0.2 for m in observed)
        for metric in props['metrics']:
            assert all(k in metric for k in ['id', 'label', 'value', 'unit', 'quality', 'confidence', 'provenance', 'limitation'])
            assert all(k in metric['provenance'] for k in ['sourceId', 'sourceName', 'periodStart', 'periodEnd', 'resolution', 'scale', 'method', 'citation'])
        for point in props['ndviSeries']:
            assert (point['value'] is None) == (point['quality'] == 'missing')
            if point['value'] is not None:
                assert -1 <= point['value'] <= 1 and point['clearPixelFraction'] >= 0.5
    for target in report['targets'].values():
        assert target['independentGroundTruthCount'] == 0 and target['fieldAccuracy'] is None
        if 'split' in target:
            assert set(target['split']['trainGroups']).isdisjoint(target['split']['testGroups'])
            assignments = target['validationAssignments']
            train_geoms = [lookup[a['parcelId']] for a in assignments if a['split'] == 'train']
            test_geoms = [lookup[a['parcelId']] for a in assignments if a['split'] == 'test']
            # Export boundaries are simplified at 5 m; allow 10 m combined displacement.
            if train_geoms and test_geoms:
                assert min(a.distance(b) for a in train_geoms for b in test_geoms) > 90
        if target['validation'] is not None:
            matrix = np.array(target['validation']['confusionMatrix'])
            assert matrix.sum() == target['split']['testCount']
    assert (DERIVED / 'parcels_san_juan.png').read_bytes().startswith(b'\x89PNG')
    print(f'Artifacts validated: {len(lookup)} units, {report["acquisition"]["sceneCount"]} real scenes')


if __name__ == '__main__':
    validate()
