import csv
import calendar
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (
    BBOX,
    CACHE_POWER,
    CASE_ID,
    DERIVED,
    FAO56_URL,
    LAT,
    LON,
    PERIOD_END,
    PERIOD_START,
    POWER_CSV,
    POWER_URL,
    base_document,
    dump,
    load,
    metric,
    provenance,
)
from fao56_et0 import reference_et0

FILL = -999.0


def parse_number(text, fill):
    if text is None or text == "":
        return None
    value = float(text)
    if value <= fill or value <= -900:
        return None
    return value


def read_power(path, fill):
    rows = []
    with Path(path).open(newline="", encoding="utf-8") as handle:
        for record in csv.DictReader(handle):
            rows.append(
                {
                    "date": record["date"],
                    "elevation_m": float(record["elevation_m"]),
                    "tmax": parse_number(record["T2M_MAX"], fill),
                    "tmin": parse_number(record["T2M_MIN"], fill),
                    "tmean": parse_number(record["T2M"], fill),
                    "rh": parse_number(record["RH2M"], fill),
                    "wind": parse_number(record["WS2M"], fill),
                    "rs": parse_number(record["ALLSKY_SFC_SW_DWN"], fill),
                    "precip": parse_number(record["PRECTOTCORR"], fill),
                }
            )
    return rows


def crosscheck(rows):
    cache = {}
    with CACHE_POWER.open(newline="", encoding="utf-8") as handle:
        for record in csv.DictReader(handle):
            cache[record["date"]] = record
    compared = 0
    max_t = 0.0
    max_p = 0.0
    missing = 0
    for row in rows:
        other = cache.get(row["date"])
        if other is None:
            missing += 1
            continue
        compared += 1
        if row["tmean"] is not None:
            max_t = max(max_t, abs(row["tmean"] - float(other["T2M"])))
        if row["precip"] is not None:
            max_p = max(max_p, abs(row["precip"] - float(other["PRECTOTCORR"])))
    return {
        "cacheFile": str(CACHE_POWER.relative_to(CACHE_POWER.parents[2])),
        "datesCompared": compared,
        "datesMissingFromCache": missing,
        "maxAbsDiffT2M_C": round(max_t, 6),
        "maxAbsDiffPRECTOTCORR_mm": round(max_p, 6),
    }


def month_key(day):
    return int(day[:4]), int(day[4:6])


