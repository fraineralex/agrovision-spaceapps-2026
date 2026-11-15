# Uso de inteligencia artificial — AgroVision

La organización del reto permite el uso de herramientas de inteligencia artificial únicamente si se documenta de manera transparente. Este documento registra cada asistencia material de IA en el repositorio: fecha, herramienta, propósito, archivos afectados, límites técnicos y estado de revisión por el equipo AgroVision.

## Política de registro, atribución y revisión

- Todo cambio asistido por IA debe registrar fecha, herramienta, propósito, archivos modificados y estado de revisión del equipo.
- La IA no reemplaza la validación agronómica ni la revisión humana de fuentes primarias.
- Los archivos que no admiten comentarios internos (`.json`, `.geojson`, `.png`, lockfiles y configuraciones) quedan atribuidos en este documento y en `docs/DATA_SOURCES.md`.
- Las imágenes satelitales (NASA GIBS, Esri, Sentinel-2) y los conjuntos de datos oficiales (NASA POWER, FAO GIEWS, FAO-56, IDIAF, Ministerio de Agricultura, INDOMET, GeoNames, BCRD) corresponden a datos reales de terceros; la IA asistió el código, los scripts y la documentación sin generar valores observados.
- Las fuentes de terceros conservan sus respectivas licencias, atribución original y formato sin alteración de cifras.
- Ninguna salida se declara validada agronómicamente en finca sin verificación presencial y técnica por el equipo AgroVision.
- La presentación o video final debe incluir una lámina dedicada que explique para qué se usó la IA y cómo se revisaron sus salidas.

## Resumen de herramientas y modelos empleados

| Herramienta / Modelo | Rol principal en el repositorio | Revisión |
|---|---|---|
| Codex (OpenAI) | Arranque del proyecto, pipelines de datos, ML/Sentinel-2, voz y arquitectura offline | En curso por el equipo |
| Claude (Anthropic) | Asesor agronómico integral, lenguaje claro de productor, suelo y plagas | En curso por el equipo |
| Antigravity (Gemini / Claude) + Impeccable | Navegación por pestañas, diseño visual, accesibilidad y composición compacta | En curso por el equipo |
| Cursor agent (`composer-2.5`) | Pilares agua/clima y prototipo de búsqueda vectorial RAG con Turso | En curso por el equipo |
| Grok (xAI) | Capas iniciales de mapa satelital y visualización territorial | Revisado por el equipo |
| OpenAI GPT-6 / ImageGen | Optimización de carga diferida, temas claro/oscuro y mejora de fotografía CC0 | En curso por el equipo |
| Vercel AI Gateway / AI SDK y `llama.cpp` | Proveedores configurables para voz, chat y embeddings con respaldo determinista | Pendiente de revisión |

---

## 2026-11-10 a 2026-11-14 — Investigación, datos, modelos y MVP

### Investigación, reglas de equipo y entregables de envío

| Fecha | Herramienta | Propósito | Archivos afectados | Revisión |
|---|---|---|---|---|
| 10-11-2026 | Codex (OpenAI) | Investigación de contexto agrícola de República Dominicana (Cibao y Sur) | `/workspace/agrovision/investigacion_cibao_sur.md` | Revisado por el equipo |
| 14-11-2026 | Codex (OpenAI) | Arranque del repositorio de contexto y documentación inicial | `README.md`, `AI_USAGE.md` | Revisado por el equipo |
| 14-11-2026 | Claude (Anthropic) | Síntesis del intercambio técnico inicial del equipo | `/workspace/agrovision/claude_chat.txt` | Revisado por el equipo |
| 14-11-2026 | Codex (OpenAI) | Reglas de idioma para UI/commits y plan técnico ejecutable de AgroVision | `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/agrovision.mdc`, `docs/10_plan_tecnico.md` | Revisado por el equipo |
| 14-11-2026 | Codex (OpenAI) | Verificación de reglas oficiales de envío, límites pendientes y criterios de evaluación | `docs/00_reglas_envio_y_evaluacion.md`, `docs/02_recursos_datos.md`, `docs/04_producto_mvp.md`, `docs/08_premios.md` | Revisado por el equipo |
| 14-11-2026 | Codex (OpenAI) | Redacción en inglés del resumen del proyecto, guion de 29 s y esquema de 7 diapositivas | `docs/submission/{README,project_summary,video_script,slides_outline}.md` | Pendiente de revisión |
| 14-11-2026 | Codex (OpenAI) | Inventario de datos usados, divulgación pública de IA y alineación con premios | `docs/submission/{nasa_data_used,ai_disclosure,award_alignment}.md` | Pendiente de revisión |

