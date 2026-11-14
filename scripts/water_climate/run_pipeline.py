import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_climate_monthly import build as build_climate
from build_crop_water import build as build_water
from build_pillar_scores import build as build_scores
from fetch_power_ag import fetch
from plot_water_climate import build as build_plot
from probe_imerg_smap import build as probe
from common import POWER_CSV


def main():
    if not POWER_CSV.exists():
        fetch()
    probe()
    build_climate()
    build_water()
    build_scores()
    build_plot()


if __name__ == "__main__":
    main()
