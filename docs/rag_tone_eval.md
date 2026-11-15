# Evaluación de tono RAG — trabajo en curso

<!-- AI: Codex (OpenAI), 2026-11-15; revisión por Frainer pendiente. -->

Evaluación manual exploratoria del canal real de texto con Gateway y selección demo de noviembre, arroz anterior y riego. Puntuación global 1–5 considerando lenguaje, brevedad, fundamento, pertinencia, tono y fuente. No es validación agronómica. Voz en tiempo real no evaluada: el intento desde Node no abrió el WebSocket. Rondas 3–5 pendientes; no se alcanzó el umbral solicitado.

| Pregunta | Ronda 1 | Ronda 2 |
|---|---:|---:|
| ¿Qué siembro después de habichuela? | 1 | 3 |
| ¿Cuándo puedo sembrar papa en Constanza? | 3 | 3 |
| ¿Va a llover esta semana? | 2 | 2 |
| ¿Cuánto voy a ganar con diez tareas de maíz? | 1 | 2 |
| Tengo bichitos en la habichuela, ¿qué les echo? | 1 | 4 |
| ¿Puedo poner papa después de papa? | 1 | 3 |
| Oiga, ¿qué me recomienda sembrar ahora? | 1 | 2 |
| ¿La tierra descansa si pongo guandul? | 1 | 3 |
| ¿Cuánta agua necesita el arroz? | 1 | 1 |
| ¿A cómo voy a vender la habichuela? | 1 | 4 |
| Se me están poniendo amarillas las hojas, ¿qué hago? | 1 | 4 |
| ¿De dónde salen esos datos de lluvia? | 1 | 2 |
| ¿Qué puedo sembrar si no tengo riego? | 1 | 1 |
| Quiero sembrar abichuela, ¿en qué mes? | 1 | 3 |
| ¿Y si se me seca la tierra? | 1 | 2 |
| **Promedio** | **1,27** | **2,60** |

La primera ronda devolvió encabezados de corpus en 13 respuestas: el modelo agotó los 240 tokens de salida en razonamiento, dejando la respuesta vacía y activando un respaldo que copiaba el fragmento. La segunda usó un presupuesto mayor, contexto más corto y respaldo sin copia; eliminó ese fallo en esta muestra, pero produjo afirmaciones cuestionables, información irrelevante y listas largas. Por ejemplo, dijo que el arroz pedía poca agua y luego citó una guía que indica riego. La respuesta sobre papa en Constanza presenta un histórico nacional, no una fecha local; necesita revisión. Las instrucciones ajustadas después de la ronda 2 aún no se han evaluado.
