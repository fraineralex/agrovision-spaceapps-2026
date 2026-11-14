#!/usr/bin/env python3
# AI assistance: Claude (Anthropic), 2026-11-14, wrote this builder. Frainer review: pending.
"""Build farmer-facing market insights from cached official Dominican sources.

Inputs (all already downloaded, see data/raw/market_rd/resources_manifest.json):
- data/derived/market_prices.json  (MA wholesale prices, Aug 2017-Oct 2026, built by build_prices.py)
- data/raw/market_rd/sowing.csv     (MA national monthly sowing, tareas, 2017-Sep 2026)
- data/raw/market_rd/costs.pdf      (MA production costs 2019; values transcribed below with page numbers)

Output: web/public/data/market-insights.json

Methods (simple and explainable on purpose):
- Price outlook: seasonal naive with level = mean of the last 12 available monthly prices,
  times the seasonal index of the target month / 100. Range = +/- backtest MAPE for that horizon.
- Backtest: rolling origins over the last 36 months; error = |forecast - actual| / actual.
- Sowing pressure: national tareas sown in the last 12 available months vs the median of the same
  12-month windows in previous years. Thresholds (+15% / -15%) are our own rule, not a validated model.
No number is invented: when a series is missing, the field stays null.
"""
import csv
import json
from pathlib import Path
from statistics import mean, median

