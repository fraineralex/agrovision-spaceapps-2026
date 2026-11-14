# 02. Recursos y datos

Inventario de los 26 recursos de la pestaña oficial. Prioridad y acceso se interpretan para San Juan, República Dominicana. Cobertura global significa que el producto puede incluir la región, no que tenga precisión de parcela.

## NASA y recursos agrícolas

| Recurso | URL | Prioridad y acceso | Resolución/cobertura en RD y decisión |
|---|---|---|---|
| SMAP | https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap | Alta, complemento; descarga de productos suele requerir Earthdata Login. | Humedad superficial y productos de zona radicular; producto mejorado cercano a 9 km, cobertura global. Indicador regional, no medición del lote. |
| GPM / IMERG | https://gpm.nasa.gov/data | Alta para lluvia. GES DISC requiere Earthdata Login para granulos; capas de Worldview/GIBS visibles públicamente. | 0.1° (~10 km), media hora y agregados. Útil para lluvia y extremos en RD; procesamiento HDF5/NetCDF queda como fase posterior. |
| Landsat / EarthExplorer | https://earthexplorer.usgs.gov/ | Media, exploración óptica; cuenta USGS para descargas. | 30 m, cobertura terrestre global incluida RD; nubosidad limita escenas. No prometer observación diaria. |
| MODIS | https://lpdaac.usgs.gov/products/ | Media, serie regional; Earthdata Login para productos LP DAAC. | Vegetación usualmente 250-1000 m según producto, global. Señal de región, no parcelas pequeñas. |
| VIIRS | https://search.earthdata.nasa.gov/search?q=VIIRS | Baja/media; Earthdata Search y Earthdata Login para archivos. | Cobertura amplia y frecuente; resolución depende del producto. Se puede mostrar vía GIBS sin ingestión propia. |
| NASA POWER | https://power.larc.nasa.gov/ | Muy alta para el prototipo; REST diaria/mensual en CSV/JSON, sin login ni clave. | Rejilla aproximada 0.5° meteorológica y 1° solar; incluye San Juan. Serie regional rápida, demasiado gruesa para comparar fincas cercanas. |
| SRTM | https://www.earthdata.nasa.gov/data/instruments/srtm | Media solo para topografía; portales pueden requerir cuenta. | Cerca de 30 m, cobertura RD. Puede apoyar pendiente/escorrentía, más útil en laderas que en valle llano. |
| ECOSTRESS | https://ecostress.jpl.nasa.gov/data | Baja/opcional; Earthdata Login para granulos. | Térmico cercano a 70 m, órbita irregular y huellas variables. Revisar escena sobre RD antes de depender de ella. |
| USDA Ag Data Commons | https://www.nal.usda.gov/services/agdatacommons | Ignorar como fuente principal: catálogo estadounidense, no capa preparada para San Juan. | Cobertura variable por conjunto; puede contener estudios internacionales puntuales, que deben evaluarse individualmente. |
| Web Soil Survey (WSS) | https://websoilsurvey.nrcs.usda.gov/app/ | Ignorar para RD. | Cartografía de suelos NRCS de EE. UU.; no ofrece cobertura comparable de San Juan. |
| Cropland Data Layer / CropScape | https://nassgeodata.gmu.edu/CropScape/ | Ignorar para RD. | Clasificación anual de cultivos de EE. UU.; no cubre parcelas dominicanas. |
| PRISM Climate Data | https://prism.oregonstate.edu | Ignorar para RD. | Clima interpolado para EE. UU.; cobertura no aplicable a San Juan. |
| USDA NRCS SSURGO/STATSGO2 | https://www.nrcs.usda.gov/resources/data-and-reports/soils | Ignorar para RD. | Bases de suelo de EE. UU.; no sustituyen levantamiento local dominicano. |
| NAIP | https://naip-usdaonline.hub.arcgis.com/ | Ignorar para RD. | Imagen aérea del programa estadounidense, no cobertura dominicana. |
| USGS NLCD | https://www.usgs.gov/centers/eros/science/national-land-cover-database | Ignorar para RD. | Uso/cobertura multitemporal de EE. UU.; extensión no aplicable. |
| NLDAS/GLDAS | https://www.earthdata.nasa.gov/ | Baja/opcional. GLDAS global; búsqueda/descarga y archivos pueden requerir Earthdata Login. NLDAS es norteamericano. | GLDAS cubre RD a escala de rejilla; duplicaría variables de agua de SMAP/POWER en el MVP. NLDAS no es para RD. |
| FAO GAEZ | https://gaez.fao.org | Media, contexto de idoneidad; portal público, sin Earthdata Login. | Global, incluida RD; resolución depende de la capa (v4 documenta 5 arc-min y capas más finas; verificar v5). No equivale a observación de parcela. |
| CoCoRaHS | https://www.cocorahs.org/Maps | Ignorar como observación local rutinaria. | Red comunitaria de Norteamérica, sin densidad equivalente asegurada en RD. |
| USGS NWIS | https://waterdata.usgs.gov/nwis | Ignorar para estaciones de RD. | Registros hidrológicos de EE. UU.; no proporciona contexto operativo local dominicano. |
| USDA AMS Market News | https://www.ams.usda.gov/market-news | Ignorar para mercado local dominicano. | Precios/mercados de EE. UU.; no usar para inferir precios de finca en RD. |
| USDA NASS QuickStats | https://quickstats.nass.usda.gov | Ignorar para calibración de San Juan. | Estadísticas agrícolas de EE. UU.; no representa producción dominicana. |
| OpenET | https://openetdata.org | Ignorar para operación en RD. | Estimaciones satelitales de ET centradas en estados del oeste de EE. UU.; cobertura no aplicable. |
| USFS LANDFIRE | https://www.landfire.gov | Ignorar para capas locales. | Datos de vegetación y paisaje de EE. UU.; no cobertura dominicana. |
| GEDI | https://gedi.umd.edu/data | Baja; no integrar en MVP. | Lidar/biomasa de estructura forestal, cobertura amplia con huellas orbitales; no es una capa directa para rotación anual de cultivos. |

## Socios espaciales

| Recurso | URL | Prioridad y acceso | Resolución/cobertura en RD y decisión |
|---|---|---|---|
| Copernicus Sentinel-2 | https://dataspace.copernicus.eu | Alta para NDVI/NDMI de zona; acceso gratuito con cuenta Copernicus Data Space. | 10-20 m, revisita nominal de 5 días, cobertura global incluida RD; nubes tropicales limitan escenas. Precalcular un ejemplo si no se integra API. |
| ERA5 | https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview | Baja, opción de contraste. Cuenta gratuita de Copernicus Climate Data Store y aceptación de términos; requiere descarga/procesamiento. | Global, resolución de rejilla del orden de decenas de km según producto. Comparación no prioritaria frente a POWER en 48 h. |

## Orden de uso recomendado

1. POWER para temperatura y clima regional, descargado por `scripts/fetch_power.py`.
2. GPM/IMERG o una visualización GIBS para explicar lluvia; distinguir visualización de dato numérico descargado.
3. Sentinel-2 o Landsat para un índice de vegetación en escena despejada, si el tiempo lo permite.
4. SMAP para humedad regional, reconociendo su escala y login.
5. GAEZ, ficha local de cultivo y datos de Agricultura/IDIAF como contexto; verificar licencia y fecha de cada capa.
6. SRTM solo si el caso incluye ladera o análisis de erosión.

Los enlaces y descripciones de catálogo proceden de la lista del reto y `analisis_recursos.md`. Las resoluciones y accesos son notas operativas de esas fuentes; confirmar documentación del producto antes de presentar resultados.
