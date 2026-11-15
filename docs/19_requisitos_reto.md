# 19 · Requisitos del reto frente a AgroVision (15-11-2026)

Revisión hecha con Claude (Anthropic) contra el enunciado guardado en `docs/01_reto.md`. La página oficial del reto no se pudo leer de forma automática (el sitio bloquea robots), así que se usó la copia del equipo.

| Requisito del enunciado | Estado | Dónde se cumple |
|---|---|---|
| Herramienta de apoyo a decisiones para explorar rotaciones | Cumple | Pestaña Siembra: recomendación, “Otras opciones” y “Rotación y suelo”. |
| Usa observaciones de la Tierra de la NASA | Cumple | NASA POWER (clima normal y respaldo de lluvia), NASA GIBS (MODIS, IMERG) en el mapa. También FAO GIEWS y Sentinel-2. |
| Información local de suelo | Parcial (nuevo) | El agricultor declara cómo es su tierra (arenosa, media o barro) y la app explica cómo guarda el agua (FAO, manual de riego n.º 1, cap. 2). No hay medición ni mapa de suelos. |
| Características de los cultivos | Cumple | Demanda de agua y ciclo (FAO-56), familia del cultivo para la rotación, plagas (IDIAF/CEDAF), precio (Ministerio de Agricultura). |
| Prioridades del agricultor | Cumple | “Otras opciones” ordena por lo que más importa: menos agua, precio, plagas, sequía o seguir igual. Riego y cultivo anterior se declaran en el registro. |
| Rotaciones que fortalezcan la salud del suelo | Cumple (nuevo) | Sección “Rotación y suelo”: nutrientes, nitrógeno de las leguminosas, materia orgánica y plagas, con fuentes de la FAO. Cada cultivo dice si es bueno para la tierra o la cansa. |
| Comparar al menos tres estrategias, incluida la rotación actual | Cumple (reforzado) | “Otras opciones” muestra siempre al menos dos alternativas y “Seguir igual”. Si todos los objetivos apuntan al mismo cultivo, se añade “Otra opción”. Hay prueba unitaria. |
| Para cada una: por qué se sugiere | Cumple | Botón “¿Por qué?” con explicación corta. |
| Para cada una: evidencia | Cumple | Detalle con fuentes y enlaces por agua, sequía, suelo, plagas y precio. |
| Para cada una: beneficios potenciales | Cumple | Explicación corta (“sale bien porque…”, “para la tierra…”). |
| Para cada una: brechas de información | Cumple (nuevo) | Línea “Lo que no sabemos” en cada explicación. |
| Para cada una: riesgos que requieren revisión local | Cumple | “Qué revisar”, precauciones de plagas y “confírmalo con tu técnico”. |
| Apoya, no sustituye, el juicio del agricultor | Cumple | Aviso en la recomendación, en cada explicación y al pie. |

## Lo que no cubre (opcional en el enunciado)

- SMAP, ECOSTRESS, GRACE y SRTM no se usan.
- No se muestran periodos de suelo desnudo ni erosión.
- El suelo es declarado por el agricultor: no hay análisis ni mapa de suelos.
- La nota de rotación y suelo es una regla general de la FAO. No cambia las estrellas.
