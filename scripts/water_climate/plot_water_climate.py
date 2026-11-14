import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DERIVED, load

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def build():
    climate = load(DERIVED / "climate_series.json")
    water = load(DERIVED / "crop_water.json")
    climatology = climate["climatology"]
    precip = [item["precipMm"] for item in climatology]
    et0 = [item["et0Mm"] for item in climatology]
    labels = [rotation["label"] for rotation in water["rotations"]]
    nets = [rotation["netIrrigationMm"] for rotation in water["rotations"]]
    figure, axes = plt.subplots(1, 2, figsize=(11.2, 4.6))
    axes[0].bar(MONTHS, precip, color="#4C78A8", label="POWER precipitation")
    axes[0].plot(MONTHS, et0, color="#F58518", marker="o", label="FAO-56 ET0")
    axes[0].set_ylabel("mm / month")
    axes[0].set_title("2016-2025 climatology at 18.8 N, 71.23 W")
    axes[0].legend(frameon=False, loc="upper left", fontsize=8)
    axes[0].tick_params(axis="x", labelrotation=45)
    axes[1].barh(labels, nets, color="#54A24B")
    axes[1].set_xlabel("mm / sequence")
    axes[1].set_title("Illustrative net irrigation")
    figure.suptitle("Valle de San Juan water and climate screen (POWER, not IMERG)")
    figure.text(
        0.01,
        0.01,
        "Sources: NASA POWER Daily API and FAO-56. Rainfall is reanalysis at about 0.5 degree. Not a field recommendation.",
        fontsize=8,
    )
    figure.tight_layout(rect=(0, 0.04, 1, 0.94))
    output = DERIVED / "water_climate_climatology.png"
    figure.savefig(output, dpi=140)
    plt.close(figure)
    return output


if __name__ == "__main__":
    print(build())
