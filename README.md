<!-- AI assistance: Codex/OpenAI, 2026-11-14. Frainer review pending for MVP continuation; see AI_USAGE.md. -->
# AgroVision

An offline-capable rotation explorer for the **San Juan Valley, Dominican Republic**, built for NASA Space Apps 2026, [Field Shift](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/). Compare a rice–bean baseline with two illustrative alternatives across water/soil, climate, pests and market. This is evidence for discussion with a local agricultural technician, not a prescription.

## Run

Node.js 20.9+ and npm; Python 3 for rebuilding data. The web application needs no Python server or database.

```bash
python3 scripts/build_web_data.py
cd web
npm ci
npm run build
npm start
```

Open `http://localhost:3000`. Development: `npm run dev`. Checks: `npm run lint`, `npm test`, `npm run test:e2e` (requires Google Chrome, or adapt the Playwright channel). Pipeline checks, from the repository root: `python3 scripts/test_pipeline.py`.

The app retains the previous agent's `web/` implementation and uses Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui button composition, MapLibre GL JS, Zod and Vercel AI SDK. `backend/` and `frontend/` are legacy scaffolding and are not required by this demo. No Turso or other database is necessary.

## What works

- Select three **synthetic approximate demo areas**, through the map or dropdown. No producer identities or real farm boundaries are included.
- Inspect real NASA POWER regional climate means for any calendar month, using the checked-in 2016–2025 daily cache. Regional grid ~0.5°/~50 km, not parcel measurements; tropical rainfall has limitations and is excluded from scores.
- Inspect **real Landsat NDVI** from six selected 2024 dates at each demo center (one 30 m pixel). QA-masked dates stay missing. Exploratory vegetation signals are explicitly uncalibrated; no trained classifier, crop identity or irrigation status is claimed.
- Compare rice → beans, maize → beans and sweet potato → beans. The partial water/soil score uses a transparent FAO-56 coefficient-day proxy, relative 0–5 within this demo, with low local confidence. It is **not irrigation demand, soil health or measured savings**. Open each card for formula, source, publication period, scale and limitations.
- Water priority changes scenario ordering; other priorities explain the lack of evidence and retain the baseline first. Declared water access changes review guidance; it never fabricates satellite confirmation.
- View cached NASA GIBS Blue Marble, MODIS NDVI and IMERG imagery offline. Optional online date controls request verified WMTS products/formats/zoom levels; cached imagery remains underneath when remote requests fail. Images are browse context, not numeric measurements extracted from colors.
- Request an optional explanation through AI SDK / Vercel AI Gateway. A deterministic local explanation works without a key, gateway or network.

## Offline behavior

All inputs and derived artifacts are versioned in `data/cache/` and `web/public/data/`. Rebuild without internet using `python3 scripts/build_web_data.py`; exact hashes are recorded in the data manifest. Download scripts are separate, explicit operations: see [scripts/README.md](scripts/README.md).

A local production server serves the core case without internet. On a hosted URL, visit once online and wait for **“Offline case saved”** before disconnecting. The service worker caches the HTML, all production JS/CSS chunks and case files, including the dynamic map module. Offline reload and comparison are covered by browser tests. A never-visited URL still requires a first network connection. The online GIBS timeline and optional Gateway generation require internet; local imagery, comparisons and explanation remain usable.

## Optional AI explanation

Set `AI_GATEWAY_API_KEY` in the **server environment**, or in ignored `web/.env.local` using `web/.env.example`. Never use a `NEXT_PUBLIC_` variable for it. The endpoint receives only priority, month and declared irrigation category; it rebuilds trusted metrics on the server. It sends no geometry, private user data or credentials to the model.

Model: `openai/gpt-4.1-mini` through Vercel AI Gateway. Structured Zod output selects IDs of prewritten evidence statements, preventing new numbers or claims. Limits and local review statements are always included. AI-assisted output is labeled; timeout, missing key and service failures use the deterministic template. The live configured-key path and missing-key path were both exercised locally on 2026-11-14. [AI_USAGE.md](AI_USAGE.md) records assistance and pending human review.

## Vercel configuration — no deployment performed

