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

## Regla para contribuciones

Cada PR que use IA debe añadir una fila a esta tabla con fecha, herramienta, propósito y archivos afectados; indicar una persona que revisó el resultado. Si una herramienta no generativa también asistió materialmente, documentarla.

La presentación o video final debe incluir una diapositiva que explique para qué se usó IA y cómo se revisaron sus salidas. La IA no reemplaza validación agrícola ni revisión de fuentes.
| 14-11-2026 | Codex (OpenAI) | Preparación y enlace del plan técnico ejecutable de AgroVision | `docs/10_plan_tecnico.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/agrovision.mdc`, `AI_USAGE.md` | Frainer |
| 14-11-2026 | Codex (OpenAI) | Implementación del MVP web offline, exportación de caché NASA POWER, comparador de escenarios, capa opcional NASA GIBS y endpoint explicativo con fallback | `web/`, `scripts/build_web_data.py`, `scripts/README.md`, `README.md`, `AI_USAGE.md` | Pendiente: Frainer |

## Continuación del MVP (14-11-2026)

| Fecha | Herramienta | Propósito y archivos | Revisión |
|---|---|---|---|
| 14-11-2026 | Codex (OpenAI) | Recuperación y verificación de muestras reales POWER, GIBS y Landsat; transcripción reducida de FAO-56; scripts de descarga/exportación y metadatos. `data/cache/fao56-crops.json`, `data/cache/gibs/`, `data/cache/landsat_point_sample.json`, `data/cache/power_verification_sample.json`, `scripts/`, `web/public/data/`, `docs/DATA_SOURCES.md` | Automatizada: exportación offline y contraste POWER. Revisión humana de Frainer pendiente. |

| 14-11-2026 | Codex (OpenAI); AI SDK y Vercel AI Gateway, modelo `openai/gpt-4.1-mini` para explicación opcional | Continuación de Next.js/TS/Tailwind/shadcn/ui, mapa MapLibre con worker local, panel Landsat, comparación FAO, controles y service worker offline. Endpoint selecciona afirmaciones verificadas con salida Zod; fallback cliente/servidor. `web/app/`, `web/components/`, `web/lib/`, `web/scripts/`, configuración web, `docs/METHODOLOGY.md` | Compilación TypeScript, lint y pruebas locales; revisión humana de Frainer pendiente. |

| 14-11-2026 | Codex (OpenAI) | Verificación final, documentación de ejecución/Vercel y límites científicos; `README.md`, `docs/05_arquitectura.md`, pruebas `web/tests/`, `web/lib/scoring.test.ts` y `scripts/test_pipeline.py`. Correcciones verificadas de worker MapLibre, captura WebGL y recarga offline de chunks/favicon. | Build y lint sin errores/advertencias; 4 pruebas TS, 3 Python y 3 navegador pasan. Build aislado solo `web/` y endpoint con/sin clave comprobados. Revisión humana de Frainer pendiente. |

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
