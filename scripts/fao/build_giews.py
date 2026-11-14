#!/usr/bin/env python3
"""FAO GIEWS DOM cache. AI: Codex/OpenAI, 2026-11-14; Frainer review pending."""
import argparse
import csv
import gzip
import hashlib
import io
import json
import math
from pathlib import Path
import re
import subprocess
import tempfile
import unicodedata
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'data/cache/fao_giews'
OUT = ROOT / 'data/derived/fao_giews'
PUBLIC = ROOT / 'web/public/data/fao-giews.json'
PAGE = 'https://www.fao.org/giews/earthobservation/country/index.jsp?lang=es&code=DOM'
BASE = 'https://www.fao.org/giews/earthobservation/'
WMTS = 'https://data.apps.fao.org/map/wmts/wmts'
NS = {'w': 'http://www.opengis.net/wmts/1.0', 'o': 'http://www.opengis.net/ows/1.1'}


def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2, allow_nan=False) + '\n')


def download(url):
    # curl works with this site's public CDN; urllib received HTTP 403 in this environment.
    with tempfile.NamedTemporaryFile() as tmp:
        result = subprocess.run(['curl', '-L', '-sS', '--retry', '2', '--max-time', '45',
                                 '-w', '%{http_code}', '-o', tmp.name, url], capture_output=True, text=True)
        body = Path(tmp.name).read_bytes()
    if result.returncode or result.stdout != '200':
        raise RuntimeError(f'HTTP {result.stdout}; curl exit {result.returncode}')
    return body


def refresh():
    from datetime import datetime, timezone
    fetched = datetime.now(timezone.utc).isoformat()
    page = download(PAGE).decode('utf-8')
    urls = sorted(set(urljoin(PAGE, u) for u in re.findall(r'href="([^"]+\.csv)"', page)
                      if 'ndvi_adm1_data' not in u))
    report = {'retrievedAt': fetched, 'page': PAGE, 'endpoints': []}
    for url in urls:
        name = url.rsplit('/', 1)[-1]
        try:
            body = download(url)
            text = decode(body)
            if not list(csv.DictReader(io.StringIO(text))) or '<html' in text[:100].lower():
                raise ValueError('Not a data CSV')
            (CACHE / (name + '.gz')).write_bytes(gzip.compress(body, mtime=0))
            report['endpoints'].append({'url': url, 'status': 'ok', 'file': name + '.gz',
                                        'sha256': hashlib.sha256(body).hexdigest()})
        except (RuntimeError, ValueError) as exc:
            report['endpoints'].append({'url': url, 'status': 'unavailable', 'error': str(exc)})
    # Mapset names are advertised by the site's open_WMS.jsp table.
    for layer in ['ASI-D', 'ASI-A', 'MVHI-D', 'VHI-D', 'HDF', 'PHE']:
        url = WMTS + '?service=WMTS&request=GetCapabilities&version=1.0.0&layer=fao-gismgr/ASIS/mapsets/' + layer
        try:
            body = download(url)
            root = ET.fromstring(body)
            if root.find('.//w:Layer', NS) is None:
                raise ValueError('No WMTS layers')
            (CACHE / (layer + '-capabilities.xml.gz')).write_bytes(gzip.compress(body, mtime=0))
            report['endpoints'].append({'url': url, 'status': 'ok', 'file': layer + '-capabilities.xml.gz',
                                        'sha256': hashlib.sha256(body).hexdigest()})
        except (RuntimeError, ValueError, ET.ParseError) as exc:
            report['endpoints'].append({'url': url, 'status': 'unavailable', 'error': str(exc)})
    report['limits'] = {
        'gaul2': 'No se publica enlace CSV GAUL 2 para DOM en la página consultada; no se inventa endpoint.',
        'phenology': 'PHE ofrece SOS/MOS/EOS para GS1/GS2 y LC-C/LC-G vía WMTS; sin CSV provincial enlazado. No se interpreta un color como fecha de siembra.',
        'hdf': 'HDF ofrece AL30/AL50 vía WMTS; el recuento provincial se deriva del CSV ASI anual, no de los colores del mapa.',
        'rainBaseline': 'Período base LTA no especificado en el CSV; no se atribuye un período supuesto.',
    }
    write(CACHE / 'access.json', report)


def decode(body):
    try:
        return body.decode('utf-8-sig')
    except UnicodeDecodeError:
        return body.decode('latin1')


def rows(name):
    path = CACHE / (name + '.gz')
    if not path.exists():
        return []
    return list(csv.DictReader(io.StringIO(decode(gzip.decompress(path.read_bytes())))))


def number(value, low, high):
    try:
        n = float(value)
        return n if math.isfinite(n) and low <= n <= high else None
    except (TypeError, ValueError):
        return None


def normalize(name):
    return ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn').lower()


