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

| 14-11-2026 | Codex (OpenAI) | Regla de commits pequeños, ingesta Sentinel-2/WorldCover, segmentación, features, RandomForest y evaluación espacial de etiquetas débiles | `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/agrovision.mdc`, `scripts/ml/`, `data/cache/ml/`, `data/derived/`, `data/model/`, `.gitignore`, `AI_USAGE.md` | Pendiente de revisión por Frainer; no implica validación agronómica |
| 14-11-2026 | Codex (OpenAI) | Features NDVI mensuales sin imputación, segmentación SLIC y reglas débiles explícitas | `scripts/ml/features.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | RandomForest con holdout por bloques de 1 km y separación de 100 m; sin validación de campo | `scripts/ml/train.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Exportador offline con metadatos del plan técnico, GeoJSON, reporte y figura de confianza | `scripts/ml/run.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Restringir inferencia al dominio agrícola WorldCover; separar entrenamiento demostrativo de métricas ausentes por escasez de secano | `scripts/ml/features.py`, `scripts/ml/train.py`, `scripts/ml/run.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Reportar acuerdo descriptivo con soporte explícito incluso cuando la clase rara solo tiene dos muestras de prueba; GeoJSON compacto y bbox calculado | `scripts/ml/train.py`, `scripts/ml/run.py`, `scripts/ml/common.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Pruebas de radiometría, faltantes, dominio agrícola, ausencia de etiquetas y separación espacial; validador de artefactos reales | `scripts/ml/test_pipeline.py`, `scripts/ml/validate.py`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
| 14-11-2026 | Codex (OpenAI) | Documentación reproducible de fuentes/licencias, contrato UI, límites de etiquetas débiles y comandos offline | `scripts/ml/README.md`, `AI_USAGE.md` | Pendiente de revisión por Frainer |
