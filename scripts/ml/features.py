# AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending.
"""SLIC analysis units and transparent temporal NDVI features (not cadastral fields)."""
import warnings
import numpy as np
from rasterio.features import shapes
from rasterio.transform import Affine
from shapely.geometry import shape
from skimage.segmentation import slic

FEATURE_NAMES = ['ndvi_mean', 'ndvi_p10', 'ndvi_p90', 'ndvi_amplitude',
                 'bare_month_fraction', 'seasonality', 'dry_ndvi', 'wet_ndvi',
                 'wet_minus_dry', 'observed_month_fraction', 'latest_ndvi']


def finite(value):
    return float(value) if np.isfinite(value) else None


def segment_and_features(cache, n_segments=600):
    cube = cache['ndvi'].astype('float32')
    wc, months = cache['worldcover'], cache['months'].tolist()
    transform = Affine(*cache['transform'])
    valid = (np.isfinite(cube).sum(axis=0) >= 12) & np.isin(wc, [10, 20, 30, 40, 60, 90, 95, 100])
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', RuntimeWarning)
        image = np.stack([np.nanpercentile(cube, p, axis=0) for p in (10, 50, 90)], axis=-1)
    # Fill only for boundary construction; statistics never fill missing observations.
    image = np.nan_to_num(image, nan=0.0)
    labels = slic(image, n_segments=n_segments, compactness=0.15, sigma=1,
                  start_label=1, mask=valid, channel_axis=-1, convert2lab=False)
    geometries = {int(label): shape(geom) for geom, label in
                  shapes(labels.astype('int32'), mask=labels > 0, transform=transform)}
    records = []
    for label in sorted(geometries):
        mask = labels == label
        size = int(mask.sum())
        if size < 25:
            continue
        values = cube[:, mask]
        coverage = np.isfinite(values).mean(axis=1)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', RuntimeWarning)
            series = np.nanmean(values, axis=1)
        series[coverage < 0.5] = np.nan
        good = np.isfinite(series)
        if good.sum() < 12:
            continue
        p10, p90 = np.nanpercentile(series, [10, 90])
        climatology = [np.nanmean(series[[int(m[5:7]) == j for m in months]])
                       if np.isfinite(series[[int(m[5:7]) == j for m in months]]).any()
                       else np.nan for j in range(1, 13)]
        dry = series[[int(m[5:7]) in (1, 2, 3) for m in months]]
        wet = series[[int(m[5:7]) in (5, 6, 9, 10) for m in months]]
        dry_mean = np.nanmean(dry) if np.isfinite(dry).sum() >= 3 else np.nan
        wet_mean = np.nanmean(wet) if np.isfinite(wet).sum() >= 3 else np.nan
        last_index = np.flatnonzero(good)[-1]
        bare_count = int((series[good] < 0.2).sum())
        feature = [np.nanmean(series), p10, p90, p90-p10, bare_count/good.sum(),
                   np.nanstd(climatology), dry_mean, wet_mean, wet_mean-dry_mean,
                   good.mean(), series[last_index]]
        classes, counts = np.unique(wc[mask], return_counts=True)
        majority = int(classes[counts.argmax()])
        crop_fraction = float((wc[mask] == 40).mean())
        bare_fraction = float((wc[mask] == 60).mean())
        # These are project heuristics, not verified agronomic rules or reference labels.
        cover = None
        if crop_fraction + bare_fraction >= 0.6 and series[last_index] < 0.2:
            cover = 'bare_soil'
        elif crop_fraction >= 0.6 and series[last_index] >= 0.35:
            cover = 'crop'
        irrigation = None
        if crop_fraction >= 0.6 and np.isfinite(dry_mean) and np.isfinite(wet_mean):
            if dry_mean >= 0.48 and dry_mean >= wet_mean-0.10:
                irrigation = 'irrigation_signal'
            elif dry_mean <= 0.35 and wet_mean >= 0.50 and wet_mean-dry_mean >= 0.15:
                irrigation = 'rainfed_signal'
        records.append({'label': label, 'geometry': geometries[label], 'size': size,
                        'features': dict(zip(FEATURE_NAMES, map(finite, feature))),
                        'series': list(map(finite, series)),
                        'coverage': coverage.tolist(), 'bare_months': bare_count,
                        'observed_months': int(good.sum()),
                        'latest_month': months[last_index],
                        'worldcover_majority': majority, 'crop_fraction': crop_fraction,
                        'cover_weak_label': cover, 'water_weak_label': irrigation})
    if not records:
        raise RuntimeError('No analysis units have sufficient observed months')
    return labels, records
