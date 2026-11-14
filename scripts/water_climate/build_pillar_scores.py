import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DERIVED, base_document, dump, load, metric, provenance


def exposure(cycle, heat_months, dry_months):
    exposed = 0
    total = 0
    for month in cycle["months"]:
        flag = month["month"] in heat_months or month["month"] in dry_months
        exposed += month["cropDays"] if flag else 0
        total += month["cropDays"]
    if total == 0:
        return None
    return exposed / total


def build():
    climate = load(DERIVED / "climate_series.json")
    water = load(DERIVED / "crop_water.json")
    remote = load(DERIVED / "remote_access.json")
    heat = set(climate["heatRiskMonths"])
    dry = set(climate["dryQuartileMonths"])
    nets = [rotation["netIrrigationMm"] for rotation in water["rotations"]]
    low = min(nets)
    high = max(nets)
    span = high - low
    power_prov = provenance(
        "nasa-power-daily-ag",
        "NASA POWER Daily API",
        "https://power.larc.nasa.gov/",
        "reanalysis",
        "2016-2025 daily POWER point used as the climatology for both pillars.",
        "regional",
        {"value": 0.5, "unit": "degree", "note": "Not a parcel measurement."},
    )
    scenarios = []
    for rotation in water["rotations"]:
        fractions = [
            exposure(cycle, heat, dry)
            for cycle in rotation["cycles"]
        ]
        weights = [sum(cycle["stageDays"]) for cycle in rotation["cycles"]]
        fraction = sum(value * weight for value, weight in zip(fractions, weights)) / sum(weights)
        if span == 0:
            water_score = None
        else:
            water_score = round(5 * (high - rotation["netIrrigationMm"]) / span, 2)
        climate_score = round(5 * (1 - fraction), 2)
        water_metrics = [
            metric(
                "net_irrigation_demand",
                "Net irrigation demand",
                rotation["netIrrigationMm"],
                "mm/sequence",
                0.35,
                "preliminary",
                power_prov,
                "ETc minus USDA-SCS effective rain from POWER precipitation. IMERG was not available. Soil storage is ignored. Relative scores use only the three scenarios in this file.",
            ),
            metric(
                "crop_etc",
                "Crop evapotranspiration",
                rotation["etcMm"],
                "mm/sequence",
                0.45,
                "estimated",
                power_prov,
                "FAO-56 Kc curve times POWER Penman-Monteith ET0. Stage lengths are published examples, not local observations.",
            ),
            metric(
                "effective_rainfall",
                "Effective rainfall credited to the sequence",
                rotation["effectiveRainMm"],
                "mm/sequence",
                0.35,
                "preliminary",
                power_prov,
                "POWER rainfall, not IMERG. The technical plan keeps POWER tropical rainfall out of the principal rainfall product.",
            ),
        ]
        climate_metrics = [
            metric(
                "heat_or_dry_day_fraction",
                "Fraction of cycle days in heat-risk or dry-quartile months",
                round(fraction, 4),
                "1",
                0.45,
                "preliminary",
                power_prov,
                "Heat-risk months are the upper quartile of climatological mean Tmax. Dry-quartile months are the lowest quartile of POWER rainfall. This is not a yield or pest forecast.",
            ),
            metric(
                "drought_months_in_record",
                "Historical POWER drought months in 2016-2025",
                len(climate["droughtMonths"]),
                "months",
                0.35,
                "preliminary",
                power_prov,
                "Same count for every scenario. It describes the point climatology, not a difference between rotations.",
            ),
        ]
        scenarios.append(
            {
                "id": rotation["id"],
                "label": rotation["label"],
                "status": rotation["status"],
                "crops": [
                    {"cropId": cycle["cropId"], "seasonLabel": cycle["sowingDateTemplate"]}
                    for cycle in rotation["cycles"]
                ],
                "sourceIds": ["nasa-power-daily-ag", "fao-56", "idiaf-habichuela-compendio"],
                "pillars": [
                    {
                        "pillar": "water_soil",
                        "score": water_score,
                        "scoreScale": {
                            "min": 0,
                            "max": 5,
                            "direction": "Higher means lower estimated net irrigation demand than the other scenarios in this file.",
                        },
                        "summary": (
                            f"{rotation['label']} needs about {rotation['netIrrigationMm']} mm of net irrigation "
                            f"in this POWER climatology ({rotation['etcMm']} mm ETc and {rotation['effectiveRainMm']} mm effective rain). "
                            "Soil moisture, slope, and texture are missing, so the soil part of the pillar is not scored."
                        ),
                        "metrics": water_metrics,
                        "rulesApplied": [
                            "fao56_etc_minus_usda_scs_effective_rain",
                            "relative_net_irrigation_among_three_scenarios",
                            "power_precipitation_is_not_the_principal_rainfall_product",
                        ],
                        "missingData": [
                            "GPM IMERG monthly precipitation",
                            "SMAP soil moisture",
                            "SRTM slope",
                            "Local soil water-holding capacity",
                        ],
                        "reviewRisks": [
                            "Scenario, discuss with a local technician.",
                            "POWER cell elevation is higher than the valley floor described by the team, so temperature and ET0 may not match a field.",
                            rotation["note"],
                        ],
                    },
                    {
                        "pillar": "climate",
                        "score": climate_score,
                        "scoreScale": {
                            "min": 0,
                            "max": 5,
                            "direction": "Higher means a smaller share of cycle days falls in climatological heat-risk or dry-quartile months.",
                        },
                        "summary": (
                            f"About {round(100 * fraction, 1)} percent of the template cycle falls in a heat-risk or dry-quartile month "
                            f"at the POWER point. Heat-risk months are {sorted(heat)}. Dry-quartile months are {sorted(dry)}."
                        ),
                        "metrics": climate_metrics,
                        "rulesApplied": [
                            "one_minus_fraction_of_days_in_heat_or_dry_quartile_months",
                            "heat_risk_is_upper_quartile_of_monthly_mean_tmax",
                            "dry_quartile_uses_power_rainfall",
                        ],
                        "missingData": [
                            "GPM IMERG season onset",
                            "A crop-specific heat threshold validated for San Juan",
                        ],
                        "reviewRisks": [
                            "Illustrative climate screen, not a planting recommendation.",
                            "The 32 C hot-day count is a screen and is not used in the score.",
                        ],
                    },
                ],
            }
        )
    document = base_document()
    document.update(
        {
            "description": "Water-soil and climate scores for three illustrative rotations. Pest and market pillars are outside this file.",
            "scoreMethod": {
                "id": "water-climate-v1",
                "water": "score = 5 * (max net irrigation - scenario net irrigation) / (max - min) across the three scenarios. A score of 5 is only the lowest demand in this set.",
                "climate": "score = 5 * (1 - fraction of cycle days in heat-risk or dry-quartile calendar months).",
                "rainfallProduct": "POWER PRECTOTCORR because IMERG millimetres were not available without Earthdata Login.",
                "imergStatus": remote["imerg"]["status"],
                "smapStatus": remote["smap"]["status"],
            },
            "scenarios": scenarios,
        }
    )
    dump(DERIVED / "pillar_scores.json", document)
    return document


if __name__ == "__main__":
    document = build()
    for scenario in document["scenarios"]:
        scores = {pillar["pillar"]: pillar["score"] for pillar in scenario["pillars"]}
        print(scenario["id"], scores)
