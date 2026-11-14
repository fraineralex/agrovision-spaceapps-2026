#!/usr/bin/env python3
"""AI: Codex/OpenAI, 2026-11-14; Frainer review pending.
Cache POWER climatology for 32 province display points and national initial point.
Input points are exported by the same location module used by the UI:
cd web && npx tsx -e 'import {provinces} from "./lib/geography"; console.log(JSON.stringify(provinces))' > /tmp/province-points.json
python3 scripts/geography/cache_power.py /tmp/province-points.json
"""
import concurrent.futures
import json
from pathlib import Path
import sys
import urllib.parse
import urllib.request
ROOT = Path(__file__).resolve().parents[2]
POINTS = json.loads(Path(sys.argv[1]).read_text()) + [{"name":"Vista nacional inicial","longitude":-70.2,"latitude":18.8}]
NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
def download(point):
    lon,lat = f'{point["longitude"]:.3f}',f'{point["latitude"]:.3f}'
    key=f'{lon},{lat}'
    url='https://power.larc.nasa.gov/api/temporal/climatology/point?'+urllib.parse.urlencode(dict(parameters='T2M,PRECTOTCORR,RH2M',community='AG',longitude=lon,latitude=lat,start='2016',end='2025',format='JSON'))
    dest=ROOT/'web/public/data/power'/f'{key}.json'
    if dest.exists(): return f'Cached: {point["name"]}'
    try:
        data=json.load(urllib.request.urlopen(url,timeout=30))
        raw=ROOT/'data/cache/power'/f'{key}.json';raw.parent.mkdir(parents=True,exist_ok=True);raw.write_text(json.dumps(data,ensure_ascii=False))
        p=data['properties']['parameter']
        def value(k,m):
            n=p.get(k,{}).get(m)
            return n if isinstance(n,(int,float)) and n != -999 else None
        monthly=[dict(month=i+1,temperatureC=value('T2M',m),precipitationMmDay=value('PRECTOTCORR',m),relativeHumidityPct=value('RH2M',m)) for i,m in enumerate(NAMES)]
        if all(m['temperatureC'] is None for m in monthly): raise ValueError('No temperature data')
        context=dict(monthly=monthly,location=dict(longitude=point['longitude'],latitude=point['latitude']),source=dict(name='NASA POWER / MERRA-2',url=url,period='2016–2025',scale='Regional · grilla aproximada de 0.5° × 0.625°',quality='Sin validación local; lluvia tropical limitada y excluida del score',method='Reanálisis · media mensual histórica, no pronóstico'),retrievedAt='2026-11-14',province=point['name'])
        dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(context,ensure_ascii=False,indent=2))
        return f'OK: {point["name"]}'
    except Exception as e: return f'FAILED: {point["name"]}: {e}'
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for result in pool.map(download,POINTS): print(result,flush=True)
