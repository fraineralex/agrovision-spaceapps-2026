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
- Turso ofrece recuperación vectorial cuando está configurado; el JSON versionado conserva el fallback offline.
- Reproducir: `cd web && npx tsx scripts/build-rag-index.ts` (requiere `AI_GATEWAY_API_KEY`) y `AGROVISION_URL=http://localhost:3000 npx tsx scripts/rag-eval-local.ts` con `npm run start` y la misma clave en el entorno del servidor.

## Próximo corpus sugerido

- `docs/11_water_climate_method.md` y muestras en `data/cache/power/` / `web/public/data/power/` (texto sobre PRECTOTCORR y límites regionales).
- Calendarios y ventanas en `web/public/data/market-insights.json` (`nationalSowing`) y reglas de rotación en `web/lib/advisor.ts` / `web/lib/pests.ts` (exportados como notas verificadas, no código).
- Guía IDIAF de habichuela citada en inventario (solo si el PDF o extracto autorizado ya está en repo).
- Tabla de costos 2019 por cultivo en `market-insights.json` (más cultivos con unidades claras).
## Preguntas nuevas para la ronda de guías CEDAF (2026-11-15)

Corrida real contra instancia local iniciada desde el build actual en `http://localhost:3467` con AI Gateway habilitado. Clasificación manual de la respuesta y fuentes del header `X-AgroVision-Sources`; revisión por Frainer pendiente.

| Pregunta | Resultado | Fuente esperada |
|---|---|---|
| ¿Qué cubre la guía dominicana de arroz y qué debo verificar antes de seguir sus consejos? | Grounded: enumera temas cubiertos, fecha 2010 y vigencia/localización que se debe verificar. | CEDAF (chunk 000), Inventario, Asesor |
| ¿Qué meses recomienda la guía CEDAF para sembrar guandul Kaki o Pinto Villalba en zonas bajas? | Grounded: junio–agosto, hasta 600 m; avisa que es una fuente histórica dependiente de zona/variedad. | CEDAF (chunk 002), costos MA, Inventario |
| ¿Cuándo se cosecha normalmente el guandul fotosensitivo según esa guía? | Grounded: floración nov–dic y cosecha ene–mar, con límite de zona/variedad. | CEDAF (chunk 002), Asesor, MA |
| ¿Qué orientación ofrece CEDAF para sembrar el guandul UASD? | Grounded: abril al inicio de lluvias; con riego ene–mar; aconseja confirmar localmente. | CEDAF (chunk 002), Inventario, Resumen |
| ¿Qué temas trata la guía de habichuela del CEDAF? | Sin grounding fiable: fallback reproduce cabecera extensa del corpus; no respondió los temas de la ficha. | CEDAF corpus, Inventario, Resumen |
| ¿Puedo usar esa guía de habichuela de 1995 para elegir un plaguicida registrado hoy? | Parcial: dice que no tiene dato verificado y deriva a técnico; inventario recuperado distingue guía IDIAF 2013, no la ficha CEDAF. | CEDAF corpus, Pilares, Inventario, Asesor |
| ¿CEDAF tiene una guía técnica de plátano y otra de yuca? | Grounded como referencia bibliográfica, aclara que no tiene instrucciones de manejo extraídas. | CEDAF catálogo, Inventario, Resumen |

La evaluación se ejecutó contra instancia en `http://localhost:3467`, con el índice de 62 fragmentos (google/gemini-embedding-2). Hubo fallos HTTP 500 intermitentes y fallback que reproduce una cabecera en preguntas de habichuela; no se cuentan como respuestas grounded. La recuperación en las preguntas de fechas del guandul y referencias de plátano/yuca sí incluyó el nuevo documento CEDAF.

## Preguntas de esta ronda: IDIAF y datos NASA (2026-11-15)

Consultas corridas por `web/scripts/rag-eval-local.ts` contra el servidor local con el índice nuevo y AI Gateway. Grounding clasificado según la respuesta visible y las fuentes del header; la revisión de Frainer queda pendiente.

