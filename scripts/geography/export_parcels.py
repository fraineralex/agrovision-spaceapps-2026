"""AI: Codex/OpenAI, 2026-11-14; Frainer review pending.
Export preliminary satellite analysis units for the offline web map.
Requires Shapely (already included in scripts/ml/requirements.txt).
"""
import hashlib
import json
from pathlib import Path
from shapely.geometry import shape, mapping

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / 'data/derived/parcels_san_juan.geojson'
target = ROOT / 'web/public/data/parcels-san-juan.json'
raw = json.loads(source.read_text())


def rounded(value):
    if isinstance(value, float):
        return round(value, 5)
    if isinstance(value, (tuple, list)):
        return [rounded(item) for item in value]
    if isinstance(value, dict):
        return {key: rounded(item) for key, item in value.items()}
    return value


features = []
for feature in raw['features']:
    props = feature['properties']
    original = shape(feature['geometry'])
    geometry = original.simplify(0.000025, preserve_topology=True)
    geometry = shape(rounded(mapping(geometry)))
    if geometry.is_empty or not geometry.is_valid:
        geometry = shape(rounded(mapping(original)))
    assert geometry.is_valid and not geometry.is_empty
    center = original.representative_point()
    latest = props['features'].get('latest_ndvi')
    signal = 'unknown' if latest is None else 'low' if latest < .3 else 'mid' if latest < .5 else 'high'
    features.append({
        'type': 'Feature', 'id': props['parcelId'], 'geometry': rounded(mapping(geometry)),
        'properties': {
            'parcelId': props['parcelId'], 'name': f"Parcela aproximada {len(features) + 1}",
            'center': [round(center.x, 5), round(center.y, 5)],
            'signal': signal, 'latestNdvi': latest, 'latestObservedMonth': props['latestObservedMonth'],
            'coverClass': props['coverClass'], 'coverConfidence': props['coverConfidence'],
            'areaHa': round(props['areaM2'] / 10000, 2),
            'ndviSeries': [{'month': row['month'], 'value': None if row['value'] is None else round(row['value'], 3)} for row in props['ndviSeries']],
        },
    })
output = {
    'type': 'FeatureCollection', 'generatedAt': raw['generatedAt'], 'bbox': raw['bbox'],
    'aiAssistance': 'Codex/OpenAI, 2026-11-14; revisión por Frainer pendiente; véase AI_USAGE.md',
    'sourceFile': 'data/derived/parcels_san_juan.geojson',
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'provenance': raw['provenance'],
    'method': 'SLIC: unidades aproximadas, no límites de fincas. Geometría simplificada 0.000025 grados (~3 m), coordenadas a 5 decimales. Serie NDVI a 3 decimales.',
    'signalRule': 'Regla visual sin validación agronómica: NDVI reciente <0.3 rojo, <0.5 ámbar, >=0.5 verde; sin observación gris. No indica salud, riesgo ni riego.',
    'limitation': 'Prototipo sin validación de campo. Sentinel-2 L2A, 10 m; enero 2024–noviembre 2026. Confianza no calibrada. No son parcelas catastrales. NDVI no confirma cultivo, suelo pelado ni riego.',
    'features': features,
}
target.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n')
assert target.stat().st_size < 1_500_000
manifest_path = ROOT / 'web/public/data/manifest.json'
manifest = json.loads(manifest_path.read_text())
if target.name not in manifest['files']:
    manifest['files'].append(target.name)
manifest['sha256'][target.name] = hashlib.sha256(target.read_bytes()).hexdigest()
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'{len(features)} units; {target.stat().st_size:,} bytes; {target.relative_to(ROOT)}')