def build():
    meta = load(DERIVED / "power_request.json")
    fill = float(meta["fillValue"])
    rows = read_power(POWER_CSV, fill)
    if not rows:
        raise RuntimeError("POWER CSV is empty")
    elevation = rows[0]["elevation_m"]
    daily = []
    method_counts = defaultdict(int)
    for row in rows:
        et0, method = reference_et0(
            LAT, elevation, row["date"], row["tmax"], row["tmin"], row["rh"], row["wind"], row["rs"]
        )
        method_counts[method] += 1
        if et0 is not None and et0 < 0:
            et0 = 0.0
        daily.append({**row, "et0": et0, "et0Method": method})
    by_month = defaultdict(list)
    for row in daily:
        by_month[month_key(row["date"])].append(row)
    monthly = []
    for (year, month), items in sorted(by_month.items()):
        expected = calendar.monthrange(year, month)[1]
        valid_precip = [item["precip"] for item in items if item["precip"] is not None]
        valid_tmax = [item["tmax"] for item in items if item["tmax"] is not None]
        valid_tmin = [item["tmin"] for item in items if item["tmin"] is not None]
        valid_et0 = [item["et0"] for item in items if item["et0"] is not None]
        hot_days = sum(1 for item in items if item["tmax"] is not None and item["tmax"] >= 32)
        complete = (
            len(items) == expected
            and len(valid_precip) == expected
            and len(valid_tmax) == expected
            and len(valid_tmin) == expected
            and len(valid_et0) == expected
        )
        monthly.append(
            {
                "year": year,
                "month": month,
                "daysExpected": expected,
                "daysPresent": len(items),
                "complete": complete,
                "precipMm": round(sum(valid_precip), 3) if valid_precip else None,
                "tmaxMeanC": round(sum(valid_tmax) / len(valid_tmax), 3) if valid_tmax else None,
                "tminMeanC": round(sum(valid_tmin) / len(valid_tmin), 3) if valid_tmin else None,
                "et0Mm": round(sum(valid_et0), 3) if valid_et0 else None,
                "hotDaysTmaxGe32C": hot_days,
            }
        )
    complete_months = [item for item in monthly if item["complete"]]
    climatology = []
    for month in range(1, 13):
        subset = [item for item in complete_months if item["month"] == month]
        if not subset:
            raise RuntimeError(f"No complete months for calendar month {month}")
        climatology.append(
            {
                "month": month,
                "sampleYears": len(subset),
                "precipMm": round(sum(item["precipMm"] for item in subset) / len(subset), 3),
                "tmaxMeanC": round(sum(item["tmaxMeanC"] for item in subset) / len(subset), 3),
                "tminMeanC": round(sum(item["tminMeanC"] for item in subset) / len(subset), 3),
                "et0Mm": round(sum(item["et0Mm"] for item in subset) / len(subset), 3),
                "hotDaysTmaxGe32C": round(
                    sum(item["hotDaysTmaxGe32C"] for item in subset) / len(subset), 3
                ),
            }
        )
    precip_values = np.array([item["precipMm"] for item in climatology], dtype=float)
    tmax_values = np.array([item["tmaxMeanC"] for item in climatology], dtype=float)
    half = {item["month"]: item["precipMm"] * 0.5 for item in climatology}
    heat_cut = float(np.percentile(tmax_values, 75, method="linear"))
    dry_cut = float(np.percentile(precip_values, 25, method="linear"))
    rain_median = float(np.median(precip_values))
    heat_months = [item["month"] for item in climatology if item["tmaxMeanC"] >= heat_cut]
    dry_quartile_months = [item["month"] for item in climatology if item["precipMm"] <= dry_cut]
    sowing_months = [
        item["month"]
        for item in climatology
        if item["precipMm"] >= rain_median and item["month"] not in heat_months
    ]
    drought = []
    for item in complete_months:
        if item["precipMm"] < half[item["month"]]:
            drought.append(
                {
                    "year": item["year"],
                    "month": item["month"],
                    "precipMm": item["precipMm"],
                    "thresholdMm": round(half[item["month"]], 3),
                    "rule": "monthly_precip_below_half_of_2016_2025_calendar_month_mean",
                }
            )
    power_prov = provenance(
        "nasa-power-daily-ag",
        "NASA POWER Daily API",
        POWER_URL,
        "reanalysis",
        (
            f"NASA POWER {meta.get('apiVersion')} community AG point {LAT}, {LON}, "
            f"elevation {elevation} m from the response geometry, {PERIOD_START} to {PERIOD_END}. "
            "Parameters T2M_MAX, T2M_MIN, T2M, RH2M, WS2M, ALLSKY_SFC_SW_DWN, PRECTOTCORR."
        ),
        "regional",
        {"value": 0.5, "unit": "degree", "note": "Meteorology is about 0.5 degree. ALLSKY_SFC_SW_DWN is a 1 degree solar product sampled at the point."},
    )
    fao_prov = provenance(
        "fao-56-pm",
        "FAO Irrigation and Drainage Paper 56",
        FAO56_URL,
        "derived_model",
        "Allen et al. 1998. FAO-56 Penman-Monteith equation 6, with Hargreaves equation 52 only if a POWER input for that day is missing. Mean relative humidity is used for actual vapor pressure because POWER RH2M is a daily mean.",
        "regional",
        {"value": 0.5, "unit": "degree", "note": "Computed at the POWER point elevation, not at a field elevation."},
    )
    check = crosscheck(rows)
    if check["maxAbsDiffT2M_C"] > 0.02 or check["maxAbsDiffPRECTOTCORR_mm"] > 0.02:
        raise RuntimeError(f"POWER download does not match the cached CSV: {check}")
    annual_precip = []
    annual_et0 = []
    for year in range(2016, 2026):
        subset = [item for item in complete_months if item["year"] == year]
        if len(subset) != 12:
            continue
        annual_precip.append(sum(item["precipMm"] for item in subset))
        annual_et0.append(sum(item["et0Mm"] for item in subset))
    if len(annual_et0) < 8:
        raise RuntimeError("Fewer than 8 complete years for annual means")
    document = base_document()
    document.update(
        {
            "description": "Monthly climate for one NASA POWER point in the Valle de San Juan. Rainfall in this file is POWER corrected precipitation, not GPM IMERG.",
            "point": {
                "latitude": LAT,
                "longitude": LON,
                "elevationM": elevation,
                "elevationSource": "NASA POWER response geometry. This cell is not the valley-floor elevation.",
                "bboxContext": BBOX,
            },
            "rules": {
                "hotDayScreenC": 32,
                "hotDayNote": "Days with T2M_MAX >= 32 C are counted as a screen. This is not a crop-damage threshold validated for San Juan.",
                "heatRisk": "Calendar months whose 2016-2025 mean daily T2M_MAX is at or above the 75th percentile of the 12 monthly means (NumPy linear percentile).",
                "droughtMonth": "A complete month whose POWER rainfall is below half the 2016-2025 mean of that calendar month.",
                "dryQuartile": "Calendar months at or below the 25th percentile of the 12 climatological monthly rainfall totals.",
                "sowingWindow": "Illustrative only: climatological rainfall at or above the median of the 12 months and the month is not a heat-risk month. Not an agronomic recommendation.",
                "publishedBeanWindow": {
                    "cropId": "habichuela_roja",
                    "start": "--11-05",
                    "end": "--12-15",
                    "source": "Team data inventory citation of the IDIAF bean compendium. The PDF was not re-parsed by this pipeline.",
                    "url": "https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf",
                },
            },
            "et0MethodCounts": dict(method_counts),
            "cacheCrosscheck": check,
            "thresholds": {
                "heatRiskTmaxMeanC": round(heat_cut, 4),
                "dryQuartilePrecipMm": round(dry_cut, 4),
                "sowingMedianPrecipMm": round(rain_median, 4),
            },
            "heatRiskMonths": heat_months,
            "dryQuartileMonths": dry_quartile_months,
            "illustrativeSowingMonths": sowing_months,
            "droughtMonths": drought,
            "climatology": climatology,
            "monthly": monthly,
            "metrics": [
                metric(
                    "power_mean_annual_precip",
                    "Mean annual POWER precipitation",
                    float(np.mean(annual_precip)),
                    "mm/year",
                    0.35,
                    "estimated",
                    power_prov,
                    "POWER precipitation is a coarse reanalysis and is weak for tropical rainfall. It is not GPM IMERG and is not a field measurement. The technical plan excludes POWER rainfall from the principal rainfall score.",
                ),
                metric(
                    "power_mean_daily_tmax",
                    "Mean daily maximum temperature",
                    float(np.mean([row["tmax"] for row in daily if row["tmax"] is not None])),
                    "C",
                    0.7,
                    "estimated",
                    power_prov,
                    "Regional reanalysis at the POWER cell elevation. It mixes valley and higher terrain and is not a parcel temperature.",
                ),
                metric(
                    "fao56_mean_annual_et0",
                    "Mean annual reference evapotranspiration",
                    float(np.mean(annual_et0)),
                    "mm/year",
                    0.6,
                    "estimated",
                    fao_prov,
                    "FAO-56 Penman-Monteith from POWER inputs at the cell elevation. Not measured lysimeter ET and not crop ET.",
                ),
                metric(
                    "drought_month_count",
                    "Count of months below half of the calendar-month mean",
                    len(drought),
                    "months",
                    0.35,
                    "preliminary",
                    power_prov,
                    "Project rule on POWER rainfall, not an official ONAMET or INDRHI drought declaration.",
                ),
            ],
            "missingData": [
                "GPM IMERG monthly precipitation inside the valley bbox",
                "Field-station monthly rainfall for Arroyo Loro",
            ],
        }
    )
    incomplete = [item for item in monthly if not item["complete"]]
    document["incompleteMonths"] = [
        {"year": item["year"], "month": item["month"]} for item in incomplete
    ]
    out = DERIVED / "climate_series.json"
    dump(out, document)
    if not 15 <= document["metrics"][1]["value"] <= 40:
        raise RuntimeError("Mean Tmax is outside the sanity range")
    annual_et0_value = document["metrics"][2]["value"]
    if not 800 <= annual_et0_value <= 2500:
        raise RuntimeError(f"Annual ET0 {annual_et0_value} is outside the sanity range")
    return document


if __name__ == "__main__":
    document = build()
    print(
        CASE_ID,
        "drought",
        len(document["droughtMonths"]),
        "heat",
        document["heatRiskMonths"],
        "sow",
        document["illustrativeSowingMonths"],
        "et0_methods",
        document["et0MethodCounts"],
    )
