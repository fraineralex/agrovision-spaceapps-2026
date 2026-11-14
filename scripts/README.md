<!-- AI: Codex/OpenAI, 2026-11-14; revisión de Frainer pendiente. -->
# Pipeline reproducible sin red

Desde la raíz:

```bash
python3 scripts/build_web_data.py
```

Solo biblioteca estándar de Python. Lee el CSV POWER, la muestra Landsat, los tiles GIBS y la transcripción FAO en `data/cache/`; exporta a `web/public/data/` y genera manifest con SHA-256. No lee archivos externos al repositorio, no usa API y no requiere base de datos. Dos ejecuciones con la misma entrada producen bytes idénticos. `demo-parcels.geojson` y `rotation-scenarios.json` son entradas editoriales versionadas; el script genera además copia `.json` de los polígonos para Next.js/Turbopack.

POWER: agrupa por mes calendario los días de 2016–2025; excluye valores faltantes −999 al promediar T2M/PRECTOTCORR/RH2M. Landsat: escala reflectancias con 0.0000275 y −0.2, aplica QA_PIXEL/QA_RADSAT, calcula NDVI y conserva nulos. Umbrales exploratorios sin entrenamiento; ver `docs/METHODOLOGY.md`. La muestra original tiene 18 respuestas: tres centros de áreas demo × seis escenas seleccionadas de 2024.

Para refrescar fuentes explícitamente, con internet y `pip install -r scripts/requirements.txt`:

```bash
python3 scripts/fetch_gibs_sample.py
python3 scripts/fetch_landsat_sample.py
python3 scripts/fetch_power.py --lat 18.8 --lon -71.23 --start 2016-01-01 --end 2025-12-31
python3 scripts/build_web_data.py
```

GIBS conserva los endpoints comprobados en capabilities: NDVI PNG nivel 9, IMERG PNG nivel 6, Blue Marble JPEG nivel 8 (incluye tile regional a zoom 5). `fetch_landsat_sample.py` selecciona la escena menos nublada disponible en cada bloque de dos meses de 2024 usando STAC, luego consulta bandas en centros sintéticos. No garantiza que cada píxel esté despejado; la máscara decide. Las descargas refrescadas pueden cambiar si cambia la fuente; revisar diff y procedencia antes de integrar.

La verificación independiente POWER de tres días se conserva en `data/cache/power_verification_sample.json`; el CSV preexistente no se modificó. No se pudo obtener una serie MODIS numérica desde ORNL por timeout; se usó una muestra Landsat real, sin rellenar observaciones.
