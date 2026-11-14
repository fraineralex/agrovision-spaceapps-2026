<!-- Asistencia IA: Codex (OpenAI), 2026-11-14; revisión por Frainer pendiente. -->
# Delimitación experimental de campos del Valle de San Juan

Límites **aproximados, no catastrales**. Esta capa representa candidatos derivados
de imágenes, no propiedades verificadas, propietarios ni derechos de uso. Su
selección requiere confirmación del agricultor o técnico; la validación humana y
de campo está pendiente. No reemplaza la clasificación temporal Landsat del MVP.

## Adquisición y primer intento

Se prueba MobileSAM (`vit_t`) en CPU sobre Esri World Imagery, zoom 17, comenzando
en el núcleo agrícola al oeste de San Juan de la Maguana. El recorte inicial es
[-71.29, 18.76, -71.22, 18.83]. La cobertura final, conteos y evaluación técnica
se documentarán al terminar. No se afirma cobertura de todo el valle.

`scripts/fields/acquire.py` descarga únicamente teselas del recorte solicitado,
las verifica y conserva un mosaico EPSG:3857 y manifiesto con URLs y SHA-256 en
`data/cache/fields/`. Las teselas y mosaicos crudos quedan locales. La fecha de
descarga no equivale a fecha de captura; esta última es **sin verificar**.

## Fuentes y permisos

- [Esri World Imagery, servicio consultado](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer):
  atribución devuelta: Esri, Vantor, Earthstar Geographics y GIS User Community.
- [MobileSAM, código y pesos originales](https://github.com/ChaoningZhang/MobileSAM),
  commit `f706ad9c4eb7f219c00d9050e46328518ffb65d2`, Apache-2.0 según repositorio.
- [Artículo MobileSAM](https://arxiv.org/abs/2306.14289).
- [ESA WorldCover 2021 v200](https://esa-worldcover.org/en/data-access), 10 m,
  CC-BY-4.0. Zanaga et al. (2022), [doi:10.5281/zenodo.7254221](https://doi.org/10.5281/zenodo.7254221).
  © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data
  (2021) processed by ESA WorldCover consortium. Se modifica mediante recorte y
  reproyección nearest-neighbor para filtrar candidatos, no para generar linderos.

## Segmentación y filtros implementados

Ventanas 1536×1536 de la imagen a zoom 17 con paso 1024 (solape 512 px),
remuestreadas a 1024×1024 para inferencia CPU. El muestreo nominal del mosaico es
aproximadamente 1.13 m/píxel en esta latitud; la resolución efectiva de la fuente
no se verificó. La entrada al modelo tiene muestreo aproximado 1.70 m/píxel.
MobileSAM usa 24×24 puntos, predicted-IoU ≥0.86, estabilidad ≥0.92 y sin capas de
recortes internas. No hay entrenamiento ni ajuste con etiquetas locales.

Se excluyen máscaras que tocan bordes de ventana, con <75 % clase agrícola
WorldCover (40), >5 % urbano/agua (50/80), fragmentadas (componente mayor <85 %),
superficie fuera de 0.05–50 ha, razón de lados del rectángulo mínimo >12 o
compacidad 4πA/P² <0.06. Heurísticas RGB excluyen >15 % azul saturado o >25 %
gris muy claro para reducir agua y techos; no constituyen clasificación validada.
Los huecos internos se conservan. Carreteras, canales, edificios y árboles
pueden permanecer si pasan los filtros; también se pueden excluir campos reales.

Los polígonos se vectorizan en EPSG:3857, transforman a UTM 19N (EPSG:32619) y
simplifican 0.8 m. Área en hectáreas = m²/10000; centroide calculado en UTM y
transformado a WGS84. Se rechazan polígonos fuera del bbox solicitado. Entre
máscaras solapadas se prefieren las menores completas, rechazando alternativas
que contienen otra aceptada, con intersección >25 m² o >2 % del polígono menor.
Esto reduce duplicados, pero puede preferir un fragmento visual de un campo.
La capa web usa simplificación topológica de 2.5 m y coordenadas a 7 decimales;
área y centroide siguen referidos al polígono completo.

Cada entidad tiene `id` (hash de geometría), `area_ha`, `centroid` [lon, lat],
`source`, `confidence`, `quality`, `observed_at` y puntuaciones SAM. La confianza
es predicted-IoU recortado a [0,1] multiplicado por estabilidad: **calidad de
máscara sin calibrar**, no probabilidad de campo real, exactitud de límites ni
certeza de pertenencia. `quality=unvalidated`, `observed_at=null`. El GeoJSON
incluye fecha de descarga, fuentes, escala, unidades y limitaciones compartidas.

No se infiere propietario, cultivo, riego ni rendimiento. El umbral de 0.05 ha
es un filtro, no garantía de detectar campos tan pequeños: la separación de
puntos de SAM y la resolución pueden omitirlos. WorldCover 2021 introduce
desfase temporal frente a la imagen cuya fecha se desconoce. No se evaluó
precisión/recall porque no hay referencia local revisada. Cobertura Las Matas
y expansión al bbox completo solicitado: pendientes.

Esri no se presenta como fuente abierta ni NASA. Acceso público al endpoint no
equivale a autorización general de redistribución. Revisar sus
[condiciones de contenido](https://content.esri.com/arcgisonline/docs/tou_summary.pdf)
y [servicio de exportación](https://www.arcgis.com/home/item.html?id=226d23f076da478bba4589e7eae95952)
antes de redistribuir imágenes o presentar el material al concurso. El servicio
de exportación offline tiene condiciones propias. Los rásteres crudos no se
versionan; el PNG solicitado es una vista de revisión con atribución. Derechos
de publicación del material derivado: revisión del equipo pendiente.

## Autoría

Codex (OpenAI) asistió investigación, scripts, análisis y documentación el
14-11-2026. No se generaron imágenes sintéticas. Revisión por Frainer pendiente;
ver `AI_USAGE.md`.
