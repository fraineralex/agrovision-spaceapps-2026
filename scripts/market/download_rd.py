#!/usr/bin/env python3
# AI assistance: Codex (OpenAI), 2026-11-14. Frainer review: pending.
"""Refresh public official sources; analysis/build_rd.py runs offline afterwards."""
import hashlib
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data/raw/market_rd"
PDF_BASE = "https://agricultura.gob.do/wp-content/uploads/"
URLS = {
    "ckan_precios": "https://datos.gob.do/api/3/action/package_search?q=precios&rows=100",
    "ckan_siembra": "https://datos.gob.do/api/3/action/package_search?q=siembra&rows=100",
    "ckan_banco": "https://datos.gob.do/api/3/action/package_search?q=banco%20agricola&rows=100",
    "economia": "https://backoffice.datos.gob.do/km/group/economia",
    "seasonal": PDF_BASE + "2022/09/Indice-Estacional-de-Precios-2019.pdf",
    "statistics": PDF_BASE + "2022/09/Boletin-Estadistico-del-Sector-Agropecuario-2002-2018.pdf",
    "costs": PDF_BASE + "2022/09/Costos-Estimados-de-Produccin-de-Cultivos-Agrcolas-2019.pdf",
    "daily": PDF_BASE + "2025/10/Informe-de-precios-01-de-octubre-2025.pdf",
    "contingency": PDF_BASE + "2026/06/PLAN-DE-CONTINGIA-DEGRYCC-1-DE-JUNIO-2026.pdf",
    "indrhi": "https://indrhi.gob.do/documentos/",
}


def download(task):
    key, url = task
    item = {"id": key, "url": url, "retrievedAt": datetime.now(timezone.utc).isoformat()}
    try:
        with urlopen(Request(url, headers={"User-Agent": "AgroVision public data research"}), timeout=45) as r:
            raw = r.read()
            ext = "pdf" if raw.startswith(b"%PDF") else "csv" if key in RESOURCE_NAMES else "json" if "json" in r.headers.get("Content-Type", "") else "html"
            path = RAW / f"{key}.{ext}"
            path.write_bytes(raw)
            item.update(status=r.status, path=str(path.relative_to(ROOT)), bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
            if ext == "pdf":
                subprocess.run(["pdftotext", "-layout", str(path), str(path.with_suffix(".txt"))], check=True)
    except Exception as error:
        item["error"] = str(error)
    return item


RESOURCE_NAMES = {"retail", "wholesale", "sowing", "harvest", "production_quintales", "production_millares", "financed_area", "financed_amount"}


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        manifest = list(pool.map(download, URLS.items()))
    (RAW / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    tasks = []
    metadata = {}
    for name in ("precios", "siembra", "banco"):
        for package in json.loads((RAW / f"ckan_{name}.json").read_text())["result"]["results"]:
            if package["name"] not in {"info", "si", "areasfinanciadasporsucursales", "montos-otorgados-por-destino"}:
                continue
            for r in package["resources"]:
                if r["format"] != "CSV":
                    continue
                u = r["url"].replace("http://", "https://")
                key = "wholesale" if "Mayorista" in u else "retail" if "Minorista" in u else "sowing" if "-Siembra-" in u else "harvest" if "-Cosecha-" in u else "production_quintales" if "-Quintales-" in u else "production_millares" if "-Millares-" in u else "financed_area" if "areas-financiadas" in u else "financed_amount"
                tasks.append((key, u))
                metadata[key] = {"resourceId": r["id"], "package": package["name"], "license": package.get("license_id")}
    with ThreadPoolExecutor(max_workers=8) as pool:
        resources = list(pool.map(download, tasks))
    for row in resources:
        row.update(metadata[row["id"]])
    (RAW / "resources_manifest.json").write_text(json.dumps(resources, indent=2) + "\n")
    print(json.dumps(manifest + resources, indent=2))


if __name__ == "__main__":
    main()
