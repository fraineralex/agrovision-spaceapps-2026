# Uso de inteligencia artificial

## 2026-11-14 — Delimitación experimental de campos

- **Herramienta:** Codex (OpenAI); MobileSAM (`vit_t`) en evaluación CPU.
- **Propósito:** adquisición acotada Esri, segmentación de bordes visibles y exportación offline de candidatos de campo, sin identidad de productores ni validez catastral.
- **Archivos:** `scripts/fields/`, `data/cache/fields/`, `data/derived/fields*`, `web/public/data/fields*`, `docs/12_field_boundaries_method.md`, `AI_USAGE.md`. JSON y PNG se citan aquí y en metadatos porque no admiten comentarios de código.
- **Revisión por Frainer:** pendiente. Primer intento y resultados finales se registran en la metodología; no atribuir validación humana ni agronómica a esta ejecución.
- **Implementación:** MobileSAM `vit_t` CPU, commit `f706ad9c4eb7f219c00d9050e46328518ffb65d2`; ESA WorldCover 2021 v200 como filtro de cobertura. Código propio de adquisición, vectorización, filtrado, eliminación de duplicados, vista PNG y validador. No hay entrenamiento ni etiquetas locales; puntuación de máscara no calibrada.
- **Control de exportación:** se detectaron puntuaciones predicted-IoU >1 y desviaciones de simplificación mayores a la tolerancia nominal en el primer parcial. Se recorta predicted-IoU para el producto de confianza y se mide/reduce la simplificación por polígono; se conserva la puntuación original para auditoría.

La organización permite el uso de IA solo si se cita. Este registro es obligatorio para investigación, redacción, código, imágenes, análisis y contenido de presentación. Conservar la revisión humana y corregir cualquier salida inexacta.

## Registro

| Fecha | Herramienta | Para qué | Archivos afectados | Quién revisó |
|---|---|---|---|---|
| 14-11-2026 | Codex (OpenAI) | Análisis de recursos para el reto | `/workspace/spaceapps/analisis_recursos.md` | Frainer |
| 10-11-2026 | Codex (OpenAI) | Investigación de contexto agrícola de RD | `/workspace/agrovision/investigacion_cibao_sur.md` | Frainer |
| 14-11-2026 | Claude (Anthropic) | Resumen del chat compartido del equipo | `/workspace/agrovision/claude_chat.txt` | Frainer |
| 14-11-2026 | Codex (OpenAI) | Creación de este repositorio de contexto y arranque | Archivos del repositorio | Frainer |
| 14-11-2026 | Codex (OpenAI) | Investigación oficial de envío/evaluación y alineación de documentación con la dirección del equipo | `docs/00_reglas_envio_y_evaluacion.md`, `docs/02_recursos_datos.md`, `docs/04_producto_mvp.md`, `docs/05_arquitectura.md`, `docs/08_premios.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/agrovision.mdc`, `AI_USAGE.md` | Frainer |
| 14-11-2026 | Codex (OpenAI) | Reglas de idioma para UI/commits y plan técnico ejecutable de AgroVision | `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/agrovision.mdc`, `docs/10_plan_tecnico.md`, `AI_USAGE.md` | Frainer |
| 14-11-2026 | Codex (OpenAI) | Preparación y enlace del plan técnico ejecutable de AgroVision | `docs/10_plan_tecnico.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/agrovision.mdc`, `AI_USAGE.md` | Frainer |
| 14-11-2026 | Cursor agent | Pilares de agua/suelo y clima con POWER, FAO-56 y comprobación de IMERG/SMAP | `scripts/water_climate/`, `data/derived/water_climate/`, `docs/11_water_climate_method.md`, `AI_USAGE.md` | Frainer |

## Regla para contribuciones

### Asistencias de esta rama (revisión aún pendiente)

| Fecha | Herramienta | Para qué | Archivos afectados | Revisión por Frainer |
|---|---|---|---|---|
| 14-11-2026 | Codex (OpenAI) | Investigación de fuentes MA, descarga y diseño del pipeline de precios; limpieza, unidades, duplicados y estacionalidad auditable; pruebas de fallos de datos | `scripts/market/build_prices.py`, `scripts/market/test_prices.py`, `scripts/market/README.md`, `AI_USAGE.md` | Pendiente; no afirmar revisión completada |
| 14-11-2026 | Codex (OpenAI), Python (transformación determinista) | Descarga del CSV oficial MA 2017–2026 y exportación de 4,037 observaciones, 926 medias mensuales e índices estacionales de siete series con cobertura suficiente | `data/cache/market/wholesale_2017_2026.csv`, `data/cache/market/wholesale_2017_2026.metadata.json`, `data/derived/market_prices.json`, `AI_USAGE.md` | Pendiente; CSV original de terceros sin modificación ni cabecera IA; atribución y revisión en README del pipeline y metadatos del derivado |
| 14-11-2026 | Codex (OpenAI) | Verificación de aclaraciones del GO Team, campos de envío, zona horaria, divulgación de IA y límites aún sin verificar | `docs/submission/README.md`, `docs/00_reglas_envio_y_evaluacion.md`, `AI_USAGE.md` | Pendiente |
| 14-11-2026 | Codex (OpenAI) | Redacción en inglés de campos del formulario, guion por escenas con objetivo de 29 segundos y esquema de siete diapositivas; separación entre entregables comprobados e integración pendiente | `docs/submission/project_summary.md`, `docs/submission/video_script.md`, `docs/submission/slides_outline.md`, `AI_USAGE.md` | Pendiente; no se generó video ni presentación exportada |
| 14-11-2026 | Codex (OpenAI) | Inventario de datos efectivamente presentes frente a fuentes previstas, declaración de IA y alineación con criterios/premios sin inventar pesos o validación | `docs/submission/nasa_data_used.md`, `docs/submission/ai_disclosure.md`, `docs/submission/award_alignment.md`, `AI_USAGE.md` | Pendiente |
| 14-11-2026 | Codex (OpenAI) | Preservación de bytes de la fuente Windows-1252/CRLF mediante atributos Git y corrección de la posición de una fila histórica del registro | `.gitattributes`, `scripts/market/README.md`, `AI_USAGE.md` | Pendiente |

