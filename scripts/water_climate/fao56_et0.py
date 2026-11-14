import math
from datetime import datetime

SIGMA = 4.903e-9
GSC = 0.0820
ALBEDO = 0.23


def saturation_vapor_pressure(temp_c):
    return 0.6108 * math.exp(17.27 * temp_c / (temp_c + 237.3))


def extraterrestrial_radiation(lat_deg, day_of_year):
    phi = math.radians(lat_deg)
    dr = 1 + 0.033 * math.cos(2 * math.pi * day_of_year / 365)
    delta = 0.409 * math.sin(2 * math.pi * day_of_year / 365 - 1.39)
    cos_ws = -math.tan(phi) * math.tan(delta)
    cos_ws = min(1.0, max(-1.0, cos_ws))
    ws = math.acos(cos_ws)
    return (24 * 60 / math.pi) * GSC * dr * (
        ws * math.sin(phi) * math.sin(delta) + math.cos(phi) * math.cos(delta) * math.sin(ws)
    )


def penman_monteith(lat_deg, elevation_m, day_of_year, tmax, tmin, rh_mean, wind_2m, rs):
    tmean = (tmax + tmin) / 2
    es = (saturation_vapor_pressure(tmax) + saturation_vapor_pressure(tmin)) / 2
    ea = max(0.0, min(100.0, rh_mean)) / 100 * es
    slope = 4098 * saturation_vapor_pressure(tmean) / (tmean + 237.3) ** 2
    pressure = 101.3 * ((293 - 0.0065 * elevation_m) / 293) ** 5.26
    gamma = 0.000665 * pressure
    ra = extraterrestrial_radiation(lat_deg, day_of_year)
    rso = max((0.75 + 2e-5 * elevation_m) * ra, 1e-6)
    rns = (1 - ALBEDO) * rs
    ratio = min(rs / rso, 1.0)
    tmax_k = tmax + 273.16
    tmin_k = tmin + 273.16
    rnl = SIGMA * ((tmax_k ** 4 + tmin_k ** 4) / 2) * (0.34 - 0.14 * math.sqrt(max(ea, 0))) * (
        1.35 * ratio - 0.35
    )
    rn = rns - rnl
    et0 = (0.408 * slope * rn + gamma * (900 / (tmean + 273)) * wind_2m * (es - ea)) / (
        slope + gamma * (1 + 0.34 * wind_2m)
    )
    return et0, "fao56_penman_monteith"


def hargreaves(lat_deg, day_of_year, tmax, tmin):
    ra_mm = extraterrestrial_radiation(lat_deg, day_of_year) / 2.45
    tmean = (tmax + tmin) / 2
    et0 = 0.0023 * (tmean + 17.8) * math.sqrt(max(tmax - tmin, 0)) * ra_mm
    return et0, "fao56_hargreaves"


def reference_et0(lat_deg, elevation_m, day, tmax, tmin, rh_mean, wind_2m, rs):
    day_of_year = datetime.strptime(day, "%Y%m%d").timetuple().tm_yday
    if None not in (tmax, tmin, rh_mean, wind_2m, rs) and wind_2m >= 0 and rs >= 0:
        return penman_monteith(lat_deg, elevation_m, day_of_year, tmax, tmin, rh_mean, wind_2m, rs)
    if None not in (tmax, tmin):
        return hargreaves(lat_deg, day_of_year, tmax, tmin)
    return None, "missing"
