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

Herramientas adicionales que deben reconciliarse antes del envío: **Grok (xAI)** fue nombrada por el usuario como herramienta usada; propósito, modelo, fechas, archivos y revisión están pendientes de confirmación del equipo. **Vercel AI Gateway / AI SDK** y sus modelos son parte de la arquitectura opcional documentada; llamadas efectivas, proveedor/modelo, archivos y revisión no se verificaron en esta rama. No se registran como ejecuciones realizadas por esta sesión. Los modelos de clasificación de imágenes requieren su propia entrada del responsable de ML cuando se conozca qué se ejecutó. Detalle público en `docs/submission/ai_disclosure.md`.

Los registros anteriores se conservan como historial declarado por el equipo; esta sesión no verificó esas revisiones.

Cada PR que use IA debe añadir una fila a esta tabla con fecha, herramienta, propósito y archivos afectados; indicar una persona que revisó el resultado. Si una herramienta no generativa también asistió materialmente, documentarla.

La presentación o video final debe incluir una diapositiva que explique para qué se usó IA y cómo se revisaron sus salidas. La IA no reemplaza validación agrícola ni revisión de fuentes.