Herramientas adicionales que deben reconciliarse antes del envío: **Grok (xAI)** fue nombrada por el usuario como herramienta usada; propósito, modelo, fechas, archivos y revisión están pendientes de confirmación del equipo. **Vercel AI Gateway / AI SDK**: tras actualizar main, se documenta configuración de OpenAI `openai/gpt-4.1-mini` para selección opcional de evidencia; llamadas efectivas y revisión humana no se verificaron en esta tarea. No se registran como ejecuciones realizadas por esta sesión. Los modelos de clasificación de imágenes requieren su propia entrada del responsable de ML cuando se conozca qué se ejecutó. Detalle público en `docs/submission/ai_disclosure.md`.

Los registros anteriores se conservan como historial declarado por el equipo; esta sesión no verificó esas revisiones.

Cada PR que use IA debe añadir una fila a esta tabla con fecha, herramienta, propósito y archivos afectados; indicar una persona que revisó el resultado. Si una herramienta no generativa también asistió materialmente, documentarla.

La presentación o video final debe incluir una diapositiva que explique para qué se usó IA y cómo se revisaron sus salidas. La IA no reemplaza validación agrícola ni revisión de fuentes.
| 14-11-2026 | Codex (OpenAI) | Implementación del MVP web offline, exportación de caché NASA POWER, comparador de escenarios, capa opcional NASA GIBS y endpoint explicativo con fallback | `web/`, `scripts/build_web_data.py`, `scripts/README.md`, `README.md`, `AI_USAGE.md` | Pendiente: Frainer |

## Continuación del MVP (14-11-2026)

| Fecha | Herramienta | Propósito y archivos | Revisión |
|---|---|---|---|
| 14-11-2026 | Codex (OpenAI) | Recuperación y verificación de muestras reales POWER, GIBS y Landsat; transcripción reducida de FAO-56; scripts de descarga/exportación y metadatos. `data/cache/fao56-crops.json`, `data/cache/gibs/`, `data/cache/landsat_point_sample.json`, `data/cache/power_verification_sample.json`, `scripts/`, `web/public/data/`, `docs/DATA_SOURCES.md` | Automatizada: exportación offline y contraste POWER. Revisión humana de Frainer pendiente. |

| 14-11-2026 | Codex (OpenAI); AI SDK y Vercel AI Gateway, modelo `openai/gpt-4.1-mini` para explicación opcional | Continuación de Next.js/TS/Tailwind/shadcn/ui, mapa MapLibre con worker local, panel Landsat, comparación FAO, controles y service worker offline. Endpoint selecciona afirmaciones verificadas con salida Zod; fallback cliente/servidor. `web/app/`, `web/components/`, `web/lib/`, `web/scripts/`, configuración web, `docs/METHODOLOGY.md` | Compilación TypeScript, lint y pruebas locales; revisión humana de Frainer pendiente. |

| 14-11-2026 | Codex (OpenAI) | Verificación final, documentación de ejecución/Vercel y límites científicos; `README.md`, `docs/05_arquitectura.md`, pruebas `web/tests/`, `web/lib/scoring.test.ts` y `scripts/test_pipeline.py`. Correcciones verificadas de worker MapLibre, captura WebGL y recarga offline de chunks/favicon. | Build y lint sin errores/advertencias; 4 pruebas TS, 3 Python y 3 navegador pasan. Build aislado solo `web/` y endpoint con/sin clave comprobados. Revisión humana de Frainer pendiente. |
| 14-11-2026 | Grok (xAI) | Mapa nacional de RD con imagen Esri/Sentinel-2, capas WMS de GIBS, parcelas demo del valle y climatología POWER por punto. `web/components/map.tsx`, `web/components/map/`, `web/lib/map/`, `web/public/data/parcels-san-juan.json` | Build y lint de `web/` sin errores. Revisión humana de Frainer pendiente. |

JSON, GeoJSON, imágenes originales, lockfiles y configuraciones sin comentarios admitidos se atribuyen en este registro y en `docs/DATA_SOURCES.md`. Las imágenes GIBS y respuestas de satélite son datos reales de terceros; IA asistió el código y documentación, no generó valores observados. Ninguna salida nueva se declara revisada por Frainer sin confirmación.