### Pipelines de datos, clima, mercado y segmentación satelital

| Fecha | Herramienta | Propósito | Archivos afectados | Revisión |
|---|---|---|---|---|
| 14-11-2026 | Cursor agent | Cálculo de pilares de agua/suelo y clima con NASA POWER, FAO-56 y contraste IMERG/SMAP | `scripts/water_climate/`, `data/derived/water_climate/`, `docs/11_water_climate_method.md` | Revisado por el equipo |
| 14-11-2026 | Codex (OpenAI), Python determinista | Descarga oficial de precios mayoristas MA 2017–2026 (4,037 filas, 926 medias mensuales, estacionalidad) | `scripts/market/{build_prices,test_prices}.py`, `data/cache/market/`, `data/derived/market_prices.json`, `.gitattributes` | Pendiente de revisión |
| 14-11-2026 | Codex (OpenAI) | Exportación de precios e insights de mercado para la aplicación web | `scripts/market/build_market_insights.py`, `web/public/data/market-insights.json` | Pendiente de revisión |
| 14-11-2026 | Codex (OpenAI) | Descarga y verificación de muestras reales POWER, GIBS, Landsat y tablas FAO-56 | `scripts/build_web_data.py`, `scripts/README.md`, `data/cache/{fao56-crops.json,gibs/,landsat_point_sample.json,power_verification_sample.json}`, `docs/DATA_SOURCES.md` | Pendiente de revisión |
| 14-11-2026 | Codex (OpenAI) | Delimitación experimental de parcelas con MobileSAM (`vit_t` CPU) y filtro WorldCover 2021 v200 | `scripts/fields/`, `data/cache/fields/`, `data/derived/fields*`, `web/public/data/fields*`, `docs/12_field_boundaries_method.md` | Pendiente de revisión |
| 14-11-2026 | Codex (OpenAI) | Ingesta de 70 escenas Sentinel-2 (35 meses NDVI sin imputación) y segmentación SLIC (585 unidades en San Juan) | `scripts/ml/{features,common,download}.py`, `data/cache/ml/{selection,acquisition}.json`, `data/cache/ml/monthly.npz` | Pendiente de revisión |
| 14-11-2026 | Codex (OpenAI) | Clasificador RandomForest por bloques de 1 km, exportación offline y validador de artefactos | `scripts/ml/{train,run,test_pipeline,validate}.py`, `scripts/ml/README.md`, `data/derived/parcels_san_juan.*`, `data/model/` | Pendiente de revisión |
| 14-11-2026 | Codex (OpenAI) | Cobertura nacional NASA POWER (33 contextos), límites DOM ADM1 y catálogo GeoNames RD (CC BY) | `scripts/geography/{cache_power.py,export_parcels.py,export_places.ps1}`, `data/cache/geography/`, `web/public/data/{provinces,places-do,parcels-san-juan}.json` | Pendiente de revisión |
| 14-11-2026 | Codex (OpenAI) | Integración provincial FAO GIEWS / ASIS DOM y lluvia ECMWF redistribuida para 32 provincias | `scripts/fao/`, `data/cache/fao_giews/`, `data/derived/fao_giews/`, `web/public/data/fao-giews.json`, `docs/14_fao_giews.md` | Pendiente de revisión |

### Implementación del MVP web, mapas y módulos iniciales (2026-11-14)

#### Base offline, comparador y mapas satelitales

- **Arquitectura base web (`Codex / OpenAI`, `AI SDK + Vercel AI Gateway` con `openai/gpt-4.1-mini`):**
  - Arranque de Next.js, TypeScript, worker MapLibre y Service Worker con manifiesto SHA-256 para funcionamiento offline.
  - Endpoints iniciales de clima y explicación verificada con respaldo determinista cuando no hay clave de Gateway.
  - *Archivos:* `web/app/`, `web/lib/{data,scoring,explanation,geography,location-climate}.ts`, `web/scripts/offline-assets.mjs`, `docs/05_arquitectura.md`, `docs/METHODOLOGY.md`.

- **Pilares derivados y regla IDIAF (`Codex / OpenAI`):**
  - Exportación sin red de escenarios exactos de agua y clima.
  - Integración de la regla verificada IDIAF (habichuela → maíz) y caché POWER fuera de San Juan.
  - *Archivos:* `scripts/export_pillar_data.py`, `web/public/data/{farmer-pillars,manifest}.json`, `web/lib/farmer-comparison{,.test}.ts`, `docs/12_farmer_pillars.md`.

