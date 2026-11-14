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

JSON, GeoJSON, imágenes originales, lockfiles y configuraciones sin comentarios admitidos se atribuyen en este registro y en `docs/DATA_SOURCES.md`. Las imágenes GIBS y respuestas de satélite son datos reales de terceros; IA asistió el código y documentación, no generó valores observados. Ninguna salida nueva se declara revisada por Frainer sin confirmación.