| Pregunta | Resultado | Fuente esperada |
|---|---|---|
| ¿Cuánta semilla por tarea y qué distancia entre hileras recomienda el IDIAF para habichuela? | Retrieval: grounded; tras registrar la ficha de prácticas, aparece primera (score 0.779) | Compendio IDIAF, 2013 |
| ¿Qué prácticas de manejo de enfermedades y plagas describe el compendio IDIAF de habichuela? | Retrieval: grounded (fragmentos MIP IDIAF en top 3) | Compendio IDIAF, 2013 |
| ¿Qué manejo del mosaico dorado describe el compendio y de qué año es la guía? | Retrieval: débil; top 3 no incluye un fragmento IDIAF útil | Compendio IDIAF, 2013 |
| ¿Qué mide IMERG y qué unidad debo revisar antes de leer la lluvia? | Retrieval: grounded (NASA en top 3) | NASA GPM IMERG / NASA POWER |
| ¿SMAP me dice la humedad de mi parcela y de qué tamaño es aproximadamente el píxel? | Retrieval: grounded (NASA en top 3) | NASA POWER fuentes hidrológicas / SMAP |
| ¿Qué significa una imagen de Landsat o GIBS para mi cultivo y cuáles son sus límites? | Retrieval: parcial; NASA aparece pero el chunk superior es SMAP, no sección Landsat/GIBS | NASA Landsat / NASA Earthdata GIBS |
| ¿Cuándo siembro habichuela en San Juan? | Retrieval: parcial; IDIAF aparece en top 3 pero el primer resultado trata guandul | Compendio IDIAF y contexto piloto |
| ¿Qué dice la NASA de la lluvia en mi zona? | Retrieval: grounded (NASA guía aparece primero) | NASA POWER / IMERG y límites documentados |

El compendio IDIAF se redistribuye con el permiso impreso en su página legal (“puede ser reproducido […] siempre y cuando no se altere su contenido”), con cita bibliográfica en el TXT extraído y vínculo al PDF original. El PDF se conserva en `data/rag-corpus/`.

La ruta de voz de esta rama produjo respuestas vacías/intermitentes sin headers de fuentes en 11 consultas; no se califican esas salidas como grounding del modelo. La recuperación directa mediante `retrieveRag` se ejecutó contra AI Gateway y se reporta arriba, pero las pruebas de respuesta de extremo a extremo siguen pendientes. Se detectó que la conversión lineal del PDF deja pies de figuras dentro del texto; el índice también incluye un extracto de prácticas cuidadosamente atribuido y advierte que son recomendaciones de 2013. La ficha IDIAF de prácticas quedó registrada en `corpusDocs` en el commit correctivo posterior al primer preview.

## Fuentes útiles que quedan pendientes

- Guías IDIAF/CEDAF con contenido agronómico verificable para papa, tomate, ajo, cebolla, zanahoria, batata, maíz y plátano: variedades, semilla/espaciamiento, fertilización, MIP vigente y poscosecha.
- Fuentes vigentes de crédito Banco Agrícola, programas FEDA y seguro agropecuario ADESA.
- ONAMET/INDRHI: preparación ante huracanes y sequía, alertas e irrigación.
- Costos recientes por tarea y series oficiales de siembra/cosecha y estacionalidad.
- Revisar con Frainer el grounding de calendario/MIP IDIAF y NASA GIBS/Landsat; arreglar retrieval semántico de las secciones del compendio y evaluación de la respuesta de voz.



## Almacenamiento vectorial en Turso

El índice fuente sigue siendo `web/data/rag-index.json` (62 fragmentos, 3072 dimensiones). La app usa Turso cuando están configurados `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`; si faltan o la consulta falla, recupera exactamente desde el índice JSON. Se mantiene `RAG_MIN_SCORE` (coseno ≥ 0.38), `RAG_TOP_K` (5) y el formato de fragmentos existente.

Para volver a cargar el índice, desde `web/` exporta las credenciales sin imprimirlas y ejecuta:

```sh
set -a
source /home/box/secrets/agrovision-turso.env
set +a
npm run rag:upload
```

El comando crea la tabla `rag_chunks` y su índice vectorial si hacen falta, hace upsert por ID, elimina filas que ya no estén en el JSON y termina verificando que el total de filas coincida. La salida solo informa conteos. Si se regenera `data/rag-index.json`, vuelve a ejecutar la carga.

### Comparación del 15-11-2026

Se ejecutaron las seis preguntas del script de evaluación contra dos instancias del mismo build e índice de 62 fragmentos: una configurada para Turso y otra usando el fallback JSON. Las seis recuperaron exactamente el mismo conjunto de títulos de fuente y ambas devolvieron cuerpo de respuesta no vacío. Esto verifica paridad de recuperación/fuentes; no cambia la revisión humana de grounding, que sigue pendiente.

