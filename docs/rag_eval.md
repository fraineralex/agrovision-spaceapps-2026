# Evaluación RAG (texto) — 2026-11-15

Modelo de texto: `anthropic/claude-haiku-5.5` (Vercel AI Gateway). Embeddings: `google/gemini-embedding-2` (índice `web/data/rag-index.json`, 56 fragmentos, ~1,60 MB, 15 archivos fuente). Entrada de finca de prueba: `demo-01`, noviembre, riego, anterior arroz. Evaluación ejecutada contra `npm run start` local con `AI_GATEWAY_API_KEY` (sin imprimir clave). Revisión humana por Frainer: pendiente.

| Pregunta | Juicio de grounding | Respuesta resumida | Fuentes recuperadas |
|---|---|---|---|
| ¿Cuándo siembro habichuela en San Juan? | Bueno: cita ventana IDIAF nov–dic con advertencia de fecha; no cambia recomendación de pantalla. | Ventana de siembra y consulta al técnico. | Equipo AgroVision, AgroVision, rotaciones |
| ¿Puedo sembrar papa después de papa? | Bueno: declara sin dato verificado; no inventa rotación. | Frase estándar sin dato; guías no cubren papa. | Equipo, asesor, MA costos |
| ¿Qué dice la NASA de la lluvia en mi zona? | Parcial: Haiku devolvió cuerpo vacío; servidor aplica resumen desde primer fragmento (no es respuesta NASA específica). | Texto genérico del resumen del equipo, no datos POWER. | resumen_equipo, recursos, water-climate |
| ¿Cuánto cuesta sembrar una tarea de arroz? | Bueno: sin cifra; remite a técnico y aclara ausencia de arroz en costos 2019. | Sin número inventado. | Ministerio de Agricultura RD |
| ¿Qué le echo al tizón de la papa? | Bueno: sin plaguicida ni dosis. | Sin dato verificado; técnico/IDIAF. | Equipo, asesor, MA |
| ¿De dónde sacan los precios? | Bueno: alinea con CSV MA, período y límites mayoristas SD. | Ministerio, transparencia, reglas de limpieza. | MA README, asesor, market-insights |

## Notas

- Las recomendaciones de siembra en pantalla siguen siendo deterministas (`web/lib/advisor.ts`); el RAG no altera puntajes.
- Respuestas con contexto RAG fuerte usan ruta no streaming cuando Haiku devuelve cuerpo vacío (p. ej. lluvia NASA); conviene ampliar corpus POWER explícito y revisar prompt.
- Si el corpus crece, se puede mover el índice a Turso (`F32_BLOB` + `vector_top_k`); hoy solo JSON versionado.
- Reproducir: `cd web && npx tsx scripts/build-rag-index.ts` (requiere `AI_GATEWAY_API_KEY`) y `AGROVISION_URL=http://localhost:3000 npx tsx scripts/rag-eval-local.ts` con `npm run start` y la misma clave en el entorno del servidor.

## Próximo corpus sugerido

- `docs/11_water_climate_method.md` y muestras en `data/cache/power/` / `web/public/data/power/` (texto sobre PRECTOTCORR y límites regionales).
- Calendarios y ventanas en `web/public/data/market-insights.json` (`nationalSowing`) y reglas de rotación en `web/lib/advisor.ts` / `web/lib/pests.ts` (exportados como notas verificadas, no código).
- Guía IDIAF de habichuela citada en inventario (solo si el PDF o extracto autorizado ya está en repo).
- Tabla de costos 2019 por cultivo en `market-insights.json` (más cultivos con unidades claras).