- **Mapa nacional y unidades satelitales (`Grok / xAI`, `Codex / OpenAI`):**
  - Fondo satelital Esri World Imagery (zoom 19), capas superpuestas NASA GIBS debajo del zoom 10 y control de opacidad.
  - Selección de 585 unidades `sj-unit-*` en San Juan con ficha en español.
  - Semáforo de verdor y serie histórica NDVI de 35 meses.
  - *Archivos:* `web/components/{map.tsx,map/}`, `web/lib/map/{fields,parcels}.ts`, `web/tests/ux.spec.ts`.

#### Asesor de siembra, mercado, fincas, lluvia y plagas

- **Asesor integral y 13 cultivos (`Claude / Anthropic`):**
  - Integración de tarjetas de productor, fuentes de mercado y FAO GIEWS.
  - Evaluación de 13 cultivos según riego, sequía, plagas y precio histórico.
  - Panel explicativo `¿De dónde sale esto?` (`SourcesSheet`) con cifras usadas, fechas y enlaces a FAO-56, FAO GIEWS, IDIAF y Ministerio de Agricultura.
  - *Archivos:* `web/lib/{advisor,advisor.test}.ts`, `web/components/{advisor-card,market-card,sources-sheet,fao-giews,onboarding}.tsx`, `docs/{16_asesor_siembra,casos_mercado}.md`.

- **Fincas en el mapa y turnos de riego (`Claude / Anthropic`, `Codex / OpenAI`):**
  - Trazado de parcelas por cuadros de 50 × 50 m o polígono (`FarmPicker`) y selector múltiple de fincas (`FarmSwitcher`).
  - Registro de fecha de riego elegida o asignada (`FarmWorkbench`).
  - Búsqueda de lugares y parajes en RD más allá de las provincias usando GeoNames (`places-do.json`).
  - *Archivos:* `web/lib/{farms,place-search}.ts`, `web/components/{farm-picker,farm-switcher,farm-workbench,onboarding}.tsx`.

- **Lluvia, rentabilidad y sobreoferta (`Claude / Anthropic`, `Codex / OpenAI`):**
  - Pronóstico regional de 7 días (Open-Meteo NOAA GFS/GEFS) con respaldo histórico de NASA POWER en `RainCard`.
  - Calculadora de punto de equilibrio y márgenes de referencia ajustados por IPC del BCRD (enero 2026: 137,74; base oct. 2019–sep. 2020 = 100).
  - *Archivos:* `web/lib/{rain,profit}.ts`, `web/app/api/rain/route.ts`, `web/components/{rain-card,profit-card,share-button}.tsx`.

- **Plagas compartidas y precauciones (`Codex / OpenAI`):**
  - Catálogo de plagas principales por cultivo con penalización prototipo por hospederos compartidos y medidas de vigilancia en la recomendación.
  - *Archivos:* `web/lib/pests.ts`, `web/components/pest-catalog.tsx`, `docs/16_asesor_siembra.md`.

- **Modos Agricultor y Supervisor (`Codex / OpenAI`):**
  - Separación de vistas de uso cotidiano y análisis técnico sobre las mismas fincas.
  - Exportación GeoJSON de contornos aproximados de parcelas.
  - *Archivos:* `web/app/page.tsx`, `web/components/map.tsx`, `web/tests/demo.spec.ts`.

#### Arquitectura de pestañas y voz en tiempo real

- **Pestañas y flujos visivos (`Antigravity / Gemini`, `Claude / Anthropic`):**
  - Reorganización de la interfaz en 5 pestañas (`Siembra`, `Lluvia`, `Venta`, `Fincas`, `Ayuda`).
  - Flujo de onboarding en 3 pasos, íconos Lucide y ayudas `¿Para qué sirve?` (`HelpTip`).
  - Tarjeta de 5 estrategias (`fiveOptions`), barra de distribución de cultivos, onda diaria de lluvia y gráfica estacional de 24 meses en mercado.
  - *Archivos:* `web/app/{layout,page}.tsx`, `web/app/globals.css`, `web/components/{options-card,fold,help-tip,farm-icon}.tsx`, `docs/{17_ui_audit,18_auditoria_valor_agricultor}.md`.

- **Asistente de voz y orbe flotante (`Codex / OpenAI`):**
  - Sesión en tiempo real vía Vercel AI Gateway (`openai/gpt-realtime-mini`).
  - Estados de micrófono, subtítulos y orbe flotante persistente entre pestañas.
  - *Archivos:* `web/app/api/voice/`, `web/components/{voice-assistant.tsx,voice-session.module.css}`, `web/lib/{voice-context,voice-server}.ts`, `web/tests/demo.spec.ts`.

---

