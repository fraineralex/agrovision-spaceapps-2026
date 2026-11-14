import calendar
import csv
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (
    CROPWAT_CITE,
    DERIVED,
    FAO56_URL,
    IDIAF_BEAN_URL,
    LAT,
    POWER_CSV,
    TEMPLATE_YEAR,
    base_document,
    dump,
    load,
    metric,
    provenance,
)
from fao56_et0 import reference_et0

BEAN_STAGES = (20, 30, 40, 20)
MAIZE_STAGES = (20, 35, 40, 30)
PULSE_KC = {
    "kc": (0.4, 1.15, 0.35),
    "kcTable": "FAO-56 Table 12, Beans, dry and Pulses",
    "stages": BEAN_STAGES,
    "stageTable": "FAO-56 Table 11, dry beans, continental climates, 20/30/40/20 days",
    "heightM": 0.4,
}
CROPS = {
    "habichuela_roja": {
        "label": "Red bean (habichuela roja)",
        **PULSE_KC,
        "confidence": 0.5,
        "proxy": False,
    },
    "leguminosa_pulse": {
        "label": "Pulse (FAO-56 dry bean and pulses group)",
        **PULSE_KC,
        "confidence": 0.4,
        "proxy": False,
    },
    "maiz": {
        "label": "Maize (grain)",
        "kc": (0.3, 1.20, 0.35),
        "kcTable": "FAO-56 Table 12, cereals Kc ini 0.3 and maize field grain Kc mid 1.20, Kc end 0.35 for field drying",
        "stages": MAIZE_STAGES,
        "stageTable": "FAO-56 Table 11, maize grain, Nigeria humid June example, 20/35/40/30 days",
        "heightM": 2.0,
        "confidence": 0.5,
        "proxy": False,
    },
    "guandul_cover_proxy": {
        "label": "Pigeon pea cover, pulses proxy",
        **PULSE_KC,
        "kcTable": "FAO-56 does not list pigeon pea. Table 12 Beans, dry and Pulses is used as a proxy.",
        "stageTable": "Same indicative dry-bean stage lengths. Not a verified short cover duration.",
        "confidence": 0.3,
        "proxy": True,
    },
}


def kc_on_day(index, stages, coefficients):
    lini, ldev, lmid, llate = stages
    kc_ini, kc_mid, kc_end = coefficients
    if index < lini:
        return kc_ini
    if index < lini + ldev:
        return kc_ini + (kc_mid - kc_ini) * ((index - lini + 1) / ldev)
    if index < lini + ldev + lmid:
        return kc_mid
    late_index = index - (lini + ldev + lmid)
    return kc_mid + (kc_end - kc_mid) * ((late_index + 1) / llate)


def effective_rain(precip_mm):
    if precip_mm <= 250:
        value = precip_mm * (125 - 0.2 * precip_mm) / 125
    else:
        value = 125 + 0.1 * precip_mm
    return min(max(value, 0.0), precip_mm)


def load_daily_means():
    meta = load(DERIVED / "power_request.json")
    fill = float(meta["fillValue"])
    buckets = defaultdict(lambda: {"et0": [], "precip": []})
    with POWER_CSV.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    elevation = float(rows[0]["elevation_m"])

    def number(record, name):
        value = float(record[name])
        if value <= fill or value <= -900:
            return None
        return value

    for record in rows:
        tmax = number(record, "T2M_MAX")
        tmin = number(record, "T2M_MIN")
        rh = number(record, "RH2M")
        wind = number(record, "WS2M")
        rs = number(record, "ALLSKY_SFC_SW_DWN")
        precip = number(record, "PRECTOTCORR")
        et0, _method = reference_et0(LAT, elevation, record["date"], tmax, tmin, rh, wind, rs)
        if et0 is None or precip is None:
            continue
        key = (int(record["date"][4:6]), int(record["date"][6:8]))
        buckets[key]["et0"].append(max(et0, 0.0))
        buckets[key]["precip"].append(precip)
    means = {}
    min_years = None
    feb29_years = 0
    for key, values in buckets.items():
        sample = len(values["et0"])
        if key == (2, 29):
            feb29_years = sample
            continue
        min_years = sample if min_years is None else min(min_years, sample)
        means[key] = {
            "et0": sum(values["et0"]) / sample,
            "precip": sum(values["precip"]) / sample,
            "years": sample,
        }
    return means, min_years, feb29_years


