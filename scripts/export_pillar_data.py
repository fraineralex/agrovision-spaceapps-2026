"""AI: Codex/OpenAI, 2026-11-14; Frainer review pending. Offline web export."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def build():
    def load(name):
        return json.loads((ROOT / 'data/derived' / name).read_text())
    market = load('market_prices.json')
    payload = {
        'aiAssistance': 'Codex/OpenAI, 2026-11-14; Frainer review pending',
        'waterClimate': load('water_climate/pillar_scores.json'),
        'rotations': load('water_climate/crop_water.json')['rotations'],
        'market': {key: market[key] for key in ['periodStart', 'periodEnd', 'sources', 'monthlySeasonality', 'methodology', 'limitations']},
        'pestRule': {
            'source': 'Oviedo, F. IDIAF, Compendio de habichuela, 2013, pp. 88, 94, 102',
            'url': 'https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf',
            'checkedAt': '2026-11-14',
            'rule': 'Habichuela seguida de maíz: rotación con no hospedero citada para antracnosis, bacteriosis común e insectos de habichuela. No generalizar a todas las plagas ni a leguminosas sin identificar.',
        },
    }
    target = ROOT / 'web/public/data/farmer-pillars.json'
    target.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n')
    manifest_path = ROOT / 'web/public/data/manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if target.name not in manifest['files']:
        manifest['files'].append(target.name)
    print(list(manifest))
    manifest.setdefault('sha256', {})[target.name] = hashlib.sha256(target.read_bytes()).hexdigest()
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    build()
