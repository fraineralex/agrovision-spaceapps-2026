# Evaluación RAG (texto) — 2026-11-15

Modelo de texto: `anthropic/claude-haiku-5.5` (Vercel AI Gateway). Embeddings: `google/gemini-embedding-2` (índice `web/data/rag-index.json`, 56 fragmentos, ~1,52 MB). Entrada de finca de prueba: `demo-01`, noviembre, riego, anterior arroz. Revisión humana por Frainer: pendiente.

| Pregunta | Juicio de grounding | Respuesta resumida | Fuentes recuperadas |
|---|---|---|---|
| ¿Cuándo siembro habichuela en San Juan? | Parcial: cita IDIAF/compendio en contexto de inventario, no un calendario verificado en el índice de cultivos; aún útil como orientación con advertencia. | Ventana nov–dic mencionada con llamado a confirmar con técnico. | Equipo AgroVision, AgroVision (varios) |
| ¿Puedo sembrar papa después de papa? | Bueno: no inventa rotación; dice sin dato verificado. | No confirma papa; remite a técnico. | Equipo AgroVision, AgroVision, MA |
| ¿Qué dice la NASA de la lluvia en mi zona? | Falla de generación: Haiku devolvió cuerpo vacío con contexto recuperado; aplica resumen determinista desde el primer fragmento (POWER regional ~50 km, límites). | No pronóstico ni medición de finca. | Equipo AgroVision, AgroVision, FAO GIEWS |
| ¿Cuánto cuesta sembrar una tarea de arroz? | Bueno: no inventa cifra; remite a costos 2019 / técnico. | Sin número en respuesta. | Ministerio de Agricultura RD |
| ¿Qué le echo al tizón de la papa? | Bueno: sin plaguicida ni dosis. | No dato verificado; IDIAF/técnico. | Equipo AgroVision, MA, AgroVision |
| ¿De dónde sacan los precios? | Bueno: alinea con CSV MA y límites mayoristas SD. | Ministerio mayorista 2017–2026, no finca. | MA (README + asesor + insights) |

## Notas

- Las recomendaciones de siembra en pantalla siguen siendo deterministas (`web/lib/advisor.ts`); el RAG no altera puntajes.
- Si el corpus crece, se puede mover el índice a Turso (`F32_BLOB` + `vector_top_k`); hoy solo JSON versionado.
- Reproducir: `cd web && npx tsx scripts/build-rag-index.ts` (requiere `AI_GATEWAY_API_KEY`) y `npx tsx scripts/rag-eval-local.ts` con `npm run start`.