def run_cycle(crop_id, start, daily_means, month_precip):
    crop = CROPS[crop_id]
    length = sum(crop["stages"])
    grouped = {}
    for index in range(length):
        current = start + timedelta(days=index)
        sample = daily_means[(current.month, current.day)]
        kc = kc_on_day(index, crop["stages"], crop["kc"])
        bucket = grouped.setdefault((current.year - TEMPLATE_YEAR, current.month), {"etc": 0.0, "days": 0})
        bucket["etc"] += kc * sample["et0"]
        bucket["days"] += 1
    months = []
    net_total = 0.0
    etc_total = 0.0
    peff_total = 0.0
    for (offset, month), bucket in sorted(grouped.items()):
        peff_month = effective_rain(month_precip[month])
        dim = calendar.monthrange(TEMPLATE_YEAR, month)[1]
        peff = peff_month * (bucket["days"] / dim)
        net = max(0.0, bucket["etc"] - peff)
        net_total += net
        etc_total += bucket["etc"]
        peff_total += peff
        months.append(
            {
                "yearOffset": offset,
                "month": month,
                "cropDays": bucket["days"],
                "etcMm": round(bucket["etc"], 3),
                "effectiveRainMm": round(peff, 3),
                "netIrrigationMm": round(net, 3),
            }
        )
    end = start + timedelta(days=length - 1)
    return {
        "cropId": crop_id,
        "label": crop["label"],
        "proxy": crop["proxy"],
        "kcIni": crop["kc"][0],
        "kcMid": crop["kc"][1],
        "kcEnd": crop["kc"][2],
        "kcSource": crop["kcTable"],
        "stageDays": list(crop["stages"]),
        "stageSource": crop["stageTable"],
        "heightM": crop["heightM"],
        "confidence": crop["confidence"],
        "sowingDateTemplate": start.isoformat(),
        "endDateTemplate": end.isoformat(),
        "etcMm": round(etc_total, 3),
        "effectiveRainMm": round(peff_total, 3),
        "netIrrigationMm": round(net_total, 3),
        "months": months,
    }