Import the repository as a Vercel project with **Root Directory `web`** and framework **Next.js**. `web/vercel.json` pins framework detection, `npm ci` and `npm run build`; keep the default Next.js output directory. All runtime data are under `web/public/data/`; the build never accesses paths outside `web/` or any machine-specific location. The offline asset generator uses only relative paths inside `web/`. Python export is performed before committing data, not during the Vercel build. Configure the optional server key in Project Environment Variables. No deploy command was run for this task.

## Evidence and remaining work

- POWER daily cache is real; a three-day independent API comparison matches the original CSV, with the response preserved in cache.
- Landsat source pixel values, QA bands and request URLs are preserved. The six-date sample does not establish monthly bare-field duration. **Validated bare-soil / irrigation ML classification remains pending labeled samples and field/visual review.** The current signal thresholds are exploratory rules, not a trained AI model.
- In the web demo, climate suitability, pest and market scores remain **null / “Insufficient data”**. Crop tolerances/windows and verified IDIAF pest relations are still missing. No scores are invented inside `web/`. Santo Domingo wholesale prices must not be described as farmgate prices.
- Numeric IMERG millimeters and SMAP soil moisture were not retrieved. Local soil and agronomic calibration remain pending. The web FAO proxy alone does not establish rainfed suitability or actual irrigation requirements.
- Rice–bean rotation context comes from the team's IDIAF inventory citation; local fit is unverified. The other sequences are illustrative. No yield, pest outbreak, guaranteed profit, universal optimal dates or validated farm outcomes are claimed.
- Frainer's human review, agronomic validation, deployment, submission and video are pending. Deployment was explicitly excluded from this task.

Sources, attribution and quality: [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md). Formulas, masks, assumptions and confidence: [docs/METHODOLOGY.md](docs/METHODOLOGY.md). Data version/checksums: [web/public/data/manifest.json](web/public/data/manifest.json). USGS/NASA Landsat, NASA POWER and NASA EOSDIS GIBS provide the actual Earth observation context; FAO-56 provides generic rule inputs. Dependencies retain their respective licenses; shadcn/ui patterns are MIT.

## Team direction and submission

Read [AGENTS.md](AGENTS.md) and the ordered context documents. Official direction: [team summary](docs/fuentes_equipo/resumen_equipo.txt) and [data inventory](docs/fuentes_equipo/inventario_datos.txt). Implementation plan: [docs/10_plan_tecnico.md](docs/10_plan_tecnico.md). Central planned AI analyzes satellite data; the optional explanation is secondary. Sensors are future work.

Offline products merged beside the web demo, and not yet consumed by `web/`:

- Water and climate method: [docs/11_water_climate_method.md](docs/11_water_climate_method.md)
- Submission drafts: [docs/submission/](docs/submission/)
- Parcel classifier: [scripts/ml/README.md](scripts/ml/README.md)
- Derived files and their limits: [docs/02_recursos_datos.md](docs/02_recursos_datos.md)

Submission target: Sunday, November 15, 2026, 11:59 PM AST for Santo Domingo; confirm the active portal time and requirements before submission. Unverified 2026 limits are listed in [docs/00_reglas_envio_y_evaluacion.md](docs/00_reglas_envio_y_evaluacion.md). No submission was performed by this task.

## Interfaz nacional en español y voz (14-11-2026)

La aplicación inicia sobre toda República Dominicana. Busca una provincia o toca un punto terrestre: NASA POWER consulta esa ubicación (contexto de grilla, no promedio provincial ni medición de finca). San Juan mantiene muestras Landsat y áreas sintéticas como caso más rico. Las rotaciones usan el mismo indicador genérico FAO-56 para explorar opciones; no prueban aptitud de ningún lugar. Los pilares sin evidencia integrada muestran «Sin datos».

