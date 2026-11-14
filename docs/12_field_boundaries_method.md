<!-- Asistencia IA: Codex (OpenAI), 2026-11-14; revisión por Frainer pendiente. -->
# Delimitación experimental de campos del Valle de San Juan

Límites **aproximados, no catastrales**. Esta capa representa candidatos derivados
de imágenes, no propiedades verificadas, propietarios ni derechos de uso. Su
selección requiere confirmación del agricultor o técnico; la validación humana y
de campo está pendiente. No reemplaza la clasificación temporal Landsat del MVP.

## Adquisición y primer intento

Se prueba MobileSAM (`vit_t`) en CPU sobre Esri World Imagery, zoom 17, comenzando
en el núcleo agrícola al oeste de San Juan de la Maguana. El recorte inicial es
[-71.28, 18.77, -71.24, 18.81]. La cobertura final, conteos y evaluación técnica
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
