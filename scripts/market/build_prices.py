#!/usr/bin/env python3
# AI assistance: Codex (OpenAI), 2026-11-14. Frainer review: pending.
"""Download MA wholesale prices and build an auditable, offline market artifact."""
import argparse
import calendar
import csv
import hashlib
import io
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean, median
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
PAGE = "https://agricultura.gob.do/transparencia/categoria/informe-precios-de-mercado-interdiario-2017-2025/"
URL = "https://agricultura.gob.do/transparencia/wp-content/uploads/2023/01/Informe-de-precios-Mayorista-Agosto-2017-Octubre-2026..csv"
CACHE = ROOT / "data/cache/market/wholesale_2017_2026.csv"
MONTHS = dict(zip("enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split(), range(1, 13)))
WEEKS = {"primera": 1, "primero": 1, "priemera": 1, "segunda": 2, "sengunda": 2,
         "tercera": 3, "cuarta": 4, "cuanta": 4, "quinta": 5, "quinto": 5}


def clean(value):
    return " ".join(unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower().split())


def identify(name):
    """Keep variety, product form and grade separate; uncertain matches stay separate."""
    name = clean(name)
    if name.startswith("habichuela roja"):
        crop = "red_bean"
        variety = "yacomelo" if "yacomelo" in name else "jose_beta_long" if "larga" in name else "jose_beta_short" if "beta" in name else "unspecified"
    elif name.startswith("maiz"):
        crop, variety = "maize", "frances_largo" if "frances" in name else "unspecified"
    elif name.startswith("guandul"):
        crop = "pigeon_pea"
        variety = "green_pod_kaki" if "kaki" in name else "green_pod" if "vaina" in name else "green_shelled" if "grano" in name else "unspecified"
    elif name.startswith("batata"):
        crop = "sweet_potato"
        variety = next((x for x in ("tifey", "canolia", "copelo") if x in name), "unspecified")
    elif name.startswith("arroz"):
        crop = "rice"
        variety = "super_selecto" if "super selecto" in name else "superior" if "superior" in name else "selecto" if "selecto" in name else "unspecified"
    else:
        return None
    grade = next((g for g in ("primera", "segunda", "tercera") if g in name), "unspecified")
    return crop, variety, grade


def normalized_unit(raw):
    unit = clean(raw).replace("libra", "lb").replace(" ", "")
    match = re.fullmatch(r"saco/(100|125)lb", unit)
    if match:
        return float(match[1]), "DOP/lb"
    if unit == "lb":
        return 1.0, "DOP/lb"
    # Quintal is retained as published: its weight is not silently assumed.
    if unit == "quintal":
        return 1.0, "DOP/quintal"
    return None, None


def build(raw, retrieved_at):
    observations, rejected = [], []
    total = 0
    for line, row in enumerate(csv.reader(io.StringIO(raw.decode("cp1252")), delimiter=";"), 1):
        total += 1
        if not row or not (identity := identify(row[0])):
            continue
        if len(row) != 8:
            rejected.append({"sourceRow": line, "reason": "unexpected_column_count"})
            continue
        product, category, level, unit, price, week, month, year = row
        # The source provides an ordinal week within a month, not an ISO week/day.
        month_number = MONTHS.get(clean(month))
        week_number = WEEKS.get(clean(week))
        if not month_number or not week_number or not re.fullmatch(r"20\d{2}", year.strip()):
            rejected.append({"sourceRow": line, "reason": "ambiguous_period", "rawPeriod": row[5:]})
            continue
        divisor, normalized = normalized_unit(unit)
        value = float(price) if re.fullmatch(r"\d+(\.\d+)?", price.strip()) and float(price) > 0 else None
        crop, variety, grade = identity
        quality = "preliminary" if value is not None and divisor else "missing"
        series = f"{crop}:{variety}:{grade}:{normalized or clean(unit)}"
        observations.append({
            "sourceRow": line, "seriesId": series, "cropId": crop,
            "productOriginal": product, "variety": variety, "grade": grade,
            "period": f"{int(year):04d}-{month_number:02d}", "weekOfMonth": week_number,
            "weekOriginal": week, "monthOriginal": month,
            "priceOriginal": value, "priceRaw": price, "unitOriginal": unit,
            "value": round(value / divisor, 6) if value is not None and divisor else None,
            "unit": normalized, "currency": "DOP", "market": "Santo Domingo wholesale markets (individual market not encoded in CSV)",
            "sourceId": "ma_wholesale_2017_2026", "method": "market_series",
            "scale": "regional", "quality": quality, "confidence": None,
            "status": "eligible" if quality == "preliminary" else "missing_price_or_unknown_unit",
        })
    # Repeated same series/week is never allowed to overweight monthly statistics.
    grouped = defaultdict(list)
    for obs in observations:
        grouped[(obs["seriesId"], obs["period"], obs["weekOfMonth"])].append(obs)
    for group in grouped.values():
        if len(group) > 1:
            conflict = len({o["value"] for o in group}) > 1
            for i, obs in enumerate(group):
                if conflict or i:
                    obs["status"] = "conflicting_duplicate" if conflict else "duplicate"
    buckets = defaultdict(list)
    for obs in observations:
        if obs["status"] == "eligible":
            buckets[(obs["seriesId"], obs["period"])].append(obs)
    monthly = []
    for (series, period), group in sorted(buckets.items()):
        monthly.append({"seriesId": series, "period": period, "mean": round(mean(o["value"] for o in group), 6),
                        "nWeeks": len(group), "unit": group[0]["unit"], "quality": "preliminary",
                        "confidence": None, "scale": "regional", "method": "derived_model",
                        "sourceId": "ma_wholesale_2017_2026", "sourceRows": [o["sourceRow"] for o in group]})
    years = defaultdict(list)
    for item in monthly:
        years[(item["seriesId"], item["period"][:4])].append(item)
    indices = defaultdict(list)
    for (series, year), months in years.items():
        if len(months) == 12 and all(m["nWeeks"] >= 3 for m in months):
            annual = mean(m["mean"] for m in months)
            for item in months:
                indices[(series, int(item["period"][5:]))].append((year, item["mean"] / annual * 100))
    seasonality = []
    for series in sorted({o["seriesId"] for o in observations}):
        for month in range(1, 13):
            samples = indices[(series, month)]
            enough = len(samples) >= 3
            seasonality.append({"seriesId": series, "month": month, "monthLabel": calendar.month_name[month],
                                "index": round(median(v for _, v in samples), 3) if enough else None,
                                "unit": "index (annual monthly mean = 100)", "years": [y for y, _ in samples],
                                "nYears": len(samples), "quality": "preliminary" if enough else "missing",
                                "status": "preliminary" if enough else "pending_insufficient_complete_years",
                                "confidence": None, "scale": "regional", "method": "derived_model",
                                "sourceId": "ma_wholesale_2017_2026"})
    return {
        "schemaVersion": "1.0.0", "generatedAt": retrieved_at, "caseId": "san-juan-valley",
        "status": "preliminary_requires_human_review", "requestedPeriod": "2017-2026",
        "periodStart": min(o["period"] for o in observations), "periodEnd": max(o["period"] for o in observations),
        "sources": [{"sourceId": "ma_wholesale_2017_2026", "sourceName": "Ministerio de Agricultura, Departamento de Economía Agropecuaria",
                     "url": URL, "landingPage": PAGE, "retrievedAt": retrieved_at,
                     "sha256": hashlib.sha256(raw).hexdigest(), "encoding": "Windows-1252", "delimiter": ";",
                     "license": "Pending verification for the direct MA download; ODbL listed by datos.gov.do catalog, applicability to this copy not confirmed",
                     "citation": "Ministerio de Agricultura (RD), Informe de precios Mayorista Agosto 2017–Octubre 2026, downloaded 2026-11-14",
                     "method": "market_series", "scale": "regional"}],
        "methodology": {
            "monthly": "Arithmetic mean of eligible published ordinal weeks, within exact crop/variety/grade/unit series; no interpolation",
            "seasonality": "Median across at least 3 complete years of (monthly mean / mean of 12 monthly means)*100; each month requires >=3 weeks; partial years excluded",
            "missing": "Zero, blank or invalid price means missing, never a free product; ambiguous periods excluded; conflicting duplicates excluded",
            "normalization": "Only explicitly weighted 100/125 lb sacks converted to DOP/lb; quintal kept as published; grades and forms separate",
        },
        "limitations": ["Santo Domingo wholesale reference, not San Juan farm-gate prices or income",
                        "Ordinal weeks do not identify exact observation dates; no day or ISO week is inferred",
                        "Nominal prices; annual ratios reduce level shifts but do not constitute inflation adjustment or causal seasonality",
                        "No forecast, yield estimate, profit guarantee or recommended harvest date",
                        "Source typos, grade changes, incomplete years and unvalidated outliers remain; no calibrated confidence available",
                        "Market score must remain null pending agronomic, licensing and data quality review by Frainer"],
        "audit": {"sourceRows": total, "selectedRows": len(observations), "rejectedRows": rejected,
                  "observationStatuses": dict(Counter(o["status"] for o in observations))},
        "observations": observations, "monthlyPrices": monthly, "monthlySeasonality": seasonality,
        "marketScore": None, "aiAssistance": {"tool": "Codex (OpenAI)", "date": "2026-11-14", "reviewByFrainer": "pending"},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="Download source; default uses local cache offline")
    args = parser.parse_args()
    metadata = CACHE.with_suffix(".metadata.json")
    if args.refresh:
        with urlopen(Request(URL, headers={"User-Agent": "AgroVision market research"}), timeout=60) as response:
            raw = response.read()
        # Validate before replacing the cached source.
        if b";Mayorista" not in raw:
            raise ValueError("Downloaded content is not the expected MA CSV")
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_bytes(raw)
        metadata.write_text(json.dumps({"retrievedAt": datetime.now(timezone.utc).isoformat(), "url": URL}, indent=2) + "\n")
    if not CACHE.exists() or not metadata.exists():
        parser.error("Source cache/metadata missing; run once with --refresh. Never substitute synthetic data.")
    result = build(CACHE.read_bytes(), json.loads(metadata.read_text())["retrievedAt"])
    output = ROOT / "data/derived/market_prices.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output.relative_to(ROOT)), "audit": result["audit"], "monthlyPrices": len(result["monthlyPrices"]),
                      "seasonalSeries": len({m["seriesId"] for m in result["monthlySeasonality"] if m["index"] is not None})}, ensure_ascii=False))


if __name__ == "__main__":
    main()
