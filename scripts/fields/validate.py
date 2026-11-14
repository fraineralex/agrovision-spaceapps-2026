# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Validate real artifacts: geometry, physical units, IDs, simplification and overlaps."""
import json

import numpy as np
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform
from shapely.strtree import STRtree

from acquire import ROOT


def run():
    full_path = ROOT / 'data/derived/fields_san_juan.geojson'
    web_path = ROOT / 'web/public/data/fields_san_juan.geojson'
    full, web = [json.loads(p.read_text()) for p in [full_path, web_path]]
    to_utm = Transformer.from_crs(4326, 32619, always_xy=True).transform
    results = {}
    ids = []
    for name, collection in [('full', full), ('web', web)]:
        features = collection['features']
        assert features, 'Empty field layer'
        assert collection['observed_at'] is None
        assert collection['coordinate_crs'] == 'EPSG:4326'
        id_list = [f['id'] for f in features]
        assert len(set(id_list)) == len(id_list), 'Duplicate IDs'
        ids.append(id_list)
        projected = []
        for feature in features:
            g = shape(feature['geometry'])
            p = feature['properties']
            assert g.geom_type == 'Polygon' and g.is_valid and not g.is_empty
            assert p['id'] == feature['id']
            assert .05 <= p['area_ha'] <= 50
            assert 0 <= p['confidence'] <= 1
            assert p['quality'] == 'unvalidated' and p['observed_at'] is None
            assert len(p['centroid']) == 2 and p['source']
            west, south, east, north = collection['bbox']
            assert g.bounds[0] >= west-1e-7 and g.bounds[2] <= east+1e-7
            assert g.bounds[1] >= south-1e-7 and g.bounds[3] <= north+1e-7
            utm = transform(to_utm, g)
            projected.append(utm)
            if name == 'full':
                assert abs(utm.area/10000-p['area_ha']) < .001, 'Area is not hectares in UTM'
        tree = STRtree(projected)
        overlaps = []
        for i, geom in enumerate(projected):
            for j in tree.query(geom):
                if j > i:
                    overlap = geom.intersection(projected[j]).area
                    if overlap > .1:
                        overlaps.append(overlap)
        results[name] = {'features': len(features), 'bytes': (full_path if name == 'full' else web_path).stat().st_size,
                         'overlap_pairs_above_0_1_m2': len(overlaps),
                         'max_overlap_m2': round(max(overlaps, default=0), 3)}
        assert max(overlaps, default=0) <= (26 if name == 'full' else 500), 'Unexpected overlapping candidates'
    assert ids[0] == ids[1], 'Full/web IDs differ'
    assert web_path.stat().st_size < 3_000_000, 'Web layer exceeds 3 MB'
    area_error, boundary_distance = [], []
    for f, w in zip(full['features'], web['features']):
        assert f['properties'] == w['properties']
        a, b = [transform(to_utm, shape(v['geometry'])) for v in [f, w]]
        area_error.append(abs(a.area-b.area)/a.area)
        boundary_distance.append(a.hausdorff_distance(b))
    results['simplification'] = {'max_relative_area_change': round(max(area_error), 5),
                                'p95_relative_area_change': round(float(np.percentile(area_error, 95)), 5),
                                'max_hausdorff_m': round(max(boundary_distance), 3)}
    assert max(boundary_distance) < 2.6, 'Web simplification exceeds intended tolerance'
    assert max(area_error) < .051, 'Web simplification changes field area excessively'
    assert (ROOT / 'data/derived/fields_preview.png').exists()
    print(json.dumps(results, indent=2))
    return results


if __name__ == '__main__':
    run()
