# Evaluación de tono RAG — trabajo en curso

<!-- AI: Codex (OpenAI), 2026-11-15; revisión por Frainer pendiente. -->

Evaluación manual exploratoria del canal real de texto con Gateway y selección demo de noviembre, arroz anterior y riego. Puntuación global 1–5 considerando lenguaje, brevedad, fundamento, pertinencia, tono y fuente. No es validación agronómica. Voz en tiempo real no evaluada: el intento desde Node no abrió el WebSocket. Rondas 3–5 pendientes; no se alcanzó el umbral solicitado.

El promedio anterior de R1 se había anotado como 1,27; las 15 notas registradas suman 18, por lo que el promedio corregido es 1,20.

La nota es una valoración manual global (1–5), no una media automática de criterios; un error factual o una respuesta truncada reduce la nota. La misma selección demo (noviembre, arroz anterior, riego) se usó en todas las preguntas. Las rondas 4–7 repiten la misma versión para observar variación; no son cambios independientes. Ronda 8 prueba la corrección de atribución del clima. Respuestas completas: `docs/rag_tone_answers.json` (no se conserva la ronda 1 completa).

| Pregunta | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ¿Qué siembro después de habichuela? | 1 | 3 | 3 | 4 | 4 | 4 | 4 | 4 |
| ¿Cuándo puedo sembrar papa en Constanza? | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| ¿Va a llover esta semana? | 2 | 2 | 4 | 4 | 4 | 4 | 4 | 4 |
| ¿Cuánto voy a ganar con diez tareas de maíz? | 1 | 2 | 3 | 4 | 4 | 4 | 3 | 3 |
| Tengo bichitos en la habichuela, ¿qué les echo? | 1 | 4 | 4 | 3 | 3 | 3 | 3 | 4 |
| ¿Puedo poner papa después de papa? | 1 | 3 | 4 | 3 | 4 | 3 | 4 | 4 |
| Oiga, ¿qué me recomienda sembrar ahora? | 1 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| ¿La tierra descansa si pongo guandul? | 1 | 3 | 3 | 2 | 3 | 2 | 2 | 2 |
| ¿Cuánta agua necesita el arroz? | 1 | 1 | 1 | 4 | 4 | 4 | 3 | 4 |
| ¿A cómo voy a vender la habichuela? | 1 | 4 | 3 | 2 | 1 | 2 | 2 | 2 |
| Se me están poniendo amarillas las hojas, ¿qué hago? | 1 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| ¿De dónde salen esos datos de lluvia? | 1 | 2 | 1 | 1 | 1 | 1 | 2 | 4 |
| ¿Qué puedo sembrar si no tengo riego? | 1 | 1 | 1 | 4 | 4 | 4 | 4 | 4 |
| Quiero sembrar abichuela, ¿en qué mes? | 1 | 3 | 3 | 3 | 1 | 1 | 1 | 2 |
| ¿Y si se me seca la tierra? | 1 | 2 | 3 | 2 | 3 | 3 | 3 | 3 |
| **Promedio** | 1.20 | 2.60 | 2.80 | 3.00 | 3.00 | 2.93 | 2.93 | 3.27 |

La prueba de voz en tiempo real previa no logró abrir WebSocket. Se probaron las instrucciones de voz por texto con el modelo de texto y la herramienta de búsqueda de guías; no estaban disponibles las otras herramientas en ese arnés. No prueba audio, interrupciones ni equivale al modelo realtime. La muestra produjo una estimación de ingresos basada en datos históricos y recomendaciones incompatibles con la selección, por lo que no se considera aprobada. La instrucción posterior contra cálculos de ingresos aún no se ha evaluado en voz.

Persisten fallos: atribuciones erróneas en rondas 3–7, cifras irrelevantes, recomendaciones de agua, fechas nacionales usadas para una pregunta local, respuestas truncadas en rondas 5–7 y una respuesta sin dato en ronda 8 para habichuela. La ronda 8 atribuye correctamente el clima demo a NASA POWER, pero no alcanza el umbral. No es validación agronómica; revisión de Frainer pendiente.
