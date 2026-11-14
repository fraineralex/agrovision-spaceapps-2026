# Uso de inteligencia artificial

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
