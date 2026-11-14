# AI assistance: Codex (OpenAI), 2026-11-14. Frainer review: pending.
"""Check financial-data failure modes without a network dependency."""
import unittest

from build_prices import build


def fixture(rows):
    return build(("\n".join(";".join(r) for r in rows)).encode("cp1252"), "2026-11-14T00:00:00Z")


def row(price="2000", unit="Saco/100 libra", week="Primera", month="Enero", year="2020"):
    return ["Maíz amarillo (Francés Largo), primera", "Cereales", "Mayorista", unit, price, week, month, year]


class PricesTest(unittest.TestCase):
    def test_missing_and_ambiguous_values_never_become_prices(self):
        result = fixture([row("0"), row("", week="Segunda"), row(month="Juio"), row(year="20252025+B1")])
        self.assertTrue(all(o["value"] is None for o in result["observations"]))
        self.assertEqual(result["monthlyPrices"], [])
        self.assertEqual(len(result["audit"]["rejectedRows"]), 2)

    def test_duplicate_conflicts_do_not_bias_monthly_mean(self):
        result = fixture([row(), row(), row("3000", week="Segunda"), row("4000", week="Segunda")])
        self.assertEqual(result["monthlyPrices"][0]["mean"], 20)
        self.assertEqual(result["monthlyPrices"][0]["nWeeks"], 1)
        self.assertEqual(result["audit"]["observationStatuses"]["conflicting_duplicate"], 2)

    def test_only_explicit_weights_are_converted(self):
        result = fixture([row("2500", "Saco/125 libra"), row("800", "Quintal", "Segunda")])
        a, b = result["observations"]
        self.assertEqual((a["value"], a["unit"]), (20, "DOP/lb"))
        self.assertEqual((b["value"], b["unit"]), (800, "DOP/quintal"))
        self.assertNotEqual(a["seriesId"], b["seriesId"])

    def test_seasonality_excludes_partial_years_and_level_changes(self):
        months = "Enero Febrero Marzo Abril Mayo Junio Julio Agosto Septiembre Octubre Noviembre Diciembre".split()
        rows = [row(str(1000 * factor), week=week, month=month, year=str(year))
                for year, factor in [(2020, 1), (2021, 2), (2022, 3)]
                for month in months for week in ("Primera", "Segunda", "Tercera")]
        rows.append(row("999999", month="Enero", year="2026"))
        result = fixture(rows)
        self.assertTrue(all(m["index"] == 100 for m in result["monthlySeasonality"]))
        self.assertTrue(all(m["years"] == ["2020", "2021", "2022"] for m in result["monthlySeasonality"]))
        short = fixture([r for r in rows if r[-1] != "2022"])
        self.assertTrue(all(m["index"] is None for m in short["monthlySeasonality"]))


if __name__ == "__main__":
    unittest.main()