En `web/`: `npm ci`, `cp .env.example .env.local`, `npm run dev`. Para comprobar producción: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`. No se ejecuta despliegue en esta ampliación.

```dotenv
# web/.env.local — único secreto; nunca NEXT_PUBLIC_...
AI_GATEWAY_API_KEY=
```

Con clave y cuenta Gateway habilitada, el botón **Hablar** abre audio bidireccional nativo con `openai/gpt-realtime-mini` mediante AI SDK 7 experimental. El servidor emite un token efímero (60 segundos para conectar); la clave no sale del servidor. Hay transcripción visible, VAD del navegador y del servidor, interrupción y herramientas de lectura `get_parcel_metrics` / `compare_rotations`. Las respuestas son en español y se limitan al JSON de métricas y rotaciones con sus fuentes. El audio es generado por IA; no se promete latencia medida ni predicción agrícola.

Si realtime no está disponible, puedes escribir: con clave se usa `streamText` (`openai/gpt-4.1-mini`) por Gateway y lectura por frases con voz del navegador. **Sin clave tampoco es posible generar texto vía Gateway**: se muestra un resumen local determinista y se ofrece `speechSynthesis` si el navegador lo admite. No hay reconocimiento de voz garantizado en ese modo. La voz del navegador depende de las voces españolas instaladas. Se requiere HTTPS o localhost y permiso de micrófono para conversar; al terminar o cambiar selección se cierran micrófono y sesión. La aplicación no persiste grabaciones; revisar políticas del proveedor para su tratamiento.

Las rutas de voz validan origen, tamaño, selecciones y herramientas. El límite por instancia no sustituye un control global de gasto: configurar presupuesto en AI Gateway antes de compartir una instalación con clave. Los tokens son credenciales efímeras ligadas al modelo; las instrucciones de sesión no son un aislamiento frente a clientes modificados.

Caché: `data/cache/power/` conserva respuestas NASA originales; `web/public/data/power/` incluye 32 puntos provinciales y vista inicial, disponibles offline después de cargar/guardar la app. Nuevos puntos necesitan red la primera vez; se guardan en el navegador. No se trasladan datos de San Juan a otra zona si falla la consulta. Los límites geoBoundaries son generalizados y no catastrales, por lo que la selección cerca de costa/frontera puede requerir un punto interior. Reproducir:

```bash
cd web
npx tsx -e 'import {provinces} from "./lib/geography"; console.log(JSON.stringify(provinces))' > /tmp/province-points.json
cd ..
python3 scripts/geography/cache_power.py /tmp/province-points.json
```

Fuentes consultadas 2026-11-14: [Gateway: realtime, speech y transcription](https://vercel.com/changelog/realtime-voice-speech-and-transcription-now-supported-on-ai-gateway), [guía realtime](https://vercel.com/blog/realtime-voice-agents-on-ai-gateway), [AI SDK Gateway](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway), [NASA POWER API](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/), [geoBoundaries DOM ADM1](https://www.geoboundaries.org/api/current/gbOpen/DOM/ADM1/) (Natural Earth, 2022, dominio público; procedencia en `data/cache/geography/provinces.metadata.json`). Asistencia Codex/OpenAI, revisión por Frainer pendiente; ver `AI_USAGE.md`.

### Mapa de detalle y parcelas aproximadas (integración 14-11-2026)

<!-- Asistencia: Codex/OpenAI, 2026-11-14; revisión por Frainer pendiente. -->

Esri World Imagery es la base en línea (zoom nativo máximo 19), con etiquetas Esri e inclinación. La búsqueda nacional y la voz siguen disponibles. NASA GIBS aporta superposiciones opcionales con opacidad; Blue Marble local es contexto de respaldo solo por debajo de zoom 10. Esri requiere conexión; no se promete fotografía detallada offline ni una fecha única de captura.

`web/public/data/parcels-san-juan.json` conserva las 585 unidades SLIC de `data/derived/parcels_san_juan.geojson`, con geometrías simplificadas y coordenadas a 5 decimales (<1.5 MB). Son unidades aproximadas de análisis Sentinel-2, no parcelas catastrales ni fincas verificadas. Se muestran desde zoom 11; el botón «Parcelas San Juan» acerca a la muestra y un clic abre la ficha y su serie NDVI. Semáforo de verdor reciente: <0.3 rojo, <0.5 ámbar, ≥0.5 verde; sin observación gris. Son cortes visuales sin validación agronómica. El clima mostrado para estas unidades es el contexto POWER regional de San Juan, no una observación de finca. La voz trata la ubicación como punto; no recibe las geometrías ni el clasificador.

Reconstrucción: con Shapely de `scripts/ml/requirements.txt`, ejecutar `python scripts/geography/export_parcels.py`; actualiza también el manifiesto offline y su SHA-256. Las fuentes, período, resolución y límites se conservan en el GeoJSON y la ficha. Se usa Sentinel-2 porque es la fuente efectiva del artefacto disponible; no se atribuye a Landsat. No se añadió Overpass.
