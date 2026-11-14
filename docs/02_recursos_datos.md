# 02. Recursos y datos

Dirección oficial: AgroVision se enfoca en el Valle de San Juan y organiza la comparación de rotaciones en cuatro pilares: agua y suelo, clima, plagas y mercado. NASA Earth observations son el núcleo del relato; las fuentes del Estado dominicano y las guías agrícolas aportan validación y contexto. El inventario detallado de 33 fuentes procede de `docs/fuentes_equipo/inventario_datos.txt` (resumen oficial del inventario); el estado aquí refleja el estado anotado en ese archivo, no una verificación independiente de descarga.

La IA del MVP analiza datos: clasifica con Landsat los meses con suelo/campo pelado y distingue zonas con riego frente a secano, sujeto a validación y disponibilidad de muestras. No es chatbot. Sensores quedan para una etapa futura y fuera de la demo. Ninguna métrica de satélite se debe presentar como medición exacta de una parcela.

## Inventario oficial de fuentes (33)

| # | Tipo | Fuente / institución | Cobertura, período y detalle | Estado | Uso previsto | Límites | URL |
|---:|---|---|---|---|---|---|---|
| 1 | NASA | GPM IMERG, NASA | San Juan (~30 celdas); 2000–hoy; 30 min; ~10 km; HDF5/GeoTIFF/API | Por descargar | Lluvia en valle/cuenca, extremos e inicio de temporada | Serie ~25 años | [gpm.nasa.gov/data/imerg](https://gpm.nasa.gov/data/imerg) |
| 2 | NASA | NASA POWER, NASA | San Juan (1–2 celdas); 1981–hoy; diario; ~0.5° (~50 km); CSV/JSON/API | Por descargar | Calor, clima de largo plazo y ET0 para FAO-56 | Reanálisis; lluvia débil en trópico; mezcla valle y montaña | [power.larc.nasa.gov](https://power.larc.nasa.gov/) |
| 3 | NASA | Landsat / HLS, NASA / USGS | San Juan; Landsat 1984–hoy, HLS 2013–hoy; 30 m; GeoTIFF | Por descargar | Verdor, campo pelado, clasificación IA de riego/secano y agua de presas | Nubes en lluvias; validar clasificación | [hls.gsfc.nasa.gov](https://hls.gsfc.nasa.gov/) |
| 4 | NASA | SRTM / NASADEM, NASA | San Juan; estático (2000); 30 m; GeoTIFF | Por descargar | Pendiente y riesgo de erosión | Dato estático | [NASADEM](https://lpdaac.usgs.gov/products/nasadem_hgtv001/) |
| 5 | NASA | SMAP, NASA | San Juan (~44 píxeles a 9 km); 2015–hoy; 9–36 km; HDF5 | Por descargar | Anomalías de humedad regional | Mezcla valle/montaña; arroz regado refleja riego | [smap.jpl.nasa.gov](https://smap.jpl.nasa.gov/) |
| 6 | NASA | MODIS NDVI MOD13Q1, NASA | San Juan; 2000–2026; cada 16 días; 250 m | Por descargar | Sequía histórica en vegetación | Transición/apagado Terra/Aqua previsto entre fines 2026 y 2027, según inventario | [MOD13Q1 v061](https://lpdaac.usgs.gov/products/mod13q1v061/) |
| 7 | NASA | VIIRS NDVI, NASA / NOAA | San Juan; 2012–hoy; 500 m | Por descargar | Continuidad reciente de verdor | Menor detalle que MODIS | [Transición MODIS a VIIRS](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition/) |
| 8 | NASA | ECOSTRESS, NASA | San Juan; 2018–hoy; fechas irregulares; ~70 m | Por descargar | Mapa puntual de estrés térmico/hídrico | No es serie continua | [ecostress.jpl.nasa.gov](https://ecostress.jpl.nasa.gov/) |
| 9 | NASA | NEX-GDDP-CMIP6, NASA | San Juan; proyecciones hasta 2100; 0.25°; NetCDF | Por descargar | Extra: clima 2041–2060 | Mostrar rango entre modelos | [NASA NCCS](https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6) |
| 10 | NASA | OPERA DSWx, NASA / JPL | San Juan; 2023–hoy; 30 m | Por descargar | Extra para agua superficial en embalses | Serie corta; Landsat para historia | [JPL OPERA](https://www.jpl.nasa.gov/go/opera/) |
| 11 | NASA | GRACE / GRACE-FO, NASA / DLR | Isla Hispaniola; 2002–hoy; cientos de km | Descartado | Sin uso en análisis local | No distingue San Juan de Haití/resto de isla | [grace.jpl.nasa.gov](https://grace.jpl.nasa.gov/) |
| 12 | NASA | GEDI, NASA | Franjas; 2019–hoy; muestras de 25 m | Descartado | Sin uso | Biomasa/altura de bosques, no cultivos bajos | [gedi.umd.edu](https://gedi.umd.edu/) |
| 13 | Local | Precios mayoristas 2017–2026, Agricultura | Santo Domingo; ago 2017–oct 2026; semanal; CSV/XLSX | Tenemos | Estacionalidad de precio por cultivo | No es precio al productor; nombres/unidades inconsistentes | [datos.gob.do](https://datos.gob.do/) |
| 14 | Local | Precios minoristas 2017–2026, Agricultura | Mercados de Santo Domingo; ago 2017–oct 2026; semanal; CSV/XLSX/ODS | Tenemos | Contexto del precio al consumidor | No es precio en finca; inconsistencias | [datos.gob.do](https://datos.gob.do/) |
| 15 | Local | Consolidados de siembra, cosecha y producción, Agricultura | Nacional; ene 2017–sep 2026; mensual; XLSX | Tenemos | Calendario nacional como contexto | No provincial; archivo Millares duplicado; faltan años de arroz | [datos.gob.do](https://datos.gob.do/) |
| 16 | Local | Demandas de Agua según sus Usos 2025, INDRHI | Valle/Suroeste; 2022–2025; divisiones de riego; PDF | Tenemos | Contexto hídrico y validación | Eficiencia reportada 7.4 % requiere cita y cautela | [INDRHI documentos](https://indrhi.gob.do/documentos/) |
| 17 | Local | Plan Hidrológico Nacional 2025–2045, INDRHI | Embalses; 2016–2045; PDF | Tenemos | Déficit de Sabaneta y sedimentación de Sabana Yegua | Sedimentación citada corresponde a 2016 | [INDRHI documentos](https://indrhi.gob.do/documentos/) |
| 18 | Local | Boletines de embalses, INDRHI | San Juan; fechas puntuales 2023–2026; HTML | Por recopilar | Contrastar agua Landsat | No hay serie histórica abierta | [Boletines de presas](https://indrhi.gob.do/indrhi-informa-sobre-volumenes-en-sistema-nacional-de-presas/) |
| 19 | Local | Plan de Contingencia 2026, Agricultura | Regional/nacional; 2026; PDF | Tenemos | Calendario, sequía y contexto agrícola | — | [PDF 2026](https://agricultura.gob.do/wp-content/uploads/2026/06/PLAN-DE-CONTINGIA-DEGRYCC-1-DE-JUNIO-2026.pdf) |
| 20 | Local | Plan de Contingencia 2023, Agricultura | Comunidades de San Juan; 2023; PDF | Tenemos | Cultivos y rotaciones actuales; elegir comunidad piloto | Confirmar en campo | [PDF 2023](https://agricultura.gob.do/wp-content/uploads/2023/10/Plan-de-Contingencia-Sector-Agropecuario-2023.pdf) |
| 21 | Local | Memoria Institucional 2019, Agricultura | Provincia; 2019; PDF | Tenemos | Antecedente de reconversión y posibles aliados | Reconversión equivale más a modernización que cambio de cultivo | [Memoria 2019](https://agricultura.gob.do/transparencia/wp-content/uploads/2023/01/Memoria-Institucional-MA-2019.pdf) |
| 22 | Local | Compendio de habichuela, IDIAF | Valle de San Juan; 2013; PDF | Público | Siembra, agua, plagas y rotación arroz–habichuela | Solo habichuela; revisar antes de usar | [Compendio](https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf) |
| 23 | Local | Publicaciones de guandul, batata, arroz y plagas, IDIAF | RD/Suroeste; varios años; PDF | Por revisar | Completar tabla de cultivos y plagas compartidas | Buscar y comprobar cada publicación | [Publicaciones IDIAF](https://idiaf.gob.do/publicaciones/) |
| 24 | Local | Lluvias anuales en 30 estaciones, Agricultura / ONAMET | Incluye Arroyo Loro; 2009–2023; anual; PDF | Público | Contrastar lluvia satelital con estaciones | Solo anual; mensual requiere gestión con INDOMET | [PDF estaciones](https://agricultura.gob.do/wp-content/uploads/2024/04/Lluvias-ANUALES-en-30-estaciones-de-la-Republica-Dominicana-2009-a-2023.pdf) |
| 25 | Local | Normales de 74 estaciones, Agricultura / ONAMET | Incluye San Juan; 1971–2000; PDF | Público | Referencia climática histórica | Período antiguo | [PDF normales](https://agricultura.gob.do/wp-content/uploads/2019/09/NORMAL-1971-2000-de-74-estaciones-meteorologicas.pdf) |
| 26 | Local | Mapa de suelos OEA 1967, Medio Ambiente | Valle; escala regional; mapa web | Solo visualización | Contexto cualitativo de suelo | Sin shapefile descargable; georreferenciación pendiente | [Suelos RD](https://ambiente.gob.do/suelos/) |
| 27 | Global | Los suelos de República Dominicana, Tirado, FAO / CEDAF | Regional RD; 2003; descriptivo; PDF | Público | Descripción regional de suelos | No es mapa digital | [PDF FAO/CEDAF](https://intranet.cedaf.org.do/digital/suelos.agricolas.dominicanos.pdf) |
| 28 | Global | SoilGrids, ISRIC | San Juan; 250 m; GeoTIFF/API | Por descargar | Contexto estimado de textura, pH y carbono | Modelo global, no medición local | [soilgrids.org](https://soilgrids.org/) |
| 29 | Global | FAO-56, FAO | Global; 1998; método y coeficientes Kc | Público | Estimar demanda hídrica por cultivo/rotación | Requiere datos y calibración local | [FAO-56](https://www.fao.org/4/x0490e/x0490e00.htm) |
| 30 | Global | CHIRPS, UCSB / USGS | San Juan; 1981–hoy; ~5 km | Por descargar | Contrastar lluvia de largo plazo; no es NASA | Solo validación secundaria | [CHIRPS](https://www.chc.ucsb.edu/data/chirps) |
| 31 | Pendiente | Producción por provincia, Agricultura / Regional Suroeste | San Juan; 2015–2025; provincia | Pendiente | Validar clima frente a producción local | Solicitud SAIP; no asumir disponibilidad | [SAIP](https://saip.gob.do/) |
| 32 | Pendiente | Serie histórica de embalses, INDRHI / EGEHID | San Juan; 2000–2026; diario/mensual | Pendiente | Validar disponibilidad de agua | Solicitud pendiente; usar Landsat y boletines mientras tanto | [INDRHI](https://indrhi.gob.do/) |
| 33 | Pendiente | Rotaciones y decisiones en sequía, juntas/técnicos | Comunidad de San Juan; actual; entrevista | Pendiente | Validar escenario base y prácticas | Requiere entrevista; no inventar testimonio | Sin URL |

## Prioridad para la demo

1. **Clima:** NASA POWER para temperatura/ET0 regional y GPM IMERG para lluvia, mostrando la diferencia de cobertura y escala.
2. **Agua y suelo:** Landsat/HLS para verdor, campo pelado, riego/secano y agua de embalses; SRTM para pendiente si aporta al caso; contexto de suelo solo con fuente explícita.
3. **Plagas:** reglas de rotación basadas en publicaciones IDIAF verificadas y relaciones entre cultivos; no predecir presencia ni brotes.
4. **Mercado:** estacionalidad de precios mayoristas/minoristas dominicanos con advertencia visible: mercados de Santo Domingo no equivalen al precio recibido por productor.

Las alternativas de rotación son escenarios para conversar con un técnico, no prescripciones. Cada métrica debe indicar fuente, fecha/período, unidad, escala espacial y confianza. Mantener la demo utilizable con archivos públicos precargados en `data/cache/` cuando no haya conexión.

## Productos en `data/derived/` (14-11-2026)

<!-- Asistencia: Grok (xAI), 2026-11-14. Revisión de Frainer pendiente. Ver AI_USAGE.md. -->

Las filas 1–33 de arriba conservan el estado anotado en el inventario del equipo. Esta sección describe solo archivos que ya están en el repositorio. No están cableados en `web/`. Método, límites y reproducción:

- Clasificador de unidades: [scripts/ml/README.md](../scripts/ml/README.md)
- Agua y clima: [docs/11_water_climate_method.md](11_water_climate_method.md)
- Precios: [scripts/market/README.md](../scripts/market/README.md)
- Borradores de envío: [docs/submission/](submission/)

| Archivo | Qué contiene | Fuente, período y escala | Calidad |
|---|---|---|---|
| `data/derived/parcels_san_juan.geojson` | 585 unidades SLIC (`san-juan-ml-pilot`). No son fincas ni catastro. Clases de cobertura y régimen de agua con confianza del modelo y etiquetas débiles. | Sentinel-2 L2A, 2024-01-01 a 2026-11-14; ventana aproximada lon -71.28 a -71.24, lat 18.77 a 18.81; grilla 10 m. No es Landsat ni todo el valle. | `prototype_preliminary`. Sin validación de campo. |
| `data/derived/model_report.json` | RandomForest (semilla 42, 300 árboles), 70 escenas, 35 meses, reglas débiles, importancia y acuerdo espacial. | Misma adquisición Sentinel-2 y WorldCover 2021. | El informe dice que el acuerdo con las reglas débiles no es exactitud independiente. Soporte de suelo pelado en la prueba: 2. `fieldAccuracy` no sustituye revisión humana. |
| `data/derived/parcels_san_juan.png` | Figura de confianza y cobertura de esas unidades. | Misma ventana y período que el GeoJSON. | Preliminar; revisión visual humana pendiente. |
| `data/derived/market_prices.json` | 4,037 observaciones, 926 medias mensuales y 372 filas de estacionalidad. `marketScore` es null. | Ministerio de Agricultura, mayorista Santo Domingo, 2017-08 a 2026-10. No es precio de finca en San Juan. | `preliminary_requires_human_review`. |
| `data/derived/water_climate/power_daily_ag_18.8_-71.23_2016-01-01_2025-12-31.csv` | Serie diaria POWER (3,653 fechas más cabecera) en 18.8 N, 71.23 W. | NASA POWER, comunidad AG, 2016-01-01 a 2025-12-31. Celda ~0.5°. | Observación/reanálisis de celda, no de parcela. Elevación de la celda 935.34 m. |
| `data/derived/water_climate/power_request.json` | URL, versión de API, fuentes MERRA-2 / SYN1DEG / POWER y unidades. | Misma petición POWER. | Metadato de la descarga. |
| `data/derived/water_climate/climate_series.json` | Climatología, ET0 FAO-56, meses de calor, cuartil seco y meses secos. | POWER 2016–2025 en el punto anterior. Lluvia: `PRECTOTCORR`. | Lluvia con confianza 0.35. No es índice oficial de ONAMET ni INDRHI. |
| `data/derived/water_climate/crop_water.json` | ETc, lluvia efectiva y riego neto de tres rotaciones ilustrativas. | FAO-56 y lluvia POWER; año plantilla 2021. | Estimación de regla. Sin balance de suelo ni calibración local. |
| `data/derived/water_climate/pillar_scores.json` | Puntajes 0–5 de `water_soil` y `climate` para `habichuela_maiz`, `leguminosa_maiz` y `habichuela_guandul_maiz`. | Relativos a esas tres secuencias. Plagas y mercado no están en este archivo. | Preliminar. El 0 y el 5 son los extremos de este trío, no aptitud absoluta. |
| `data/derived/water_climate/remote_access.json` | Comprobación del 14-11-2026: IMERG y SMAP sin valores numéricos utilizables. | Bbox del valle lon -71.40 a -71.05, lat 18.65 a 18.95. | Sin milímetros IMERG ni humedad SMAP en m³/m³. |
| `data/derived/water_climate/water_climate_climatology.png` | Climatología mensual de lluvia POWER y ET0, y riego neto de las tres secuencias. | Mismos JSON de agua y clima. | Figura de los derivados; no es una medición nueva. |

Los números de agua y clima están en [docs/11_water_climate_method.md](11_water_climate_method.md). No usar estos archivos para afirmar rendimiento, brote de plagas, rentabilidad ni fecha óptima de siembra.
