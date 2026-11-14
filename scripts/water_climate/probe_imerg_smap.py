import sys
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BBOX, DERIVED, base_document, dump

GIBS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
IMERG_FILE = (
    "https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGM.07/2020/"
    "3B-MO.MS.MRG.3IMERG.20200101-S000000-E235959.01.V07B.HDF5.ascii"
    "?lat[1080:1095]"
)
SMAP_LAYER_L3 = "SMAP_L3_Passive_Enhanced_Day_Soil_Moisture"
SMAP_LAYER_L4 = "SMAP_L4_Analyzed_Surface_Soil_Moisture"
IMERG_LAYER = "IMERG_Precipitation_Rate"


def request_status(method, url, **kwargs):
    try:
        response = requests.request(method, url, timeout=60, allow_redirects=False, **kwargs)
        location = response.headers.get("location")
        if location and "?" in location:
            location = location.split("?", 1)[0]
        return {
            "url": url.split("?", 1)[0],
            "httpStatus": response.status_code,
            "contentType": response.headers.get("content-type"),
            "location": location,
            "bytes": len(response.content),
        }
    except requests.RequestException as exc:
        return {"url": url, "error": type(exc).__name__, "detail": str(exc)}


def gibs_map(layer):
    params = {
        "SERVICE": "WMS",
        "REQUEST": "GetMap",
        "VERSION": "1.3.0",
        "LAYERS": layer,
        "CRS": "EPSG:4326",
        "BBOX": "17,-73,20,-69",
        "WIDTH": "64",
        "HEIGHT": "64",
        "FORMAT": "image/png",
        "TRANSPARENT": "TRUE",
        "TIME": "2020-06-15",
    }
    result = request_status("GET", GIBS, params=params)
    result["layer"] = layer
    result["note"] = "Browse image only. Pixel colors were not converted to physical values."
    content_type = result.get("contentType") or ""
    result["png"] = "image/png" in content_type and result.get("httpStatus") == 200
    result["opaquePixels"] = None
    if result["png"]:
        response = requests.get(GIBS, params=params, timeout=60)
        image = Image.open(BytesIO(response.content))
        if image.mode == "RGBA":
            alpha = image.getchannel("A")
            result["opaquePixels"] = sum(alpha.histogram()[1:])
        else:
            result["opaquePixels"] = image.size[0] * image.size[1]
    return result


def gibs_feature_info():
    params = {
        "SERVICE": "WMS",
        "REQUEST": "GetFeatureInfo",
        "VERSION": "1.3.0",
        "LAYERS": IMERG_LAYER,
        "QUERY_LAYERS": IMERG_LAYER,
        "CRS": "EPSG:4326",
        "BBOX": f"{BBOX['latMin']},{BBOX['lonMin']},{BBOX['latMax']},{BBOX['lonMax']}",
        "WIDTH": "10",
        "HEIGHT": "10",
        "I": "5",
        "J": "5",
        "INFO_FORMAT": "application/json",
        "TIME": "2020-06-15",
    }
    result = request_status("GET", GIBS, params=params)
    body = ""
    if result.get("httpStatus"):
        response = requests.get(GIBS, params=params, timeout=60)
        body = response.text[:240]
    result["bodyPrefix"] = body
    return result


def build():
    imerg_numeric = request_status("GET", IMERG_FILE)
    imerg_dir = request_status(
        "GET", "https://gpm1.gesdisc.eosdis.nasa.gov/data/GPM_L3/GPM_3IMERGM.07/2020/"
    )
    smap_l3 = gibs_map(SMAP_LAYER_L3)
    smap_l4 = gibs_map(SMAP_LAYER_L4)
    imerg_map = gibs_map(IMERG_LAYER)
    feature = gibs_feature_info()
    appeears = request_status(
        "POST",
        "https://appeears.earthdatacloud.nasa.gov/api/login",
        headers={"Content-Type": "application/json"},
        json={"username": "", "password": ""},
    )
    numeric_imerg = imerg_numeric.get("httpStatus") == 200 and "text" in (
        imerg_numeric.get("contentType") or ""
    )
    document = base_document()
    document.update(
        {
            "bbox": BBOX,
            "imerg": {
                "product": "GPM IMERG Final monthly V07 (GPM_3IMERGM)",
                "numericAvailable": numeric_imerg,
                "status": "pending_earthdata_login" if not numeric_imerg else "retrieved",
                "usedInScores": False,
                "fallback": "NASA POWER PRECTOTCORR at 18.8 N, 71.23 W",
                "checks": {
                    "opendapAscii": imerg_numeric,
                    "httpsDirectory": imerg_dir,
                    "gibsGetMap": imerg_map,
                    "gibsGetFeatureInfo": feature,
                },
                "limitation": "Directory listings and GIBS browse maps answer without a login. The OPeNDAP subset that contains millimetres redirects to Earthdata Login. GIBS GetFeatureInfo is not enabled, so the PNG cannot be read as monthly rainfall. No IMERG millimetres are stored.",
            },
            "smap": {
                "numericAvailable": False,
                "status": "pending",
                "sample": None,
                "checks": {
                    "gibsL3PassiveEnhancedDay": smap_l3,
                    "gibsL4AnalyzedSurface": smap_l4,
                    "appeearsLoginWithoutCredentials": appeears,
                },
                "limitation": "GIBS can return a soil-moisture browse image for SMAP L4. That image was not converted to volumetric water content. AppEEARS login rejects an empty credential. No SMAP soil-moisture number is stored.",
            },
        }
    )
    dump(DERIVED / "remote_access.json", document)
    return document


if __name__ == "__main__":
    document = build()
    print(document["imerg"]["status"], document["smap"]["status"])