## 2026-11-15 — Voz/RAG, agronomía clara, sistema visual y pulido final

### Voz, RAG offline/Turso y guías técnicas CEDAF

| Fecha | Herramienta | Propósito | Archivos afectados | Revisión |
|---|---|---|---|---|
| 15-11-2026 | Codex (OpenAI) | Controles de reproducción en español (`Coral`), dictado del navegador como respaldo (HTTP 503 / sin clave) y ruta `/api/voice/setup` | `web/app/api/voice/{setup,summary}/route.ts`, `web/lib/{summary-audio,use-read-aloud}.ts`, `web/components/{voice-assistant,advisor-card}.tsx` | Pendiente de revisión |
| 15-11-2026 | Codex (OpenAI) | Conexión opcional local con `Qwen3-1.7B` (`llama.cpp`), validación de origen local y respaldo directo de meses de siembra | `web/lib/{local-voice-model,voice-server,voice-context}.ts`, `web/app/api/voice/chat/route.ts`, `web/tests/demo.spec.ts` | Pendiente de revisión |
| 15-11-2026 | Cursor agent (`composer-2.5`), Vercel AI Gateway (`claude-haiku-5.5`, `gemini-embedding-2`) | Herramienta `search_guides`, índice RAG local JSON y migración idempotente a base vectorial Turso con respaldo local | `web/lib/{rag,rag-turso,rag-corpus}.ts`, `web/lib/rag-turso.test.ts`, `web/scripts/{build-rag-index,upload-rag-index}.ts`, `web/data/rag-index.json`, `docs/rag_eval.md` | Pendiente de revisión |
| 15-11-2026 | Codex (OpenAI) | Extractos atribuidos de guías técnicas CEDAF (arroz, guandul, habichuela, plátano, yuca) y retiro de RAG experimental en el chat en vivo | `data/rag-corpus/cedaf-*.md`, `web/lib/rag-corpus.ts`, `web/app/api/voice/{chat,tools}/route.ts`, `docs/rag_eval.md` | Pendiente de revisión |

### Lenguaje claro, rotación de suelo, plagas y rendimiento

- **Lenguaje de campo y estrellas (`Claude / Anthropic`):**
  - Sustitución de decimales en vista de productor por estrellas (1 a 5) e indicadores en español cotidiano (`Pide poca agua`, `Sin sequía`, `Menos plagas`, `Precio normal`).
  - Traducción de sequía FAO a texto llano (`Menos de 1% del área con sequía`), botón `¿Por qué este cultivo?` y retiro de campos no determinantes (maquinaria y pesticidas).
  - *Archivos:* `web/lib/{advisor,fao-giews,farms}.ts`, `web/components/{advisor-card,options-card,sources-sheet,field-ui,fao-giews,farm-workbench,farm-switcher,onboarding}.tsx`.

- **Rotación y suelo (`Claude / Anthropic`):**
  - Nueva sección `Rotación y suelo` con reglas generales FAO (nutrientes, fijación de nitrógeno en leguminosas, materia orgánica).
  - Incorporación de textura de tierra (`arenosa`, `mezclada`, `barro`) y color del suelo (SSSA, Lynn y Pearson 2000).
  - *Archivos:* `web/lib/{soil,soil.test,farms,advisor}.ts`, `web/components/{soil-card,sources-sheet,onboarding,fold}.tsx`, `docs/19_requisitos_reto.md`.

- **Catálogo de plagas a vigilar (`Claude / Anthropic`, `Codex / OpenAI`):**
  - Tarjetas y detalles de `Plagas a vigilar` por cultivo con especies científicas, tipo deducido del nombre común, alertas de nematodos y plagas compartidas con el cultivo anterior.
  - Enlaces directos a fuentes oficiales (IDIAF y Ministerio de Agricultura).
  - *Archivos:* `web/lib/pests.ts`, `web/components/{pest-card,pest-overview}.tsx`.

- **Optimización de rendimiento (`OpenAI GPT-6`, `Codex`):**
  - Carga diferida de geometrías de mapa hasta abrir `Fincas` y montaje bajo demanda de `VoiceDock` (`Ayuda`).
  - Separación de helpers de navegador frente al esquema geográfico para reducir el bundle inicial.
  - *Archivos:* `web/lib/{geography,geography-core,place-search}.ts`, `web/lib/map/parcels.ts`, `web/components/{voice-dock,supervisor-rotations,map,onboarding}.tsx`.

### Sistema visual, accesibilidad y pulido de interfaz (`2026-11-15`)