def build():
    climate = load(DERIVED / "climate_series.json")
    daily_means, min_years, feb29_years = load_daily_means()
    month_precip = {item["month"]: item["precipMm"] for item in climate["climatology"]}
    wettest = max(climate["climatology"], key=lambda item: item["precipMm"])
    sowing = set(climate["illustrativeSowingMonths"])
    outside_bean_window = [
        item for item in climate["climatology"] if item["month"] in sowing and item["month"] != 11
    ]
    lead = max(outside_bean_window or climate["climatology"], key=lambda item: item["precipMm"])
    bean_start = date(TEMPLATE_YEAR, 11, 15)
    pulse_start = date(TEMPLATE_YEAR, lead["month"], 1)
    sequences = [
        {
            "id": "habichuela_maiz",
            "label": "Red bean then maize",
            "status": "illustrative",
            "crops": [
                ("habichuela_roja", bean_start),
                ("maiz", bean_start + timedelta(days=sum(BEAN_STAGES))),
            ],
            "note": "Bean sowing is 15 November, inside the 5 November-15 December window cited from the IDIAF compendium. It is not an optimal date. Maize starts the next day.",
        },
        {
            "id": "leguminosa_maiz",
            "label": "Pulse then maize, outside the November bean window",
            "status": "illustrative",
            "crops": [
                ("leguminosa_pulse", pulse_start),
                ("maiz", pulse_start + timedelta(days=sum(BEAN_STAGES))),
            ],
            "note": (
                f"The pulse uses FAO-56 dry-bean and pulses coefficients and starts on the first day of month {lead['month']}. "
                "November is reserved for the red-bean window, so this start is the wettest remaining illustrative sowing month. It is not identified as red bean."
            ),
        },
        {
            "id": "habichuela_guandul_maiz",
            "label": "Red bean, pigeon-pea proxy, then maize",
            "status": "illustrative",
            "crops": [
                ("habichuela_roja", bean_start),
                ("guandul_cover_proxy", bean_start + timedelta(days=sum(BEAN_STAGES))),
                ("maiz", bean_start + timedelta(days=sum(BEAN_STAGES) * 2)),
            ],
            "note": "Pigeon pea has no FAO-56 row. A full dry-bean stage length is used as a proxy, not a verified cover-crop duration.",
        },
    ]
    fao_prov = provenance(
        "fao-56-kc",
        "FAO Irrigation and Drainage Paper 56",
        FAO56_URL,
        "published_rule",
        "Allen et al. 1998, Tables 11 and 12 and Chapter 6 Kc curve. Kc was not adjusted with equation 62 because POWER provides mean relative humidity rather than RHmin.",
        "regional",
        {"value": 0.5, "unit": "degree", "note": "ET0 is the POWER-point climatology. Kc values are global table values."},
        limitation_period=False,
    )
    rain_prov = provenance(
        "nasa-power-precip-climatology",
        "NASA POWER PRECTOTCORR",
        "https://power.larc.nasa.gov/",
        "reanalysis",
        "Monthly effective rain uses the 2016-2025 POWER climatology and the USDA SCS formula as implemented in FAO CROPWAT.",
        "regional",
        {"value": 0.5, "unit": "degree", "note": "Not IMERG and not a field gauge."},
    )
    idiaf_prov = provenance(
        "idiaf-habichuela-compendio",
        "IDIAF bean compendium, as cited by the team inventory",
        IDIAF_BEAN_URL,
        "published_rule",
        "Team inventory: sowing 5 November-15 December and 250-400 mm of water. The PDF was not re-parsed in this pipeline.",
        "regional",
        None,
        limitation_period=False,
    )
    results = []
    for sequence in sequences:
        cycles = [run_cycle(crop_id, start, daily_means, month_precip) for crop_id, start in sequence["crops"]]
        bean = next((cycle for cycle in cycles if cycle["cropId"] == "habichuela_roja"), None)
        results.append(
            {
                "id": sequence["id"],
                "label": sequence["label"],
                "status": sequence["status"],
                "note": sequence["note"],
                "cycles": cycles,
                "etcMm": round(sum(cycle["etcMm"] for cycle in cycles), 3),
                "effectiveRainMm": round(sum(cycle["effectiveRainMm"] for cycle in cycles), 3),
                "netIrrigationMm": round(sum(cycle["netIrrigationMm"] for cycle in cycles), 3),
                "beanEtcWithinIdiaf250to400mm": None if bean is None else 250 <= bean["etcMm"] <= 400,
            }
        )
    document = base_document()
    document.update(
        {
            "description": "Illustrative FAO-56 crop water use for three Valle de San Juan rotations. Scenarios require local review.",
            "templateYear": TEMPLATE_YEAR,
            "minimumYearsPerMonthDay": min_years,
            "february29Years": feb29_years,
            "effectiveRainMethod": CROPWAT_CITE,
            "allocation": "Monthly effective rain is multiplied by crop days divided by days in the month. Rain on days without the crop is not credited. Soil water storage is not simulated.",
            "wettestClimatologicalMonth": wettest["month"],
            "rotationLeadMonth": lead["month"],
            "rotations": results,
            "metrics": [
                metric(
                    "habichuela_template_etc",
                    "Red bean ETc on the 15 November template",
                    results[0]["cycles"][0]["etcMm"],
                    "mm/cycle",
                    0.45,
                    "preliminary",
                    fao_prov,
                    "Compared with the 250-400 mm range cited from the IDIAF compendium. Stage lengths are a FAO-56 example, not a San Juan calibration.",
                ),
                metric(
                    "idiaf_habichuela_water_range_low",
                    "IDIAF cited red-bean water requirement, low end",
                    250,
                    "mm/cycle",
                    0.6,
                    "preliminary",
                    idiaf_prov,
                    "Taken from the team inventory citation. This pipeline did not re-read the PDF.",
                ),
                metric(
                    "idiaf_habichuela_water_range_high",
                    "IDIAF cited red-bean water requirement, high end",
                    400,
                    "mm/cycle",
                    0.6,
                    "preliminary",
                    idiaf_prov,
                    "Taken from the team inventory citation. This pipeline did not re-read the PDF.",
                ),
            ],
            "missingData": [
                "GPM IMERG rainfall for effective rain",
                "SMAP soil moisture",
                "Local Kc and stage lengths for San Juan",
                "Pigeon pea coefficients and a verified cover duration",
                "Soil water-holding capacity",
            ],
            "provenanceRain": rain_prov,
        }
    )
    dump(DERIVED / "crop_water.json", document)
    return document


if __name__ == "__main__":
    document = build()
    for rotation in document["rotations"]:
        print(rotation["id"], rotation["etcMm"], rotation["netIrrigationMm"], rotation["beanEtcWithinIdiaf250to400mm"])
