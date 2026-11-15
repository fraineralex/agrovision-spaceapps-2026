<!-- AI: Codex (OpenAI), 2026-11-15. Spanish synthesis of cited NASA/USGS documentation; Frainer review pending. -->
# Guía sencilla de datos NASA para agricultura

Consulta de fuentes: 2026-11-15. Este resumen traduce documentación oficial a términos de uso; no es una observación nueva ni un pronóstico. Los píxeles representan áreas, no mediciones exactas de una parcela.

## NASA POWER

POWER ofrece series meteorológicas, solares e hidrológicas descargables para un punto o región y permite elegir comunidad de uso, periodo, frecuencia y unidades. Las variables meteorológicas tradicionales proceden de MERRA-2 y se entregan en una grilla mucho más gruesa que una finca; en el Valle de San Juan la app documenta una escala aproximada de 50 km para ese contexto. La opción de alta resolución sustituye solo parámetros que tienen una fuente de mayor resolución; no convierte todas las variables en datos de finca. La guía de POWER lista IMERG para precipitación (~0.1°, cerca de 10 km) y SMAP para humedad de suelo (~9 km). Verifica nombre de variable, unidad, frecuencia, fuente y resolución antes de interpretar una cifra. El visor ofrece datos desde 1981 hasta casi tiempo real, según parámetro.

Fuente: NASA POWER, Quick Start: https://power.larc.nasa.gov/docs/tutorials/data-access-viewer/quick-start/ ; User Guide: https://power.larc.nasa.gov/docs/tutorials/data-access-viewer/user-guide/ ; fuentes hidrológicas: https://power.larc.nasa.gov/docs/methodology/data/sources_hydrology/ .

## IMERG / GPM

IMERG combina estimaciones de precipitación de la constelación GPM y otros satélites. Sirve para observar lluvia sobre zonas con pocas estaciones y comparar patrones en el tiempo; no es un pluviómetro instalado en el conuco. NASA publica corridas Early, Late y Final con distinta latencia/procesamiento. Hay productos cada media hora, diarios y mensuales. Según el producto, la unidad puede ser tasa (mm/h) o acumulado (mm); comprobarla antes de sumar o comparar. NASA describe una serie combinada que se extiende a 2000 y disponibilidad casi en tiempo real; POWER documenta IMERG a 0.1° (~10 km).

Fuente: NASA GPM, IMERG: https://gpm.nasa.gov/data/imerg ; NASA POWER, fuentes hidrológicas: https://power.larc.nasa.gov/docs/methodology/data/sources_hydrology/ .

## SMAP

SMAP observa humedad del suelo con microondas. Los productos integrados de POWER incluyen humedad superficial y de zona de raíces a aproximadamente 9 km y comienzan en 2015. Un píxel puede mezclar laderas, valle, suelo desnudo, vegetación y áreas regadas; no diagnostica la humedad de una parcela individual. Úsalo como contexto regional y confirma con suelo/campo y fuentes locales de riego.

Fuente: NASA POWER, fuentes hidrológicas: https://power.larc.nasa.gov/docs/methodology/data/sources_hydrology/ (secciones SMAP y límites); misión SMAP: https://smap.jpl.nasa.gov/ .

## GIBS

NASA Global Imagery Browse Services (GIBS) sirve imágenes de observación de la Tierra para visualización en mapas, con capas y fechas seleccionables. Una capa visible en el mapa es una imagen de contexto: por sí sola no aporta un diagnóstico de cultivo, una medición de lluvia en finca ni una recomendación agronómica. Para análisis cuantitativo hay que identificar el producto, fecha, resolución, leyenda y documentación, y usar el archivo de datos adecuado en lugar de inferir valores del color del mapa.

Fuente: NASA Earthdata GIBS: https://www.earthdata.nasa.gov/data/tools/gibs ; visor: https://worldview.earthdata.nasa.gov/ .

## Landsat

Landsat permite observar cambios de la superficie terrestre durante décadas. Sus imágenes se usan para estudiar cobertura y verdor; las nubes pueden tapar el suelo y una imagen no identifica por sí sola el cultivo, el riego ni la causa de un cambio. La clasificación de meses de suelo expuesto o riego/secano requiere fechas suficientes, reglas explícitas y validación local. AgroVision no debe presentar esa clasificación como rendimiento ni como detección de plagas.

Fuente: NASA Landsat: https://science.nasa.gov/mission/landsat/ ; USGS Landsat Collection 2 Surface Reflectance: https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-reflectance .

## Lectura prudente para una finca dominicana

- Primero pregunta qué mide la variable y en qué unidad; “lluvia”, “humedad” o “verdor” no son intercambiables.
- Comprueba periodo, fecha de actualización, frecuencia, tamaño del píxel y si el dato es satelital, reanálisis o combinación de fuentes.
- POWER meteorológico de grilla gruesa, IMERG de ~10 km y SMAP de ~9 km dan contexto de zona; ninguno representa por sí solo el lote.
- Para decisiones inmediatas combina estos datos con observaciones de campo, lluvia local, suelo, riego y orientación de un técnico.