def latest(items, code, source, maximum):
    subset = [r for r in items if r.get('ADM1_CODE') == code and r.get('Land_Type', 'Crop Area') == 'Crop Area']
    if not subset:
        return None
    date = max(r['Date'] for r in subset)
    values = {number(r['Data'], 0, maximum) for r in subset if r['Date'] == date}
    # Conflicting duplicates and sentinel values remain unknown; never fall back to an older good observation.
    if len(values) != 1 or None in values:
        return None
    return {'value': values.pop(), 'date': date, 'source': source}


def history(items, code, season, source):
    grouped = {}
    for r in items:
        if r['ADM1_CODE'] == code and r['CROP_MASK'] == 'Cropland' and 1984 <= int(r['YEAR']) <= 2025:
            grouped.setdefault(int(r['YEAR']), set()).add(number(r['DATA'], 0, 100))
    annual = [{'year': year, 'asiPct': next(iter(v))} for year, v in sorted(grouped.items()) if len(v) == 1 and None not in v]
    if not annual:
        return None
    n30 = sum(r['asiPct'] > 30 for r in annual)
    n50 = sum(r['asiPct'] > 50 for r in annual)
    return {'season': season, 'start': annual[0]['year'], 'end': annual[-1]['year'], 'seasons': len(annual),
            'above30': n30, 'above50': n50, 'frequency30Pct': round(n30 / len(annual) * 100, 2),
            'frequency50Pct': round(n50 / len(annual) * 100, 2), 'annual': annual, 'source': source}


def build():
    report = json.loads((CACHE / 'access.json').read_text())
    sources = {r['file'].removesuffix('.gz'): r['url'] for r in report['endpoints'] if r['status'] == 'ok'}
    asi_name = 'ASI_Dekad_Season1_data.csv'
    vhi_name = 'vhi_adm1_dekad_data.csv'
    wvhi_name = 'MVHI_Dekad_Season1_data.csv'
    rain_name = 'rain_adm1_data.csv'
    asi, vhi, wvhi, rain = [rows(name) for name in [asi_name, vhi_name, wvhi_name, rain_name]]
    annual_names = [f'ASI_AnnualSummary_Season{s}_data.csv' for s in [1, 2]]
    annual = [rows(n) for n in annual_names]
    names = {r['ADM1_CODE']: r['PROVINCE'] for series in annual for r in series if r['ADM1_CODE']}
    aliases = {'Baoruco': 'Bahoruco', 'Salcedo': 'Hermanas Mirabal', 'Maria Trinidad Sanches': 'María Trinidad Sánchez'}
    boundaries = json.loads((ROOT / 'web/public/data/provinces.json').read_text())
    modern = {normalize(f['properties']['shapeName']): f['properties']['shapeName'] for f in boundaries['features']}
    modern.update({'elias pina': 'Elías Piña', 'el seibo': 'El Seibo', 'hermanas mirabal': 'Hermanas Mirabal'})
    provinces = []
    for code, original in sorted(names.items()):
        name = modern.get(normalize(aliases.get(original, original)), aliases.get(original, original))
        histories = [h for s, items in enumerate(annual) if (h := history(items, code, s + 1, sources.get(annual_names[s])))]
        last_rain = latest(rain, code, sources.get(rain_name), 5000)
        if last_rain:
            baseline = {number(r['Data_long_term_Average'], 0, 5000) for r in rain if r['ADM1_CODE'] == code and r['Date'] == last_rain['date']}
            normal = next(iter(baseline)) if len(baseline) == 1 else None
            last_rain.update({'normalMm': normal, 'anomalyPct': round(100 * (last_rain['value'] / normal - 1), 1) if normal and normal > 0 else None})
        province = {'name': name, 'sourceName': original, 'gaul1': code,
                    'asi': latest(asi, code, sources.get(asi_name), 100),
                    'vhi': latest(vhi, code, sources.get(vhi_name), 1),
                    'weightedVhi': latest(wvhi, code, sources.get(wvhi_name), 1),
                    'rain': last_rain, 'history': histories,
                    'phenology': None,
                    'phenologyStatus': report['limits']['phenology']}
        provinces.append(province)
        write(OUT / (code + '.json'), province)
    data = {'schemaVersion': 1, 'retrievedAt': report['retrievedAt'], 'source': PAGE,
            'quality': 'Contexto provincial preliminar; sin validación en finca. Límites GAUL históricos; equivalencia administrativa no validada geométricamente.',
            'scale': 'GAUL nivel 1 · vegetación ~1 km; lluvia ECMWF de resolución más gruesa, no especificada en CSV.',
            'method': 'ASI/VHI: indicadores satelitales derivados; lluvia: estimación ECMWF; frecuencias calculadas desde ASI anual.',
            'rainBaseline': report['limits']['rainBaseline'], 'provinces': provinces}
    write(OUT / 'index.json', data)
    write(OUT / 'endpoints.json', report)
    write(PUBLIC, data)
    print(f'{len(provinces)} provincias exportadas; sin consultas de red en la app.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Descubrir y descargar fuentes; por defecto reconstruye offline')
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    if args.refresh:
        refresh()
    build()
