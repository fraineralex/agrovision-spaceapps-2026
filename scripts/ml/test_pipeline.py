# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""Regression checks for radiometry, missing observations and leakage prevention."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from shapely.geometry import box

from download import reflectance
from features import FEATURE_NAMES, segment_and_features
from train import fit_target


class PipelineTests(unittest.TestCase):
    def test_boa_offset_is_not_applied_twice(self):
        raw = np.array([2000], dtype='uint16')
        asset = {'raster:bands': [{'scale': 0.0001, 'offset': -0.1}]}
        self.assertAlmostEqual(float(reflectance(raw, asset, {'earthsearch:boa_offset_applied': True})[0]), 0.2)
        self.assertAlmostEqual(float(reflectance(raw, asset, {'earthsearch:boa_offset_applied': False})[0]), 0.1)
        with self.assertRaises(ValueError):
            reflectance(raw, asset, {})

    def test_missing_months_are_not_counted_as_bare(self):
        cube = np.full((24, 20, 20), 0.6, dtype='float32')
        cube[[2, 4, 23]] = 0.1
        cube[0] = np.nan
        cache = {'ndvi': cube, 'worldcover': np.full((20, 20), 40),
                 'months': np.array([f'{y}-{m:02d}' for y in [2024, 2025] for m in range(1, 13)]),
                 'transform': np.array([10, 0, 260000, 0, -10, 2080000])}
        _, records = segment_and_features(cache, n_segments=4)
        self.assertGreater(len(records), 0)
        for r in records:
            self.assertIsNone(r['series'][0])
            self.assertEqual(r['bare_months'], 3)
            self.assertEqual(r['observed_months'], 23)
            self.assertAlmostEqual(r['features']['bare_month_fraction'], 3/23)
            self.assertEqual(r['cover_weak_label'], 'bare_soil')

    def test_spatial_groups_are_disjoint_and_domain_is_respected(self):
        records = []
        for j in range(10):
            for i in range(10):
                crop = (i+j) % 2 == 0
                records.append({'label': len(records)+1,
                    'geometry': box(i*220, j*220, i*220+50, j*220+50),
                    'features': {f: 0.7 if crop else 0.1 for f in FEATURE_NAMES},
                    'cover_weak_label': 'crop' if crop else 'bare_soil',
                    'crop_fraction': 1, 'agricultural_fraction': 1})
        records.append({**records[0], 'label': 999, 'cover_weak_label': None,
                        'crop_fraction': 0, 'agricultural_fraction': 0})
        with tempfile.TemporaryDirectory() as d, patch('train.MODEL', Path(d)):
            report, predictions = fit_target(records, 'cover_weak_label', ['bare_soil', 'crop'])
        self.assertIsNotNone(report['validation'])
        self.assertTrue(set(report['split']['trainGroups']).isdisjoint(report['split']['testGroups']))
        assignments = report['validationAssignments']
        train_ids = [int(a['parcelId'].split('-')[-1]) for a in assignments if a['split'] == 'train']
        test_ids = [int(a['parcelId'].split('-')[-1]) for a in assignments if a['split'] == 'test']
        for a in train_ids:
            for b in test_ids:
                self.assertGreater(records[a-1]['geometry'].distance(records[b-1]['geometry']), 100)
        self.assertNotIn(999, predictions)
        self.assertIsNone(report['fieldAccuracy'])

    def test_one_class_does_not_generate_an_accuracy(self):
        report, predictions = fit_target([], 'cover_weak_label', ['bare_soil', 'crop'])
        self.assertIsNone(report['validation'])
        self.assertEqual(predictions, {})


if __name__ == '__main__':
    unittest.main()