ROOT = Path(__file__).resolve().parents[2]
PRICES = ROOT / "data/derived/market_prices.json"
SOWING = ROOT / "data/raw/market_rd/sowing.csv"
OUT = ROOT / "web/public/data/market-insights.json"
MONTHS = {m: i for i, m in enumerate("enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split(), 1)}
MONTHS["diembre"] = 12  # typo present in the source CSV
COSTS_URL = "https://agricultura.gob.do/wp-content/uploads/2022/09/Costos-Estimados-de-Produccin-de-Cultivos-Agrcolas-2019.pdf"
SOWING_URL = "https://agricultura.gob.do/transparencia/wp-content/uploads/2026/10/Consolidado-Mensual-Nacional-de-Siembra-Ano-2017-Enero-Septiembre-2026.csv"

# cropId -> label, sowing name in MA CSV, price series family (crop prefix), lb per published unit
CROPS = {
    "habichuela_roja": {"label": "Habichuela roja", "sowing": ["Frijol R."], "price": "red_bean:"},
    "maiz": {"label": "Maíz", "sowing": ["Maíz"], "price": "maize:"},
    "arroz": {"label": "Arroz", "sowing": ["Arroz1", "Arroz"], "price": "rice:"},
    "batata": {"label": "Batata", "sowing": ["Batata"], "price": "sweet_potato:"},
    "guandul": {"label": "Guandul", "sowing": ["Guandúl"], "price": "pigeon_pea:"},
    "yuca": {"label": "Yuca", "sowing": ["Yuca"], "price": "cassava:"},
    "platano": {"label": "Plátano", "sowing": ["Plátano"], "price": "plantain:"},
}

# Transcribed from MA "Costos Estimados de Producción de Cultivos Agrícolas 2019" (PDF page numbers).
# yieldLb converts the published yield to pounds only when the unit states its weight.
COSTS = {
    "habichuela_roja": {"area": "Regional Suroeste (San Juan), riego por gravedad", "pdfPage": 40,
                         "yield": 2.50, "yieldUnit": "quintales", "yieldLb": None, "costPerTarea": 6178.87},
    "maiz": {"area": "Nacional, riego", "pdfPage": 29, "yield": 1.18, "yieldUnit": "QQ de 100 lb",
             "yieldLb": 118.0, "costPerTarea": 2755.62},
    "arroz": {"area": "Nacional, riego", "pdfPage": 14, "yield": 4.61, "yieldUnit": "fanegas de 100 kg",
              "yieldLb": None, "costPerTarea": 5863.42},
    "batata": {"area": "Nacional, riego", "pdfPage": 67, "yield": 14.44, "yieldUnit": "QQ de 110 lb",
               "yieldLb": 14.44 * 110, "costPerTarea": 6873.70},
    "yuca": {"area": "Nacional", "pdfPage": 60, "yield": 11.27, "yieldUnit": "QQ de 100 lb",
             "yieldLb": 1127.0, "costPerTarea": 5297.15},
}


def pick_series(monthly, prefix):
    """Choose the primera-grade series with the most months; ties -> most recent end."""
    by = {}
    for row in monthly:
        if row["seriesId"].startswith(prefix):
            by.setdefault(row["seriesId"], []).append(row)
    if not by:
        return None, []
    def key(item):
        sid, rows = item
        return (":primera:" in sid, sum(r["period"] >= "2023-01" for r in rows), len(rows), max(r["period"] for r in rows))
    sid, rows = max(by.items(), key=key)
    return sid, sorted(rows, key=lambda r: r["period"])


def add_months(period, k):
    y, m = map(int, period.split("-"))
    m += k
    y += (m - 1) // 12
    m = (m - 1) % 12 + 1
    return f"{y:04d}-{m:02d}"


def seasonal_index(rows, upto=None):
    """Median over complete years of monthly/annual-mean*100; needs >=3 years per month."""
    years = {}
    for r in rows:
        if upto and r["period"] > upto:
            continue
        years.setdefault(r["period"][:4], {})[int(r["period"][5:])] = r["mean"]
    samples = {m: [] for m in range(1, 13)}
    for months in years.values():
        if len(months) == 12:
            annual = mean(months.values())
            for m, v in months.items():
                samples[m].append(v / annual * 100)
    return {m: (round(median(s), 1) if len(s) >= 3 else None) for m, s in samples.items()}


def forecast(rows, origin_idx, h, idx):
    hist = rows[max(0, origin_idx - 11): origin_idx + 1]
    if len(hist) < 9:
        return None
    level = mean(r["mean"] for r in hist)
    target = add_months(rows[origin_idx]["period"], h)
    s = idx.get(int(target[5:]))
    return (target, level * s / 100) if s else None


def backtest(rows, h):
    errors = []
    by_period = {r["period"]: r["mean"] for r in rows}
    for i in range(len(rows)):
        if rows[i]["period"] < add_months(rows[-1]["period"], -36 - h):
            continue
        idx = seasonal_index(rows, upto=rows[i]["period"])
        f = forecast(rows, i, h, idx)
        if f and f[0] in by_period:
            errors.append(abs(f[1] - by_period[f[0]]) / by_period[f[0]])
    return (round(mean(errors) * 100, 1), len(errors)) if len(errors) >= 6 else (None, len(errors))


def sowing_pressure(names):
    rows = list(csv.reader(open(SOWING, encoding="cp1252"), delimiter=";"))[1:]
    series = {}
    for name, tareas, month, year in (r[:4] for r in rows if len(r) >= 4):
        if name.strip() in names and month.strip().lower() in MONTHS:
            p = f"{int(year):04d}-{MONTHS[month.strip().lower()]:02d}"
            try:
                series[p] = series.get(p, 0) + float(tareas.strip() or 0)
            except ValueError:
                continue
    if not series:
        return None
    last = max(series)
    def window(end):
        ps = [add_months(end, -k) for k in range(12)]
        return sum(series[p] for p in ps) if all(p in series for p in ps) else None
    now = window(last)
    past = [w for k in range(1, 4) if (w := window(add_months(last, -12 * k))) is not None]
    by_month = {m: [] for m in range(1, 13)}
    for p, v in series.items():
        by_month[int(p[5:])].append(v)
    month_mean = {m: mean(v) for m, v in by_month.items() if v}
    peak = sorted(month_mean, key=month_mean.get, reverse=True)[:3]
    if now is None or len(past) < 2:
        return {"status": None, "peakSowingMonths": sorted(peak)}
    base = median(past)
    ratio = now / base if base else None
    status = None if ratio is None else "alta" if ratio >= 1.15 else "baja" if ratio <= 0.85 else "normal"
    return {"windowEnd": last, "tareasLast12": round(now), "medianPrev12": round(base), "nPreviousWindows": len(past),
            "ratio": round(ratio, 2) if ratio else None, "status": status, "peakSowingMonths": sorted(peak),
            "rule": "alta si últimos 12 meses >= 115% de la mediana de los 3 años anteriores; baja si <= 85% (regla propia, no validada)"}


def main():
    prices = json.loads(PRICES.read_text())
    monthly = prices["monthlyPrices"]
    out = {"schemaVersion": "1.0.0", "generatedBy": "scripts/market/build_market_insights.py",
           "aiAssistance": "Claude (Anthropic), 2026-11-14; Frainer review pending",
           "sources": {"prices": prices["sources"][0]["url"], "pricesPeriod": f"{prices['periodStart']}–{prices['periodEnd']}",
                       "sowing": SOWING_URL, "costs": COSTS_URL},
           "limits": ["Precios mayoristas de Santo Domingo, no precio en finca.",
                      "Precios nominales; no ajustados por inflación.",
                      "Pronóstico estacional simple; el rango muestra el error real de los últimos 3 años, no garantiza precio.",
                      "Siembra nacional del Ministerio; no es la siembra de tu provincia.",
                      "Costos de 2019 sin ajustar por inflación."],
           "crops": {}}
    for crop, meta in CROPS.items():
        sid, rows = pick_series(monthly, meta["price"])
        entry = {"label": meta["label"], "seriesId": sid, "unit": rows[-1]["unit"] if rows else None}
        if len(rows) >= 24:
            idx = seasonal_index(rows)
            last = rows[-1]
            entry["latest"] = {"period": last["period"], "price": round(last["mean"], 2)}
            prev = next((r for r in rows if r["period"] == add_months(last["period"], -12)), None)
            entry["yearAgo"] = {"period": prev["period"], "price": round(prev["mean"], 2)} if prev else None
            entry["recent"] = [{"period": r["period"], "price": round(r["mean"], 2)} for r in rows[-24:]]
            entry["seasonalIndex"] = idx
            valid = {m: v for m, v in idx.items() if v is not None}
            entry["bestSellMonths"] = sorted(sorted(valid, key=valid.get, reverse=True)[:2]) if len(valid) >= 6 else []
            entry["worstSellMonths"] = sorted(sorted(valid, key=valid.get)[:2]) if len(valid) >= 6 else []
            entry["outlook"] = []
            for h in (3, 6):
                f = forecast(rows, len(rows) - 1, h, idx)
                mape, n = backtest(rows, h)
                if f and mape is not None:
                    entry["outlook"].append({"horizonMonths": h, "period": f[0], "price": round(f[1], 2),
                                             "low": round(f[1] * (1 - mape / 100), 2), "high": round(f[1] * (1 + mape / 100), 2),
                                             "backtestMapePct": mape, "backtestN": n})
        entry["sowing"] = sowing_pressure(meta["sowing"])
        if crop in COSTS:
            c = COSTS[crop]
            entry["cost2019"] = {**c, "source": COSTS_URL}
        out["crops"][crop] = entry
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    for k, v in out["crops"].items():
        print(k, v.get("seriesId"), v.get("latest"), [(o["period"], o["price"], o["backtestMapePct"]) for o in v.get("outlook", [])],
              v.get("bestSellMonths"), v["sowing"] and (v["sowing"].get("status"), v["sowing"].get("ratio"), v["sowing"].get("peakSowingMonths")))


if __name__ == "__main__":
    main()
