# Evaluación RAG (texto) — 2026-11-15

Modelo de texto: `anthropic/claude-haiku-5.5` (Vercel AI Gateway). Embeddings: `google/gemini-embedding-2` (índice `web/data/rag-index.json`, 56 fragmentos, ~1,60 MB, 15 archivos fuente). Entrada de finca de prueba: `demo-01`, noviembre, riego, anterior arroz. Corrida directa contra `http://localhost:3456` con AI Gateway habilitado; sin imprimir la clave. Revisión humana por Frainer: pendiente.

| Pregunta | Juicio de grounding | Respuesta resumida | Fuentes recuperadas |
|---|---|---|---|
| ¿Cuándo siembro habichuela en San Juan? | Parcial: menciona compendio IDIAF y ventana 5 nov–15 dic, pero el fragmento recuperado es inventario del equipo, no fuente primaria. Salida se truncó. | “Según el Compendio de habichuela del IDIAF, en el Valle de San Juan la siembra va del 5 de noviembre al 15 de diciembre. Ese compendio es de 2…” | Inventario, Recursos de datos, Agua y clima, Rotaciones San Juan, Resumen equipo |
| ¿Puedo sembrar papa después de papa? | Sin dato para papa; prudente, pero agrega la recomendación actual (maíz después de arroz), que no responde esa consulta. | “No tengo ese dato verificado. Consulta a tu técnico agrícola o a IDIAF. La papa no está entre los cultivos que evalúa AgroVision, así que no puedo darte una respuesta sobre sembrarla después de papa. Para tu finca, la recomendación calculada sigue siendo maíz después de arroz.” | Resumen equipo, asesor, costos 2019, FAO-56 |
| ¿Qué dice la NASA de la lluvia en mi zona? | Fallo: respuesta real del Gateway vacía, pese a recuperar contexto pertinente. No existe respuesta utilizable. | (cuerpo vacío) | Resumen equipo, Recursos, Inventario, Agua y clima |
| ¿Cuánto cuesta sembrar una tarea de arroz? | Sin cifra inventada; respuesta dice que las guías no incluyen el costo por tarea. | “No tengo ese dato verificado. Consulta a tu técnico agrícola o a IDIAF. Las guías que tengo no traen el costo de sembrar una tarea de arroz.” | Costos 2019, Resumen equipo |
| ¿Qué le echo al tizón de la papa? | No prescribe producto/dosis, pero afirma que el técnico puede indicar qué producto y dosis; requiere corregir ese consejo para enfocarlo en diagnóstico. | “No tengo ese dato verificado. Consulta a tu técnico agrícola o a IDIAF. Ellos pueden revisar tu cultivo y decirte qué producto usar y en qué dosis.” | Resumen equipo, costos 2019, asesor |
| ¿De dónde sacan los precios? | Bien delimitada: Ministerio, rango temporal de observaciones y referencia mayorista de Santo Domingo, no precio recibido en finca. | “Los precios vienen del Ministerio de Agricultura de República Dominicana, de su catálogo de Transparencia, con observaciones mayoristas de agosto de 2017 a octubre de 2026. Son una referencia de mayorista en Santo Domingo, no lo que recibe el productor en su finca.” | Precios MA, asesor, Resumen equipo, costos 2019 |

Resumen de esta corrida: 5 respuestas no vacías; 1 fallo vacío. A juicio manual pendiente de revisión, 1 respuesta bien grounded, 2 parciales, 2 sin dato resoluble y 1 fallo de generación.

## Notas

- Las recomendaciones de siembra en pantalla siguen siendo deterministas (`web/lib/advisor.ts`); el RAG no altera puntajes.
- Cuando Haiku devuelve cuerpo vacío, la API usa resumen determinista del fragmento mejor clasificado; una respuesta de esta corrida mostró que ese fragmento puede no contestar la pregunta. Se ajustó el texto de salida para hacer explícito que no se generó respuesta y pedir revisar fuentes. Conviene ampliar corpus POWER explícito y revisar el prompt.
- Si el corpus crece, se puede mover el índice a Turso (`F32_BLOB` + `vector_top_k`); hoy solo JSON versionado.
- Reproducir: `cd web && npx tsx scripts/build-rag-index.ts` (requiere `AI_GATEWAY_API_KEY`) y `AGROVISION_URL=http://localhost:3000 npx tsx scripts/rag-eval-local.ts` con `npm run start` y la misma clave en el entorno del servidor.

## Próximo corpus sugerido

- `docs/11_water_climate_method.md` y muestras en `data/cache/power/` / `web/public/data/power/` (texto sobre PRECTOTCORR y límites regionales).
- Calendarios y ventanas en `web/public/data/market-insights.json` (`nationalSowing`) y reglas de rotación en `web/lib/advisor.ts` / `web/lib/pests.ts` (exportados como notas verificadas, no código).
- Guía IDIAF de habichuela citada en inventario (solo si el PDF o extracto autorizado ya está en repo).
- Tabla de costos 2019 por cultivo en `market-insights.json` (más cultivos con unidades claras).