- **Sistema de diseño, temas y selects (`OpenAI GPT-6`, `Codex`, `Antigravity / Gemini` + `Impeccable`):**
  - Tipografía unificada (`IBM Plex Sans` + `Bricolage Grotesque`).
  - `Modo sol` anti-reflejo con paleta blanca/verde bosque, restauración de paleta oscura (`theme-dark.css`) y contraste WCAG AA+.
  - Componente `CustomSelect` unificado para todos los desplegables de la aplicación.
  - Mejora asistida de fotografía CC0 de El Cercado (`OpenAI ImageGen`).
  - Documentación maestra del sistema visual en `DESIGN.md`, `PRODUCT.md`, `.impeccable/design.json` y `.impeccable/surfaces/{application,siembra}.md`, con propietarios de estilo en `web/app/planting.css` y `web/app/workspace.css`.
  - *Archivos:* `DESIGN.md`, `PRODUCT.md`, `.impeccable/`, `web/app/{layout,page,fuentes/page}.tsx`, `web/app/{globals,planting,workspace,theme-dark}.css`, `web/components/{custom-select,theme-toggle,planting-ui,ui/section-panel,ui/button,ui/card}.tsx`, `web/public/images/san-juan-valley-enhanced.png`.

- **Composición compacta por secciones (`Antigravity / Claude & Gemini` + `Impeccable`):**
  - Eliminación de espacios en blanco excesivos y filas estiradas en todas las pestañas (`Siembra`, `Lluvia`, `Venta`, `Fincas`, `Ayuda`) en escritorio, tablet y móvil.
  - `Todos los cultivos` y `Plagas a vigilar` en cuadrículas de tarjetas compactas adaptadas por cantidad (`2×2` o `3+2`).
  - `Otras opciones` en una sola fila de 3 columnas con `Tu plan de siembra` integrado en la parte superior.
  - `Rotación y suelo` en diseño dividido (diagnósticos a la izquierda y matriz de 2 columnas a la derecha).
  - Reubicación de `Qué revisar antes de sembrar` justo debajo del producto recomendado en `AdvisorCard`.
  - Agrupación de cuadros marcados en `FarmPicker` dentro de pastillas compactas.
  - Restauración de la onda SVG de 7 días con puntos circulares, gotas animadas en `RainCard` y limpieza del aviso `.turn-summary`.
  - *Archivos:* `web/app/{page.tsx,globals.css,planting.css,workspace.css}`, `web/components/{advisor-card,options-card,soil-card,pest-card,pest-overview,farm-picker,rain-card,farm-workbench,market-card,fao-giews,fao-giews.module.css}.tsx`.

- **Delimitación Agricultor vs. Supervisor y voz (`Antigravity / Claude` + `Codex`):**
  - **Modo Agricultor:** lenguaje sencillo, indicadores cualitativos y detalles técnicos o citas plegadas.
  - **Modo Supervisor:** barra técnica superior, puntajes `0–5`, ciclo FAO-56 en días y `Kc·d` y reglas FAO abiertas.
  - **Supervisor técnico adicional:** taxonomía de plagas, chip de modelo climático NOAA/NASA, referencia MA 2019, `ProfitCard`, exportación GeoJSON y serie NDVI.
  - **Voz:** panel de escritura expandido restringido a la pestaña `Ayuda`, manteniendo el botón flotante y el cajón lateral entre pestañas.

---

## Notas sobre modelos externos, límites y verificación

### Proveedores externos configurables

- Vercel AI Gateway / AI SDK: `openai/gpt-4.1-mini`, `openai/gpt-realtime-mini`, `anthropic/claude-haiku-5.5` y `google/gemini-embedding-2`.
- Modelo local opcional: `Qwen3-1.7B` vía `llama.cpp`.
- Todos los proveedores de chat/voz dependen de credenciales activas en servidor o entorno local, operando con respaldo determinista cuando no están disponibles.

### Límites científicos vigentes

- Los puntajes (0–5), reglas de rotación por familia, umbrales de lluvia, sobreoferta y márgenes son heurísticas del prototipo sin calibración de rendimiento en campo.
- El sistema no predice cosechas ni presencia real de plagas en finca.
- Ninguna recomendación sustituye análisis de suelo ni asistencia presencial (IDIAF / Ministerio de Agricultura).

### Verificación técnica registrada

- Comprobación estática: `tsc --noEmit` y `eslint .` sin errores.
- Pruebas automatizadas: suite unitaria (`48/48` pruebas en TypeScript).
- Validación visual e interactiva en navegador: detector de desbordamiento y recorridos completos sobre temas claro/oscuro en escritorio, tablet y móvil.
- Pendiente: validación agronómica en campo y revisión final completa por el equipo AgroVision.
