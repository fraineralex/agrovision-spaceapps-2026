<!-- AI assistance: Codex (OpenAI), 2026-11-14; Frainer review pending. -->
# San Juan satellite parcel classifier

Pipeline reproducible con observaciones **reales** de Sentinel-2 L2A y contexto
ESA WorldCover. Produce unidades aproximadas SLIC, features temporales,
RandomForest, evaluación espacial de etiquetas débiles, GeoJSON y PNG.
No usa chatbot, SAM, credenciales ni datos de productores. No escribe en `web/`.

## Ejecutar

Desde la raíz del repositorio, Python 3.11+:

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/ml/requirements.txt
# Reconstrucción completamente offline desde la caché mensual versionada:
.venv/bin/python scripts/ml/run.py
.venv/bin/python scripts/ml/validate.py
.venv/bin/python -m unittest discover -s scripts/ml -p 'test_*.py' -v
```

La primera instalación de dependencias necesita red. El build offline lee solo
`data/cache/ml/monthly.npz` y `acquisition.json`; no necesita descargar imágenes.
Las versiones efectivamente usadas se registran en `model_report.json`.
Las estimaciones y geometrías son deterministas con las mismas versiones y
semilla; `generatedAt`, compresión y versiones binarias pueden variar.

Para verificar/renovar la adquisición **con conexión**, explícitamente:

```bash
.venv/bin/python scripts/ml/download.py
# O ingesta + build en un comando:
.venv/bin/python scripts/ml/run.py --download
```

Descarga del 2024-01-01 al 2026-11-14 (noviembre 2026 parcial). Ventana
aproximada WGS84 `[-71.28, 18.77, -71.24, 18.81]` en el Valle de San Juan,
**no representa todo el valle ni una finca**. Grilla UTM 19N de 10 m
(449 × 428 píxeles, aproximadamente 19 km²). El ajuste a la grilla puede
extender unos metros el bbox solicitado; el bbox GeoJSON se calcula desde las
geometrías exportadas.

`download.py --help` permite cambiar período, bbox y escenas por mes. Para una
configuración diferente, usar otro checkout o archivar primero toda la caché
`data/cache/ml/`; el script rechaza reutilizar una selección de otro ámbito.
Para repetir la descarga completa con la misma configuración, conservar
`selection.json` y quitar los recortes locales `scenes/`; una nueva selección
requiere archivar además `selection.json`. No se borra evidencia automáticamente.

## Evidencia y fuentes

- [Earth Search STAC](https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a):
  colección `sentinel-2-l2a`, sin login. Recorrido de todas las páginas; máximo
  dos escenas por mes, días distintos, cobertura geométrica de toda la ventana,
  ordenadas por nubosidad de **toda la escena**, no nubosidad local. La selección
  es una muestra temporal, no todo el archivo Sentinel. Se conservan IDs,
  fechas, plataformas, nubes, metadatos de reflectancia y URLs de cada asset
  en `selection.json`. Un mismo día no se cuenta dos veces por solape UTM.
- Rojo B04 y NIR B08, resolución 10 m. NDVI = (NIR − rojo)/(NIR + rojo).
  Escala de reflectancia STAC y offset BOA solo cuando **no** está aplicado,
  según `earthsearch:boa_offset_applied`. Si falta ese indicador, se rechaza
  la escena. [Explicación del proveedor sobre offsets](https://github.com/Element84/earth-search/discussions/26).
- SCL 20 m, vecino más próximo a 10 m. Se conservan solo códigos 4/5
  (vegetación/no vegetación), se excluyen agua, sombras, nubes, nieve y nodata,
  y se amplía la exclusión 20 m para bordes de nubes. Rojo/NIR se remuestrean
  bilinealmente al grid común; no se usa una máscara de nubes a 10 m nativa.
- [ESA WorldCover 2021 v200](https://esa-worldcover.org/en/data-access),
  [dataset DOI](https://doi.org/10.5281/zenodo.7254221), CC BY 4.0,
  Zanaga et al. (2022). Recorte real del tile `N18W072`, vecino más próximo,
  10 m. Clase 40 = cropland, 60 = bare/sparse vegetation. **Es un modelo de
  2021, no verdad de terreno contemporánea ni mapa de riego.**
- Copernicus Sentinel Data Legal Notice; contiene datos Copernicus Sentinel
  modificados (2024–2026), distribuidos por Element 84/AWS.
- Algoritmos: [SLIC/scikit-image](https://scikit-image.org/docs/stable/api/skimage.segmentation.html#skimage.segmentation.slic),
  [RandomForest/scikit-learn](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html).
  Dependencias se usan bajo sus licencias propias; no se copia su código fuente.

Esta ejecución usa **ESA/Copernicus Sentinel-2**, no NASA HLS ni Landsat.
El usuario autorizó Sentinel-2 como alternativa. La integración NASA Landsat/HLS
permanece pendiente; no atribuir estos resultados a NASA ni afirmar que resuelve
por sí sola la dependencia NASA del producto.

## Segmentación y features

SLIC sobre percentiles temporales por píxel (10/50/90), 600 segmentos solicitados,
compactness=0.15, sigma=1, sin conversión Lab. Máscara terrestre WorldCover y
mínimo 12 meses válidos por píxel. Se descartan unidades menores de 25 píxeles
o con menos de 12 meses agregados disponibles. Son **superpíxeles de análisis**,
no parcelas catastrales ni límites validados de cultivos.

La caché contiene mediana mensual por píxel de las escenas seleccionadas,
conteo de observaciones claras y WorldCover. Se calcula el NDVI medio por unidad
por mes; con menos del 50% de píxeles claros el mes queda `null`. No se interpola
ni se considera que un mes ausente tiene suelo pelado. Solo la imagen usada
para construir fronteras SLIC reemplaza NaN por cero; no se imputan estadísticas.

Features: NDVI medio, percentiles 10/90, amplitud p90−p10, fracción y conteo de
meses con NDVI<0.2, cobertura temporal, último mes observado, estacionalidad
(desvío de los 12 promedios de mes calendario), medias de enero–marzo y
mayo/junio/septiembre/octubre y su diferencia. Estas ventanas estacionales son
heurísticas del proyecto, **pendientes de contraste con lluvia local**, no fechas
óptimas ni calendario agrícola validado. Cada estación requiere tres meses
observados. Los faltantes se conservan; el modelo solo recibe features completas.

## Etiquetas débiles, entrenamiento y límites

Reglas de prototipo `weak-rules-v1`, **sin calibración agronómica local**:

| Clase | Regla |
|---|---|
| `bare_soil` | Fracción WorldCover cultivo+desnudo ≥0.6 y último NDVI mensual observado <0.2 |
| `crop` | Fracción WorldCover cultivo ≥0.6 y último NDVI mensual observado ≥0.35 |
| `irrigation_signal` | Fracción cultivo ≥0.6; NDVI enero–marzo ≥0.48 y ≥media húmeda−0.10 |
| `rainfed_signal` | Fracción cultivo ≥0.6; NDVI enero–marzo ≤0.35, media húmeda ≥0.50 y diferencia ≥0.15 |

Clases ambiguas quedan sin etiqueta. Se entrenan **dos clasificadores**, cobertura
instantánea aproximada y régimen hídrico temporal; no son cuatro estados
mutuamente excluyentes. La predicción de cobertura solo se exporta para unidades
con fracción agrícola ≥0.6; la de agua solo para fracción cultivo ≥0.6.
Bosque, herbáceas, urbano y agua quedan fuera de ese dominio.

RandomForest de 300 árboles, min_samples_leaf=3, max_features=sqrt,
class_weight=balanced, semilla 42. Split fijo GroupShuffleSplit 25% por bloques
UTM de 1 km; se quitan unidades de entrenamiento a menos de 100 m de geometrías
de prueba. No se busca otra semilla para mejorar resultados. Métricas solo si hay
≥5 muestras train y ≥1 test por clase; con soporte bajo son **descriptivas**.
Se publican conteos, grupos, asignaciones y matriz de confusión. Menos de tres
etiquetas por clase impide entrenar. Sin soporte para evaluación, se puede
entrenar el prototipo sobre todas las etiquetas pero `validation` queda `null`.

**Las etiquetas proceden de las mismas features que recibe el modelo.** Incluso
un acuerdo alto en bloques separados es circular y no demuestra precisión en
campo ni detección de riego. No hay ground truth independiente, calibración de
probabilidades, intervalos de confianza ni validación por agricultor. Riego puede
confundirse con vegetación perenne, lluvia o manejo; NDVI bajo no prueba suelo
pelado. No se predicen rendimientos, plagas ni rentabilidad.

Tras evaluar el holdout se ajusta un modelo de demo con todas las etiquetas; sus
votos no representan probabilidades calibradas de acierto. El campo `confidence`
es el máximo voto RandomForest; cada predicción incluye estatus de validación.
Una métrica de calidad con `confidence: null` indica incertidumbre no cuantificada,
no confianza perfecta. Los faltantes y resultados fuera del dominio quedan null.

## Archivos y contrato de integración

| Ruta | Contenido |
|---|---|
| `data/cache/ml/selection.json` | Consulta, selección y metadatos STAC completos |
| `data/cache/ml/acquisition.json` | Ámbito, grid, fechas, descargas/fallos y fuente WorldCover |
| `data/cache/ml/monthly.npz` | Evidencia real reducida para reconstruir offline, sin pickle |
| `data/cache/ml/scenes/` | Recortes NDVI por escena, ignorados por git |
| `data/model/*.joblib` | Dos modelos reproducibles locales, ignorados; cargar solo archivos propios |
| `data/derived/parcels_san_juan.geojson` | Unidades WGS84, clases, votos, features, métricas y serie mensual |
| `data/derived/model_report.json` | Método, período, sensor, fuentes, reglas, versiones y evaluación |
| `data/derived/parcels_san_juan.png` | Mapas separados de cobertura/agua, votos, NDVI bajo y cobertura temporal |

JSON/GeoJSON llevan `schemaVersion`, `generatedAt`, `caseId`, procedencia y
asistencia IA; geometrías WGS84. Las métricas siguen `Metric`/`Provenance` de
`docs/10_plan_tecnico.md`: valor/unidad, calidad/confianza, fuente, período,
resolución, escala, método y limitación. Series mensuales referencian fuente;
fechas exactas de escenas están en el manifiesto. `periodEnd` es el corte de
consulta, no una afirmación de observación diaria continua.

Integrador UI: consumir `coverClass`, `waterRegimeClass`, sus confianzas y
`coverValidationStatus`/`waterValidationStatus` por separado. `class`/`confidence`
son alias de agua cuando existe y de cobertura en otro caso. No confundirlos
con estado de riego confirmado (`irrigationStatus` siempre `unconfirmed`).
La PNG separa cobertura y agua en paneles con sus votos; los meses bajos y
la cobertura temporal usan datos, no clasificación. `model_report.json.targets.*.validation` puede ser null.
No renombrar `prototype_unvalidated` como "validated".

Para servir offline, el agente de UI puede copiar estos artefactos a
`web/public/data/` y adaptar su loader conforme al contrato. Esta tarea no modifica
esa carpeta. Los archivos grandes crudos no se versionan; sí se conserva una
caché mensual reducida para poder revisar y reproducir los resultados.

Revisión humana por Frainer y validación agronómica: **pendientes**. La asistencia
Codex está registrada en `AI_USAGE.md`; no se declara revisión que no ocurrió.
