# 01. Reto

## Enunciado completo

> Farmers around the world navigate shifting temperatures, changing rainfall patterns, water shortages, extreme weather, and declining soil health. These pressures make it difficult to choose crop rotations that protect fields, conserve water, and support long-term resilience. Your challenge is to create a decision-support tool that uses NASA Earth observations along with local soil information, crop characteristics, and farmer priorities to help farmers explore rotation strategies that could strengthen soil health and adapt their farms to changing conditions.

Traducción de trabajo: agricultores de todo el mundo afrontan cambios de temperatura y lluvia, escasez de agua, fenómenos extremos y deterioro del suelo. El reto consiste en crear una herramienta de apoyo a decisiones que combine observaciones terrestres de NASA con información local de suelo, características de cultivos y prioridades del agricultor para explorar rotaciones que fortalezcan el suelo y ayuden a adaptarse.

## Antecedentes

La variabilidad climática, la erosión, el agotamiento de nutrientes y los extremos meteorológicos complican la selección de cultivos. Una opción que mejora el suelo en un lugar puede consumir demasiada agua, favorecer enfermedades, no tener mercado o quedar fuera de la temporada en otro. El reto se inspira en experiencia agrícola multigeneracional y en la posibilidad de convertir series ambientales de NASA en información práctica.

## Objetivos

Se puede crear una aplicación, modelo, mapa interactivo u otra herramienta para explorar rotaciones que puedan mejorar la salud del suelo y la resiliencia ante cambios de tiempo y agua. Entre los datos posibles están SMAP, ECOSTRESS, GPM, Landsat, MODIS, NASA POWER, GRACE/GRACE-FO y SRTM. Se pueden analizar temperatura, estrés térmico, lluvia, humedad, evaporación, riesgo de helada, precipitación extrema, estrés de vegetación y tendencias hídricas.

También se pueden considerar suelo local, atributos de cultivos y prioridades como consumo de agua, forraje, fijación de nitrógeno, reducción de erosión, materia orgánica y mercado. La herramienta puede destacar periodos con suelo desnudo, vulnerabilidad estacional u oportunidades para interrumpir plagas, reducir agua, mejorar infiltración o diversificar ingresos.

Se deben comparar al menos tres estrategias, incluida la rotación existente. Para cada una: por qué se sugiere, evidencia, beneficios potenciales, brechas de información y riesgos que requieran revisión local. El resultado debe apoyar, no sustituir, el juicio del agricultor y la experiencia agronómica.

## Consideraciones potenciales del reto

Son opcionales, según el enunciado:

- Relacionar temperatura, humedad, lluvia, evaporación y estrés vegetal con vulnerabilidad y suelo.
- Explicar evapotranspiración, anomalías de humedad, índices como NDVI, heladas y balance hídrico; distinguir satélite de medición en tierra.
- Comparar enfoques estadísticos o de inteligencia artificial y explicar incertidumbre.
- Armonizar resoluciones temporales y espaciales para combinar SMAP, ECOSTRESS, GPM, Landsat/MODIS, GEDI y suelo.
- Comparar ciclos de nutrientes, erosión, materia orgánica, plagas, agua, forraje y mercados.
- Visualizar tendencias, zonas potenciales de estrés y transiciones estacionales.
- Diseñar para agricultores con distinta experiencia técnica y permitir indicar prioridades y restricciones.
- Mostrar dónde se requiere validación humana.

## Consideraciones para AgroVision

No se publica rúbrica numérica en el texto del reto. La evaluación debe responder con claridad al reto, usar NASA de manera sustantiva y presentar una experiencia creíble. En cada rotación, conectar una métrica y fuente concretas con el argumento. Aclarar que la resolución regional de POWER/SMAP no representa el lote. El análisis de recursos y la declaración están en `docs/02_recursos_datos.md`.
