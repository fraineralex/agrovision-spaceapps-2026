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

JSON, GeoJSON, imágenes originales, lockfiles y configuraciones sin comentarios admitidos se atribuyen en este registro y en `docs/DATA_SOURCES.md`. Las imágenes GIBS y respuestas de satélite son datos reales de terceros; IA asistió el código y documentación, no generó valores observados. Ninguna salida nueva se declara revisada por Frainer sin confirmación.

## Integración de esta rama

| Fecha | Herramienta | Propósito y archivos | Revisión |
|---|---|---|---|
| 14-11-2026 | Codex (OpenAI) | Resolución del conflicto en `AI_USAGE.md` conservando las contribuciones de main y mercado/envío; actualización de la base sin editar `web/` ni `scripts/ml/` | Pendiente: Frainer |

| 14-11-2026 | Codex (OpenAI) | Reconciliación de materiales de envío con los nuevos artefactos POWER/Landsat/GIBS/FAO de main y el modelo configurado `openai/gpt-4.1-mini`; aclaración de mercado aún sin integración web | `docs/submission/nasa_data_used.md`, `docs/submission/ai_disclosure.md`, `docs/submission/project_summary.md`, `docs/submission/README.md`, `docs/submission/slides_outline.md`, `docs/DATA_SOURCES.md`, `docs/METHODOLOGY.md`, `AI_USAGE.md`; revisión de Frainer pendiente |
