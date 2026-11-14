#!/usr/bin/env python3
"""Test meaningful missing/quality cases. AI: Codex/OpenAI, 2026-11-14; Frainer review pending."""
import json
import unittest
from pathlib import Path
from landsat_features import derive

class LandsatTest(unittest.TestCase):
    def setUp(self):
        self.row = json.loads((Path(__file__).resolve().parents[1] / "data/cache/landsat_point_sample.json").read_text())["rows"][0]

    def test_real_pixel_scaling(self):
        output = derive(self.row)
        self.assertAlmostEqual(output["ndvi"], 0.7028, places=4)
        self.assertIsNone(output["confidence"])

    def test_cloud_is_missing_not_low_vegetation(self):
        self.row["response"]["values"][2] = 8
        result = derive(self.row)
        self.assertIsNone(result["ndvi"])
        self.assertEqual(result["signal"], "masked / missing")

    def test_saturated_red_is_missing(self):
        self.row["response"]["values"][3] = 8
        self.assertIsNone(derive(self.row)["ndvi"])

if __name__ == "__main__":
    unittest.main()