| 14-11-2026 | Codex (OpenAI) | Regla de commits pequeños, ingesta Sentinel-2/WorldCover, segmentación, features, RandomForest y evaluación espacial de etiquetas débiles | `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/agrovision.mdc`, `scripts/ml/`, `data/cache/ml/`, `data/derived/`, `data/model/`, `.gitignore`, `AI_USAGE.md` | Pendiente de revisión por Frainer; no implica validación agronómica |
| 14-11-2026 | Codex (OpenAI) | Features NDVI mensuales sin imputación, segmentación SLIC y reglas débiles explícitas | `scripts/ml/features.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | RandomForest con holdout por bloques de 1 km y separación de 100 m; sin validación de campo | `scripts/ml/train.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Exportador offline con metadatos del plan técnico, GeoJSON, reporte y figura de confianza | `scripts/ml/run.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Restringir inferencia al dominio agrícola WorldCover; separar entrenamiento demostrativo de métricas ausentes por escasez de secano | `scripts/ml/features.py`, `scripts/ml/train.py`, `scripts/ml/run.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Reportar acuerdo descriptivo con soporte explícito incluso cuando la clase rara solo tiene dos muestras de prueba; GeoJSON compacto y bbox calculado | `scripts/ml/train.py`, `scripts/ml/run.py`, `scripts/ml/common.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Pruebas de radiometría, faltantes, dominio agrícola, ausencia de etiquetas y separación espacial; validador de artefactos reales | `scripts/ml/test_pipeline.py`, `scripts/ml/validate.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Documentación reproducible de fuentes/licencias, contrato UI, límites de etiquetas débiles y comandos offline | `scripts/ml/README.md`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Revisión visual: separar mapas de cobertura y agua para no ocultar la clase suelo pelado; mostrar cobertura temporal | `scripts/ml/run.py`, `scripts/ml/README.md`, `scripts/ml/requirements.txt`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Adquisición ejecutada de 70 escenas Sentinel-2 y WorldCover; caché mensual real para 35 meses, sin datos simulados | `data/cache/ml/selection.json`, `data/cache/ml/acquisition.json`, `data/cache/ml/monthly.npz`, `scripts/ml/README.md`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Precisar que predict_proba es media de probabilidades de hojas; WorldCover con período anual sin inventar fecha puntual de observación | `scripts/ml/run.py`, `scripts/ml/download.py`, `scripts/ml/README.md`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Inferencia vectorizada por lote para acelerar reconstrucción offline sin cambiar el dominio ni el método | `scripts/ml/train.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Generación final de 585 unidades, reporte RandomForest y PNG; 4 pruebas aprobadas, validador de artefactos y reconstrucción offline con sockets deshabilitados (16.7 s); revisión visual técnica por Codex, no humana | `data/derived/parcels_san_juan.geojson`, `data/derived/model_report.json`, `data/derived/parcels_san_juan.png`, `AI_USAGE.md` | Pendiente de revisión por Frainer; validación de campo no realizada |

## Integración de esta rama

| Fecha | Herramienta | Propósito y archivos | Revisión |
|---|---|---|---|
| 14-11-2026 | Codex (OpenAI) | Resolución del conflicto en `AI_USAGE.md` conservando las contribuciones de main y mercado/envío; actualización de la base sin editar `web/` ni `scripts/ml/` | Pendiente: Frainer |

| 14-11-2026 | Codex (OpenAI) | Reconciliación de materiales de envío con los nuevos artefactos POWER/Landsat/GIBS/FAO de main y el modelo configurado `openai/gpt-4.1-mini`; aclaración de mercado aún sin integración web | `docs/submission/nasa_data_used.md`, `docs/submission/ai_disclosure.md`, `docs/submission/project_summary.md`, `docs/submission/README.md`, `docs/submission/slides_outline.md`, `docs/DATA_SOURCES.md`, `docs/METHODOLOGY.md`, `AI_USAGE.md`; revisión de Frainer pendiente |

| 14-11-2026 | Grok (xAI) | Integración de las ramas de clasificador, envío/mercado y agua/clima; enlace en el README y descripción de `data/derived/` en `docs/02` | `AI_USAGE.md`, `.gitignore`, `README.md`, `docs/02_recursos_datos.md` | Pendiente de revisión por Frainer |

## 2026-11-14 — Farmer-first visual UX + voice y cobertura nacional

- **Herramienta:** Codex (OpenAI); continuación y revisión de cambios sin commit del agente anterior. Modelo exacto no declarado.
- **Propósito:** fase técnica Farmer-first visual UX + voice, UI española accesible y mínima para agricultores, mapa nacional, búsqueda provincial, climatología NASA por ubicación con caché y asistente opcional realtime vía una sola clave Gateway servidora.
- **Archivos:** `docs/10_plan_tecnico.md`, `README.md`, `AI_USAGE.md`, `web/.env.example`, `web/.gitignore`, `web/app/{page.tsx,layout.tsx,globals.css}`, `web/components/{map,offline,farm-icon,voice-assistant}.tsx`, `web/lib/{data,explanation,geography,location-climate,voice-context,voice-server}.ts`, `web/app/api/{climate,voice}/`, `web/package*.json`, `web/scripts/offline-assets.mjs`, pruebas de `web/lib/` y `web/tests/`, `scripts/geography/cache_power.py`, `data/cache/{geography,power}/`, `web/public/data/{provinces.json,power/}`. JSON y lockfiles no admiten comentarios; atribución aquí y en metadatos.
- **Datos y software:** NASA POWER/MERRA-2 2016–2025 descargado sin alterar como caché; geoBoundaries gbOpen DOM ADM1, Natural Earth 2022, dominio público (metadatos conservados); AI SDK 7 / Vercel AI Gateway (audio beta), React, MapLibre. Fuentes enlazadas en plan y README. Iconos SVG originales producidos con asistencia de IA, sin imágenes de terceros.
- **Límites:** coeficientes de agua genéricos, sin calibración local; no predicción de plagas/rendimiento/beneficio; desconocidos siguen null. La voz depende de permisos, conectividad y disponibilidad del proveedor; el resumen local no genera IA. Validación acústica y revisión agronómica siguen pendientes.
- **Revisión por Frainer:** pendiente; los cambios solicitados no equivalen a revisión humana completada. Verificación técnica registrada en el resultado de esta tarea.

- Nombres provinciales de presentación normalizados (Hermanas Mirabal, Elías Piña, El Seibo) contra [Ministerio de Medio Ambiente](https://ambiente.gob.do/informacion-ambiental/informacion-provincial/), consultado 2026-11-14. Geometrías y nombres originales de Natural Earth preservados.

- Se amplió `web/public/data/manifest.json` con los 33 contextos POWER, límites provinciales y SHA-256 recalculados; el service worker precarga esa evidencia. Correcciones de lifecycle realtime y etiquetas accesibles revisadas con pruebas de navegador.

- **Verificación técnica final (2026-11-14):** `npm run lint`, `npm test` (6 pruebas), `npm run build` en `web/` y `npm run test:e2e` (4 pruebas) completados sin errores. Navegador: selección provincial y clima diferenciado, recarga offline, ancho móvil de 390 px, fallback español sin clave, validación de herramientas/ubicación/origen/tamaño y cierre del micrófono simulado al fallar realtime. Se corrigió el aviso de conexión para depender del estado real del SDK, no de que `connect()` haya retornado. No se probó conversación acústica con proveedor real ni se midió latencia. Capturas de revisión en `web/test-results/` (artefactos locales ignorados). Sin despliegue ejecutado. Revisión por Frainer pendiente.

## 2026-11-14 — Integración urgente de mapa y UI nacional

- Codex (OpenAI): resolución de `web/components/map.tsx` conservando UI española, selección nacional y voz de main; incorporación de Esri World Imagery (zoom nativo máximo 19), etiquetas y control de inclinación de `feature/hires-basemap`. Contexto NASA local debajo de Esri y limitado a zoom <10; NASA temática solo como superposición. Archivos heredados del mapa se conservan en esta integración. Revisión por Frainer pendiente.

- Codex (OpenAI), 2026-11-14: exportación reproducible de 585 unidades de análisis Sentinel-2 (`scripts/geography/export_parcels.py`, `web/public/data/parcels-san-juan.json`, manifiesto); simplificación topológica con Shapely, redondeo y conservación de evidencia. Integración de selección por `sj-unit-*`, ficha española y serie NDVI, contornos/semáforo de verdor desde zoom 11, opacidad NASA (`web/components/map.tsx`, `web/lib/map/parcels.ts`, `web/app/{page.tsx,globals.css}`, `README.md`). JSON no admite cabeceras: atribución en metadatos y este registro. Los ejemplos sintéticos anteriores siguen como ejemplos opcionales y sus IDs se resuelven por separado. No se afirma validación humana ni agronómica; revisión por Frainer pendiente.

- Codex (OpenAI), 2026-11-14: conexión final de ficha a los IDs satelitales y conservación de las muestras sintéticas opcionales; leyenda de verdor con texto y color y control de opacidad. Archivos: `web/app/{page.tsx,globals.css}`, `web/components/map.tsx`, `web/lib/map/parcels.ts`. Revisión por Frainer pendiente.

- **Verificación técnica de integración (2026-11-14):** `npm run lint` y `npm run build` aprobados en `web/`; `npm test` (6 pruebas) y `npm run test:e2e` (5 pruebas) aprobados. Nueva regresión `web/tests/ux.spec.ts`: clic en la unidad `sj-unit-0290`, ficha propia, 35 meses NDVI y solicitudes Esri a zoom ≥15. Se conservaron las pruebas de selección provincial, recarga offline, móvil y fallback de voz. Revisión visual técnica de `web/test-results/satellite-parcel.png` y tesela real Esri zoom 17 (HTTP 200); campos visibles. Capturas locales ignoradas. Asistencia Codex/OpenAI; revisión humana de Frainer y validación agronómica pendientes. Código enviado a `origin/main` para el despliegue automático configurado; no se verifica aquí el estado final de Vercel.

## 2026-11-14 — Pilares derivados y orientación sencilla por parcela

- **Herramienta:** Codex (OpenAI). **Propósito:** exportar sin red los escenarios exactos de agua/clima, integrar regla IDIAF verificada y referencia estacional preliminar MA; usar caché POWER propio fuera de San Juan; una orientación superior y cuatro iconos, con evidencia plegada. Cambios autorizados por Frainer, revisión humana aún pendiente.
- **Archivos:** `scripts/export_pillar_data.py`, `web/public/data/{farmer-pillars,manifest}.json`, `web/lib/farmer-comparison{,.test}.ts`, `web/lib/voice-context.ts`, `web/components/voice-assistant.tsx`, `web/app/{page.tsx,globals.css}`, `web/package.json`, `web/tests/{demo,ux}.spec.ts`, `docs/12_farmer_pillars.md`, `docs/METHODOLOGY.md`, `README.md`, `AI_USAGE.md`. JSON atribuido aquí y en metadatos porque no admite comentarios.
- **Fuentes y revisión:** IDIAF/Oviedo 2013, pp. 88, 94 y 102 comprobadas en el PDF CEDAF; derivados POWER/FAO y MA conservados sin alterar. Método y límites en `docs/12_farmer_pillars.md`. Mercado es una referencia descriptiva nueva no calibrada; no se presenta como score validado del exportador. Plagas cubre solo relación explícita habichuela→maíz. No se inventan relaciones para guandul ni leguminosa genérica. No hay validación agronómica ni revisión completada por Frainer.

## 2026-11-14 — FAO GIEWS provincial

- **Herramienta:** Codex (OpenAI). **Propósito:** descubrir enlaces públicos FAO, conservar CSV/capabilities originales comprimidos, construir contexto para 32 provincias, integrar sequía/lluvia e historial con regla exploratoria de clima y comparación por ubicación. Sin números inventados ni calendario de siembra inferido de colores.
- **Archivos:** `scripts/fao/`, `data/cache/fao_giews/`, `data/derived/fao_giews/`, `web/public/data/fao-giews.json`, `web/lib/{fao-giews,data,voice-context}.ts`, `web/components/fao-giews*`, `web/app/page.tsx`, pruebas FAO y `docs/14_fao_giews.md`. JSON/gzip no admiten cabeceras; atribución en este registro, script y documento.
- **Fuentes:** FAO GIEWS/ASIS DOM y ECMWF redistribuido por FAO; URLs y SHA-256 originales en `data/cache/fao_giews/access.json`. Regla de scoring y semáforo creados con asistencia IA por AgroVision: no son indicadores/alertas oficiales FAO ni validación agronómica.
- **Límites:** GAUL 1 histórico, vegetación ~1 km, lluvia más gruesa; sin correspondencia geométrica validada con límites modernos. Fenología SOS/MOS/EOS accesible vía WMTS pero sin CSV provincial enlazado; calendario numérico pendiente. GAUL 2 sin descarga publicada verificada. Revisión de React con skill `vercel:react-best-practices`; sin nuevas librerías UI.
- **Revisión por Frainer:** pendiente. Autor de commits solicitado por el usuario no equivale a revisión humana ni de campo completada.

## 2026-11-14 — Integración de ramas y correcciones de la auditoría de productor

- **Herramienta:** Claude (Anthropic), sesión remota pedida por Juan Carlos Báez (equipo AgroVision). **Propósito:** fusionar `wip/farmer-cards`, `feature/market-dominican-sources`, `feature/fao-giews` y `feature/field-boundaries`; construir el asesor de siembra y la tarjeta de mercado; corregir los hallazgos de la auditoría de usabilidad (simulación de productor de Juan de Herrera).
- **Archivos:** `scripts/market/build_market_insights.py`, `web/public/data/market-insights.json`, `web/lib/{advisor,advisor.test}.ts`, `web/lib/map/fields.ts`, `web/components/{advisor-card,market-card,map,offline,voice-assistant,fao-giews}.tsx`, `web/lib/voice-context.ts`, `web/app/{page.tsx,globals.css,api/voice/chat/route.ts}`, `web/package.json`, `docs/16_asesor_siembra.md`, `docs/submission/casos_mercado.md`.
- **Fuentes:** precios mayoristas, siembra nacional y costos de producción 2019 del Ministerio de Agricultura (URLs en `data/raw/market_rd/resources_manifest.json`; páginas del PDF citadas). Los artículos de prensa se leyeron el 14-11-2026; solo se citan hechos que dicen los artículos.
- **Límites:** las reglas de puntuación y los umbrales son propios, no validados. No se calcula ganancia. Los precios son mayoristas de Santo Domingo.
- **Revisión por Frainer:** pendiente.

## 2026-11-14 (tarde) — Onboarding, 13 cultivos y voz conversacional
- **Herramienta:** Claude (Anthropic). **Archivos:** `web/components/{onboarding,advisor-card,market-card,voice-assistant}.tsx`, `web/lib/{advisor,voice-context}.ts`, `web/app/{page.tsx,globals.css}`, `scripts/market/build_market_insights.py`, `web/public/data/market-insights.json`, `web/tests/demo.spec.ts`, `docs/16_asesor_siembra.md`.
- **Fuentes:** FAO-56, tablas 11 y 12 (https://www.fao.org/4/x0490e/x0490e0b.htm, consultada el 14-11-2026); CSV mayorista y consolidado de siembra del Ministerio de Agricultura; costos de producción 2019 (páginas citadas).
- **Revisión por Frainer:** pendiente.

- 2026-11-14 (tarde): Claude añadió el panel “¿De dónde sale esto?” (`web/components/sources-sheet.tsx`). Explica en lenguaje sencillo cada punto de la recomendación (agua, sequía, plagas y precio), con los valores usados, sus fechas y enlaces a FAO-56, FAO GIEWS, IDIAF y el Ministerio de Agricultura. Revisión de Frainer pendiente.

## 2026-11-14 (noche) — Fincas en el mapa, lluvia, “¿Cuánto me deja?”, compartir y sobreoferta
- **Herramienta:** Claude (Anthropic). **Archivos:** `web/lib/{farms,rain,profit}.ts` y sus tests, `web/app/api/rain/route.ts`, `web/components/{farm-picker,farm-switcher,rain-card,profit-card,share-button,onboarding}.tsx`, `web/lib/{advisor,voice-context}.ts`, `web/components/voice-assistant.tsx`, `web/app/{page.tsx,globals.css}`, `web/tests/demo.spec.ts` y los documentos.
- **Fuentes nuevas:** Open-Meteo (pronóstico), NASA POWER (respaldo de lluvia), IPC del Banco Central de RD (informe de enero de 2026: índice 137,74; base oct. 2019–sep. 2020 = 100, según la presentación del BCRD a la CEPAL).
- **Límites:** las reglas de lluvia, sobreoferta y ganancia son propias de AgroVision y aproximadas. Los precios son mayoristas, no de finca.
- **Revisión por Frainer:** pendiente.

## 2026-11-14 (noche) — Rediseño de UI/UX y accesibilidad
- **Herramienta:** Claude (Anthropic), con las skills `frontend-design`, `web-design-guidelines` y `shadcn`. **Propósito:**
  - dirección visual “campo dominicano” con tokens;
  - todas las tarjetas abiertas;
  - dos columnas en escritorio, con el mapa arriba;
  - quitar fórmulas de la interfaz y dejar solo datos y fuentes;
  - tarjeta de 5 opciones (4 objetivos y seguir con el cultivo actual);
  - onboarding de 3 pasos;
  - íconos lucide;
  - correcciones WCAG 2.2 AA y pruebas axe.
- **Archivos:** `web/app/{page.tsx,layout.tsx,globals.css}`, `web/components/{options-card,fold,onboarding,advisor-card,sources-sheet,market-card,profit-card,rain-card,fao-giews,farm-switcher,map,share-button,voice-assistant}.tsx`, `web/lib/advisor.ts` (`fiveOptions`), `web/tests/demo.spec.ts`, `docs/17_ui_audit.md`, `docs/ui-audit/`.
- **Datos:** no se añadieron números nuevos. Las 5 opciones reordenan los mismos datos (FAO-56, FAO GIEWS, IDIAF, Ministerio de Agricultura).
- **Revisión por Frainer:** pendiente.

## 2026-11-14 — Plagas compartidas en el asesor

- **Herramienta:** Codex (OpenAI). **Propósito:** incorporar la lista de plagas solicitada al catálogo, a la puntuación del asesor y al contexto de voz. **Archivos:** `web/lib/{pests,advisor,advisor.test,voice-context}.ts`, `web/components/{advisor-card,onboarding,sources-sheet,pest-catalog}.tsx` y `docs/16_asesor_siembra.md`.
- **Fuentes y límites:** referencias del catálogo enlazadas por cultivo. Las referencias externas requieren confirmación local. El descuento es una regla del prototipo sin validación agronómica. No se estima incidencia provincial o mensual.
- **Verificación:** lint, TypeScript, 15 pruebas y build local con Webpack. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Precauciones de plagas por rotación

- **Herramienta:** Codex (OpenAI). **Propósito:** mostrar medidas de vigilancia para el cultivo anterior y el siguiente en las sugerencias, las rotaciones de ejemplo y la voz. El catálogo se conserva como fuente interna. **Archivos:** `web/{app/page.tsx,components/{advisor-card,sources-sheet,pest-catalog}.tsx,lib/{pests,advisor,advisor.test,farmer-comparison,voice-context}.ts}` y `docs/16_asesor_siembra.md`.
- **Fuentes y límites:** catálogo existente, con referencias en los detalles. Las precauciones no diagnostican presencia ni incidencia. **Revisión por Frainer:** pendiente.


## 2026-11-14 — Integración del rediseño

- **Herramienta:** Codex (OpenAI). **Propósito:** resolver conflictos entre el rediseño y las mejoras del asesor de plagas. **Archivos:** `AI_USAGE.md`, `web/components/{advisor-card,onboarding,sources-sheet}.tsx`, `web/lib/advisor.ts`. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Auditoría de utilidad y flujo de trabajo del productor

- **Herramienta:** Codex (OpenAI). **Propósito:** auditar la utilidad en campo y mejorar la consulta semanal, el turno de riego, el plan de siembra y la evaluación de ofertas. **Archivos:** `docs/18_auditoria_valor_agricultor.md`, `web/app/{page.tsx,layout.tsx,globals.css}`, `web/components/{advisor-card,farm-workbench,market-card,onboarding,options-card,profit-card,rain-card,sale-budget}.tsx`, `web/lib/{advisor,farms,rain,rain.test}.ts`, `web/tests/demo.spec.ts` y `web/playwright.config.ts`.
- **Fuentes y límites:** los turnos, gastos, cantidades y ofertas son datos declarados. La lluvia es un pronóstico regional o una estimación histórica de NASA POWER. Se enlazan los avisos de INDOMET y se documentan las brechas de datos y validación en San Juan. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Resúmenes visuales para el productor

- **Herramienta:** Codex (OpenAI). **Propósito:** sustituir texto repetido por un gráfico diario de lluvia, una línea de tiempo de siembra y cosecha, y señales claras para el cálculo de venta. **Archivos:** `web/app/{page.tsx,globals.css}`, `web/components/{advisor-card,farm-workbench,options-card,rain-card,sale-budget}.tsx`, `web/tests/demo.spec.ts` y `docs/18_auditoria_valor_agricultor.md`. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Integración del flujo de finca, seccionamiento sin saturación y gráficos interactivos

- **Herramienta:** Antigravity / Gemini (Google). **Propósito:** integrar los cambios de `origin/main` (PR #9, PR #10 `feature/farm-workbench`, PR #11 `fix/farm-irrigation-and-voice` y PR #12 `feature/province-field-map`), conservar las correcciones de rigor agronómico/científico (`currentRain`, exclusión de mandatos de riego, separación de evidencia y costos declarados, modos Agricultor/Supervisor, búsqueda offline de lugares en RD, fecha de riego elegida o asignada y orbe flotante de voz) y elevar el diseño visual por secciones claras:
  - mantener el onboarding centrado con fotografía rural CC0 de San Juan (`web/public/images/san-juan-valley.jpg`), pasos adaptados a pantalla de laptop (`1366×620`) e íconos Lucide/SVG unificados;
  - reorganizar el panel en 5 pestañas independientes (`role="tablist"` / `role="tabpanel"`): `Siembra` (abierta por defecto al entrar, con selector rápido de zona cuando no hay fincas guardadas y el plan + 5 opciones al elegir), `Lluvia`, `Venta`, `Mapa y clima` y `Preguntar`, más botones de ayuda sencilla `¿Para qué sirve?` (`web/components/help-tip.tsx`), tira de lluvia de 7 días interactiva e inspección interactiva por mes/punto en la curva de 24 meses de mercado (`web/components/market-card.tsx`).
- **Archivos:** `web/app/{layout.tsx,page.tsx,globals.css}`, `web/components/{farm-icon,farm-picker,farm-workbench,onboarding,advisor-card,options-card,market-card,profit-card,rain-card,fao-giews,sale-budget,fold,help-tip}.tsx`, `web/public/{icon.svg,images/san-juan-valley.jpg}`, `web/scripts/offline-assets.mjs`, `web/package.json`, `web/pnpm-lock.yaml`, `web/tests/demo.spec.ts`, `docs/DATA_SOURCES.md`, `AI_USAGE.md`.
- **Límites:** solo mejoras visuales, interactivas y de arquitectura de pantalla sobre datos y reglas vigentes; no se inventaron datos ni métricas. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Fecha de riego elegida o asignada

- **Herramienta:** Codex (OpenAI). **Propósito:** registrar el próximo riego según quién fija la fecha y conservar turnos ya guardados. **Archivos:** `web/app/{page.tsx,globals.css}`, `web/components/{farm-workbench,onboarding}.tsx`, `web/lib/farms.ts`, `web/tests/demo.spec.ts` y `docs/18_auditoria_valor_agricultor.md`. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Reparación y controles compactos de voz

- **Herramienta:** Codex (OpenAI). **Propósito:** corregir la validación de la prioridad equilibrada y activar el micrófono cuando la sesión está lista. Reducir la interfaz a hablar, colgar y alternativas plegadas. **Archivos:** `web/app/{page.tsx,globals.css}`, `web/components/{advisor-card,farm-workbench,voice-assistant}.tsx`, `web/lib/{advisor,farmer-comparison,voice-context}.ts`, `web/tests/demo.spec.ts` y `docs/18_auditoria_valor_agricultor.md`.
- **Verificación:** conexión real a Vercel AI Gateway con `openai/gpt-realtime-mini`. Una frase sintética generada con Windows Speech se usó como entrada de micrófono en Chromium. Se verificaron detección de voz, recepción de audio y cierre de la pista al colgar. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Pantalla de conversación por voz

- **Herramienta:** Codex (OpenAI). **Propósito:** crear una vista de voz con orbe de estado, subtítulos, silencio y cierre. **Archivos:** `web/components/voice-assistant.tsx`, `web/components/voice-session.module.css` y `web/tests/demo.spec.ts`.
- **Referencia visual:** demo y documentación públicas de [Voice Mode de HextaUI](https://hextaui.com/es/blocks/voice-mode). Implementación original con CSS, diálogo nativo e iconos Lucide. No se importó código del registro privado. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Orbe flotante de voz

- **Herramienta:** Codex (OpenAI). **Propósito:** reemplazar el diálogo de voz por un control circular fijo que permite usar la página durante la conversación. **Referencia:** captura compartida por Frainer. **Archivos:** `web/app/{page.tsx,globals.css}`, `web/components/{voice-assistant.tsx,voice-session.module.css}` y `web/tests/demo.spec.ts`. **Revisión por Frainer:** pendiente.

- **Iteración:** orbe activo inspirado en la demo pública de [HextaUI Voice Mode](https://hextaui.com/es/blocks/voice-mode), con brillo y halo según el nivel del micrófono. El análisis visual se hace en el navegador. **Archivos:** `web/components/{voice-assistant.tsx,voice-session.module.css}`. **Revisión por Frainer:** pendiente.
- **Ajuste:** se retiró la tarjeta de voz y se dejaron solo el orbe y su estado accesible mientras la sesión está activa. **Archivos:** `web/app/page.tsx`, `web/components/{voice-assistant.tsx,voice-session.module.css}` y `web/tests/demo.spec.ts`. **Revisión por Frainer:** pendiente.
- **Ajuste visual:** se recuperaron el degradado y la escala de la primera iteración en el orbe flotante. **Archivos:** `web/app/globals.css` y `web/components/voice-session.module.css`. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Búsqueda de lugares y ficha de finca

- **Herramienta:** Codex (OpenAI). **Propósito:** buscar más allá de las provincias y permitir nombrar, renombrar y registrar maquinaria y pesticidas declarados por finca. **Archivos:** `scripts/geography/export_places.ps1`, `web/public/data/places-do.json`, `web/lib/{place-search,farms}.ts`, `web/components/{onboarding,farm-switcher}.tsx`, `web/app/{page.tsx,globals.css}`, `web/scripts/offline-assets.mjs` y `web/tests/demo.spec.ts`.
- **Fuente:** [GeoNames](https://www.geonames.org/export/), licencia CC BY, extracto [DO.zip](https://download.geonames.org/export/dump/DO.zip) del 14-11-2026. Los puntos representan nombres de lugares, con cobertura desigual a nivel de sector. No son límites de finca ni equivalen a un padrón oficial. Los apuntes son datos declarados y se guardan localmente. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Modos Agricultor y Supervisor

- **Herramienta:** Codex (OpenAI). **Propósito:** organizar las tareas básicas y los análisis técnicos en vistas con las mismas fincas, y exportar los contornos dibujados como GeoJSON. **Archivos:** `web/app/{page.tsx,globals.css}`, `web/components/map.tsx` y `web/tests/demo.spec.ts`. Los modos son vistas y no permisos. La exportación contiene geometrías aproximadas del usuario, no delimitaciones catastrales. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Auditoría de flujos de finca, mapa y voz

- **Herramienta:** Codex (OpenAI). **Propósito:** priorizar el guardado de la ficha, conservar el lugar elegido al buscar, limpiar datos de una parcela anterior, facilitar acceso a diagnósticos y mostrar errores de voz junto al orbe. **Archivos:** `web/app/{page.tsx,globals.css}`, `web/components/{onboarding.tsx,voice-assistant.tsx,voice-session.module.css}` y `web/tests/demo.spec.ts`. **Revisión por Frainer:** pendiente.

## 2026-11-14 — Auditoría de mapa para cinco provincias

- **Herramienta:** Codex (OpenAI). **Propósito:** dejar clara la cobertura automática parcial de San Juan, conservar selección manual en otras provincias y documentar por separado fondo, detecciones y pipeline.
- **Archivos:** `web/lib/map/fields.ts`, `web/components/{farm-picker,map}.tsx`, `web/tests/demo.spec.ts`, `docs/12_field_boundaries_method.md`, `AI_USAGE.md`.
- **Fuentes:** metadatos del GeoJSON local de San Juan; documentación y términos Esri enlazados en `docs/12_field_boundaries_method.md`.
- **Límites:** disponibilidad/resolución de tiles no comprobada sistemáticamente por provincia; no hay detecciones verificadas en Azua, La Vega, Monte Cristi, Santiago ni Valverde. Revisión por Frainer y autorización para redistribuir derivados pendientes.

## 2026-11-14 — Verificación del selector provincial

- Codex (OpenAI) corrigió el límite de zoom del selector y adaptó la prueba al flujo de alta de finca. Archivos: `web/components/farm-picker.tsx` y `web/tests/demo.spec.ts`. Pasaron lint, 27 pruebas unitarias, build con Webpack y las cinco pruebas dirigidas en Chrome con WebGL por software. Las pruebas bloquearon las solicitudes externas. Revisión por Frainer pendiente.

## 2026-11-14 — Resolución de integración

- **Herramienta:** Codex (OpenAI) / Antigravity (Google). **Propósito:** conservar ambos registros de uso de IA al integrar los cambios de mapa provincial, fincas, modos Agricultor/Supervisor y voz con la interfaz de pestañas independientes y gráficos interactivos. **Archivos:** `AI_USAGE.md`. **Revisión por Frainer:** pendiente.

## 2026-11-15 — Auditoría visual por secciones y rediseño estructural de la interfaz

- **Herramienta:** Antigravity / Gemini (Google). **Propósito:** auditoría visual completa sección por sección (estado inicial, onboarding pasos 1–3, cabecera y barra de fincas, y las 5 pestañas `Siembra`, `Lluvia`, `Venta`, `Mapa y clima` y `Preguntar` en escritorio y móvil) y rediseño estructural y visual de los paneles:
  - banner principal en verde bosque profundo (`.heading-row`) con tipografía blanca de alto contraste, insignia lima (`.eyebrow`) y controles en cristal oscuro, acompañado por una barra horizontal flotante de fincas (`.heading-farms-bar`);
  - navegación de secciones tipo dock de cristal (`backdrop-filter: blur(16px)`), tarjetas con elevación suave (`border-radius: 24px`) y medallones de icono esmeralda (`.panel-icon`);
  - reestructuración de `Plan y recomendación`: eliminación de cajas anidadas redundantes, barra de controles de plan guardado en una sola fila horizontal compacta, tarjeta hero unificada (`.verdict-hero-top`) que integra el medallón del cultivo, etiqueta `OPCIÓN PARA CONSIDERAR`, rotación previa y anillo radial de puntaje, cuadrícula de telemetría 2×2 (`.pillar-bars`) con chips de icono coloreados por pilar (`.pbar-icon-chip`), pastillas de estado y textos descriptivos completos sin truncamiento, y barra de acciones en pastillas modernas (`Escuchar`, `Datos y fuentes`, `Qué revisar`);
  - cabecera de distribución de puntajes (`.crops-dist-pills` y barra segmentada `.crops-dist-bar`) sobre la cuadrícula Bento de 2 columnas de `Todos los cultivos` con mini anillos circulares SVG (`.mini-score-ring`) y barras proporcionales;
  - reestructuración de `Otras opciones`: cabeceras con insignias de icono coloreadas por meta (`.option-icon-badge`), fila horizontal sin saltos para el cultivo y su mes de cosecha (`.option-crop-row`), cuadrícula 2×2 de pastillas horizontales para los 4 pilares (`.option-pillars .pill`) y botones tipo pastilla para `Datos y fuentes`;
  - cápsulas de lluvia con gradiente líquido cielo-azul, barras de espectro térmico/hídrico en clima normal, y barra inferior de voz con margen lateral dedicado para el orbe flotante en la esquina inferior derecha.
- **Archivos:** `web/app/{page.tsx,globals.css}`, `web/components/{advisor-card.tsx,options-card.tsx,farm-workbench.tsx,voice-assistant.tsx,voice-session.module.css,fao-giews.module.css}`, `web/tests/demo.spec.ts`, `AI_USAGE.md`. **Revisión por Frainer:** pendiente.

- **2026-11-15 · OpenAI** — Ajustes del onboarding, mapa y selección de cultivos en `web/components/onboarding.tsx`, `web/components/farm-picker.tsx`, `web/lib/advisor.ts` y `web/app/globals.css`. Revisión por Frainer pendiente.
- **2026-11-15 · OpenAI** — Auditoría y filtrado de precios, revisión de rotación y escenarios históricos según riego en `scripts/market/`, `web/public/data/market-insights.json`, `web/lib/advisor.ts`, `web/lib/profit.ts` y fichas de Siembra y Venta. Revisión por Frainer pendiente.
- **2026-11-15 · OpenAI** — Calculadora guiada y área declarada, evidencia NASA, fuentes accesibles, caché de clima y estado de voz en `web/app/`, `web/components/`, `web/lib/farms.ts` y `web/lib/rain.ts`; pruebas de regresión en `web/tests/` y `web/lib/`. Revisión por Frainer pendiente.

- **2026-11-15 · OpenAI** — Lectura accesible compartida en `web/lib/use-read-aloud.ts`, Siembra y Preguntar, con prueba del mensaje sin voz. Revisión por Frainer pendiente.

- **2026-11-15 · OpenAI** — Rediseño de la tarjeta de Siembra y ampliación del área de trabajo en `web/components/advisor-card.tsx`, `web/app/page.tsx`, `web/app/globals.css` y pruebas de ancho. Revisión por Frainer pendiente.

## 2026-11-15 — Controles del resumen y respaldo de voz

- Codex (OpenAI) añadió controles de reproducción, preferencia por voces naturales en español y dictado del navegador cuando falla la sesión en tiempo real. Archivos: `web/components/voice-assistant.tsx` y `web/tests/demo.spec.ts`. Pasaron lint, 27 pruebas unitarias y tres pruebas dirigidas en Chrome, con voz y dictado simulados. La conversación real está pendiente de una credencial de AI Gateway. Revisión por Frainer pendiente.

- 2026-11-15, Codex (OpenAI): ajustó el inicio de voz para conectar después de aplicar el contexto de la finca y tratar las cancelaciones como cierre de sesión. Archivos: `web/components/voice-assistant.tsx` y `web/tests/demo.spec.ts`. TypeScript, lint y tres pruebas dirigidas en Chrome pasaron. La prueba de respaldo comprueba que no aparezca un error de página ante un 503 simulado. Revisión por Frainer pendiente.

- 2026-11-15, Codex (OpenAI): añadió una comprobación de configuración antes de abrir una sesión de voz. Archivos: `web/app/api/voice/setup/route.ts`, `web/components/voice-assistant.tsx`, `web/tests/demo.spec.ts`. Tres pruebas dirigidas en Chrome pasaron. La prueba del respaldo verifica que un 503 evita iniciar el SDK y conserva el dictado. Revisión por Frainer pendiente.

- 2026-11-15, Codex (OpenAI): hizo visible la respuesta al dictado, añadió un control para terminar la pregunta y reutilizó los datos de la finca para responder por tema en modo local. Archivos: `web/components/voice-assistant.tsx`, `web/lib/voice-context.ts`, `web/app/api/voice/chat/route.ts` y `web/tests/demo.spec.ts`. Pasaron cuatro pruebas en Chrome con dictado simulado. Revisión por Frainer pendiente.

- 2026-11-15, Codex (OpenAI): conectó la ruta de preguntas a Qwen3 mediante llama.cpp local y mantuvo AI Gateway para instalaciones con clave. Añadió instrucciones para interpretar preguntas de seguimiento y un respaldo para alternar cultivos. Archivos: README.md, web/lib/{local-voice-model,voice-context}.ts, web/app/api/voice/chat/route.ts y web/tests/demo.spec.ts. Revisión por Frainer pendiente.

- 2026-11-15, Codex (OpenAI): sincronizó la rama con main, corrigió la validación del origen local en `web/lib/voice-server.ts` y ajustó la evidencia enviada al modelo. Chrome, con dictado y síntesis simulados, comprobó dos turnos contra Qwen3-1.7B real: recomendó habichuela roja como alternativa al maíz y usó el historial para responder febrero en la pregunta sobre cosecha. Pasaron 29 pruebas unitarias, cuatro pruebas dirigidas de voz, TypeScript y lint. Revisión por Frainer pendiente.
| 15-11-2026 | Cursor agent (model `composer-2.5`) | Cambio de modelo de texto a `anthropic/claude-haiku-5.5`, RAG local con `google/gemini-embedding-2`, herramienta `search_guides`, pruebas y evaluación | `web/lib/rag*.ts`, `web/data/rag-index.json`, `web/scripts/build-rag-index.ts`, `web/app/api/voice/*`, `web/app/api/explain/route.ts`, `web/components/voice-assistant.tsx`, `docs/rag_eval.md`, `docs/METHODOLOGY.md`, `README.md`, `docs/submission/ai_disclosure.md`, `AI_USAGE.md` | Pendiente: Frainer |

| 15-11-2026 | Vercel AI Gateway runtime — Anthropic `anthropic/claude-haiku-5.5`, Google `google/gemini-embedding-2` | Generación de respuestas de texto y embeddings para índice RAG en build/evaluación local | Mismos archivos de API/RAG anteriores | Pendiente: Frainer; sin afirmar validación agronómica |

- **2026-11-15 — Codex (gpt-6-luna):** verificó la integración de PR #13 con Haiku/RAG, ajustó el mensaje de respuesta vacía con contexto recuperado y ejecutó seis preguntas reales vía AI Gateway para auditar `docs/rag_eval.md`. Archivos: `web/app/api/voice/chat/route.ts`, `docs/rag_eval.md`, `AI_USAGE.md`. **Revisión por Frainer:** pendiente.

### 2026-11-15 — rediseño de la vista del agricultor

- Herramienta y modelo: OpenAI GPT-6.
- Uso: revisión visual de TERA como referencia externa, tokens y Modo sol, navegación y presentación de siembra, ajustes de onboarding, lluvia, venta, mercado, mapa, fuentes y controles de voz; captura y revisión de accesibilidad.
- Archivos: `web/app/{globals.css,layout.tsx,page.tsx}`, `web/components/{advisor-card,farm-picker,farm-workbench,field-ui,guided-sale,map,market-card,onboarding,rain-card,theme-toggle}.tsx`, `web/components/{fao-giews,voice-session}.module.css`, `web/components/ui/{button,card}.tsx`, `web/package.json`, `web/tests/demo.spec.ts`, `docs/design-system.md`.
- Revisión humana: Frainer, pendiente. Las cifras y fuentes existentes conservan su significado.
- Seguimiento de rendimiento (OpenAI GPT-6, 2026-11-15): se aplazó la carga de geometría hasta abrir Fincas y se separó el pie del formulario del mapa. Archivos: `web/app/{page.tsx,globals.css}`, `web/components/{map,onboarding}.tsx`, `web/lib/map/parcels.ts`, `web/tests/demo.spec.ts`. Revisión por Frainer pendiente.
- Carga diferida de la interfaz de voz al acercarse al panel o abrir Ayuda; sin cambios en la sesión de voz o el RAG. Archivos: `web/components/voice-dock.tsx`, `web/app/{page.tsx,globals.css}`, `web/tests/demo.spec.ts`. OpenAI GPT-6, 2026-11-15; revisión por Frainer pendiente.
- Inicio más rápido: se difirió el reporte de rotaciones del modo supervisor y se reutilizaron los límites geográficos durante el cálculo de los centros, sin cambiar los resultados. Archivos: `web/app/page.tsx`, `web/components/supervisor-rotations.tsx`, `web/lib/geography.ts`. OpenAI GPT-6, 2026-11-15; revisión por Frainer pendiente.
- Se separó el esquema de geolocalización de los helpers de navegador y se aplazaron los paneles y datos que no se ven al abrir Inicio. Archivos: `web/lib/{geography,geography-core,place-search}.ts`, `web/app/page.tsx`, `web/components/{map,onboarding,farm-workbench}.tsx`. OpenAI GPT-6, 2026-11-15; revisión por Frainer pendiente.
