# AI: OpenAI, 2026-11-15; Frainer review pending.
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from build_market_insights import raw_monthly


class MarketPriceTests(unittest.TestCase):
    def test_potato_keeps_valid_weeks_and_excludes_unverified_unit(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "wholesale.csv"
            weeks = ["Primera", "Segunda", "Tercera", "Cuarta"]
            prices = [48, 53, 53, 48]
            lines = [
                f"Papa (Granola), primera;Raices-Tuberculos;Mayorista;Kilo;{price};{week};{month};2025"
                for month in ["Junio", "Julio", "Agosto"]
                for week, price in zip(weeks, prices)
            ]
            lines.append("Papa (Granola), primera;Raices-Tuberculos;Mayorista;Kilo;8000;Quinta;Junio;2025")
            source.write_text("\n".join(lines), encoding="cp1252")
            excluded = []
            with patch("build_market_insights.WHOLESALE", source):
                _, rows = raw_monthly("papa", excluded)
            self.assertEqual(rows[0]["mean"], 50.5)
            self.assertEqual(excluded, [{"period": "2025-06", "week": "quinta", "value": 8000}])
