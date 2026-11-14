#!/usr/bin/env python3
"""Comprueba acceso público a NASA GIBS WMS. Generado con asistencia de IA (Codex)."""
import requests

URL = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"


def main():
    response = requests.get(URL, params={
        "SERVICE": "WMS", "REQUEST": "GetCapabilities", "VERSION": "1.3.0"
    }, timeout=60)
    response.raise_for_status()
    if b"WMS_Capabilities" not in response.content and b"WMT_MS_Capabilities" not in response.content:
        raise RuntimeError("GIBS respondió, pero el XML no parece ser capacidades WMS")
    print(f"GIBS disponible: HTTP {response.status_code}, {len(response.content)} bytes XML")


if __name__ == "__main__":
    main()