| Pregunta | Fuentes recuperadas (Turso = JSON) |
|---|---|
| ¿Cuándo siembro habichuela en San Juan? | CEDAF Cultivo de Habichuela; Guías CEDAF de arroz y guandul; Inventario de datos; Recursos de datos |
| ¿Puedo sembrar papa después de papa? | Asesor de siembra y mercado; CEDAF guías técnicas de plátano y yuca; Guías CEDAF de arroz y guandul; Mercado y costos 2019; Resumen del equipo |
| ¿Qué dice la NASA de la lluvia en mi zona? | Agua y clima; Inventario de datos; Recursos de datos; Resumen del equipo |
| ¿Cuánto cuesta sembrar una tarea de arroz? | Guías CEDAF de arroz y guandul; Mercado y costos 2019; Resumen del equipo |
| ¿Qué le echo al tizón de la papa? | CEDAF Cultivo de Habichuela; CEDAF guías técnicas de plátano y yuca; Guías CEDAF de arroz y guandul; Resumen del equipo |
| ¿De dónde sacan los precios? | Asesor de siembra y mercado; Mercado y costos 2019; Precios mayoristas MA; Resumen del equipo |

## Preguntas nuevas: rotaciones y asociaciones de cultivos (2026-11-15)

Se ejecutaron cinco preguntas para comprobar principios generales, leguminosas, pausas entre hospedadores, distinción entre rotación y asociación y límites al trasladar recomendaciones extranjeras. La recuperación y las respuestas se probaron con el índice JSON de 130 fragmentos en un build local (`http://localhost:3467`), AI Gateway habilitado y Turso desactivado para comprobar el fallback local. Revisión agronómica por Frainer pendiente.

| Pregunta | Fuentes esperadas | Resultado |
|---|---|---|
| ¿Qué beneficios puede aportar alternar familias botánicas y raíces de distinta profundidad en una rotación? | Best4Soil, Ekonekazaritza, Universidad de Chile y Sekhar fueron los cuatro primeros resultados (0.70–0.74). La respuesta cayó al respaldo “sin dato” porque el proveedor no produjo texto. | Recuperación pertinente; respuesta generada incompleta. |
| ¿Qué papel pueden tener las leguminosas en una rotación y qué condiciones hacen incierto el aporte al cultivo siguiente? | Universidad de Chile, Ekonekazaritza, Best4Soil y Sekhar (0.65–0.70). Respaldo “sin dato” por respuesta automática no disponible. | Recuperación pertinente; respuesta generada incompleta. |
| ¿Cómo ayuda alternar cultivos hospedadores y no hospedadores, y puedo aplicar a San Juan los intervalos europeos de Best4Soil? | Best4Soil primero (0.74), seguido de Universidad de Chile y Ekonekazaritza. Respaldo “sin dato” por respuesta automática no disponible. | Recuperación pertinente; no ofrece respuesta sobre transferencia de intervalos. |
| ¿Cuál es la diferencia entre rotación y asociación de cultivos? | Ekonekazaritza primero (0.71) y Sekhar segundo (0.69). La respuesta distinguió sucesión temporal de cultivo simultáneo y mencionó diseños y necesidades de planificación. | Grounded y sustantiva en esta corrida. |
| ¿Qué debo revisar antes de probar una asociación de cereal y leguminosa en una finca tropical pequeña? | Sekhar y Ekonekazaritza primero, además de CEDAF y Best4Soil (0.63–0.68). La respuesta usó el respaldo “sin dato” pese al contexto recuperado. | Recuperación pertinente; respuesta generada incompleta. |

La carga a Turso (`npm run rag:upload`) y un reintento diagnóstico de esta sesión fallaron con `fetch failed`. Una lectura posterior encontró 151 filas y los cuatro IDs `rotation-*`, pero ese total no coincide con el índice JSON local (130). Hubo carga concurrente en la base compartida, así que la presencia de los cuatro IDs no se atribuye a esta invocación ni confirma paridad de versiones. Esta evaluación mide el fallback JSON. Una pregunta obtuvo respuesta sustantiva; en tres el proveedor no produjo texto y el endpoint devolvió su respaldo; en otra, el modelo dijo no tener el dato pese a recuperar contexto pertinente. La recuperación funcionó, pero la generación fue irregular.
