<!-- AI: Codex/OpenAI, 2026-11-14; revisión de Frainer pendiente. -->
# Datos incluidos en la demo

Consulta y descarga de muestras nuevas: 14-11-2026. No hay datos personales ni límites reales de fincas.

| Fuente | Artefacto real incluido | Período, unidad y escala | Calidad / límites |
|---|---|---|---|
| [NASA POWER](https://power.larc.nasa.gov/) | CSV diario versionado y medias por mes calendario | 2016-01-01–2025-12-31; T2M °C, PRECTOTCORR mm/día, RH2M %; punto regional 18.80, −71.23, ~0.5° | Reanálisis, sin validación en finca; lluvia tropical excluida de scores. Tres días iniciales contrastados nuevamente con API y preservados en `data/cache/power_verification_sample.json`; coinciden. |
| [USGS/NASA Landsat 8–9 C2 L2](https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-reflectance) | 18 respuestas reales red/NIR/QA de Microsoft Planetary Computer; NDVI derivado | Seis fechas de 2024 por centro de área demo; píxel de 30 m; NDVI adimensional | Muestra pequeña, no promedio de parcela ni serie mensual completa. QA conserva huecos. Señales por umbrales exploratorios sin etiquetas ni precisión medida. Riego no inferido. |
| [USGS QA](https://www.usgs.gov/landsat-missions/landsat-collection-2-quality-assessment-bands) | Regla de máscara en `scripts/landsat_features.py` | QA_PIXEL bits 0–5 y 7; QA_RADSAT bits 3, 4, 11 | Excluye relleno, nube/cirro/sombra/nieve, agua, saturación red/NIR y oclusión. No sustituye revisión visual. |
| [NASA EOSDIS GIBS](https://nasa-gibs.github.io/gibs-api-docs/access-basics/) | Cuatro tiles originales y URLs en `data/cache/gibs/manifest.json` | Blue Marble estático; MODIS Terra NDVI visualización de 8 días y GPM IMERG Precipitation Rate del 2026-11-01 | Visualización de satélite, no valores extraídos de colores. NDVI ~250 m; IMERG ~10 km, mm/h. Solo contexto regional, sin confianza parcelaria. |
| [FAO-56, capítulo 6](https://www.fao.org/4/x0490e/x0490e0b.htm) | Transcripción reducida de tablas 11–12, cuatro cultivos | Publicación 1998; duraciones de etapas (días), Kc adimensional, regiones de ejemplo declaradas | Regla publicada; baja confianza local. Índice Kc·día y score relativo propios de esta demo; no demanda real de riego ni salud de suelo. |
| [IDIAF, compendio habichuela](https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf) | Contexto arroz–habichuela del inventario del equipo | 2013; referencia agrícola dominicana | Documento no descargado/revisado en esta continuación; pertinencia local sin verificar. No se extraen reglas de plagas ni cifras del compendio. |

Landsat: EROS Center (2020), *Landsat 8–9 OLI/TIRS Level-2, Collection 2*, [DOI 10.5066/P9OGBGM6](https://doi.org/10.5066/P9OGBGM6). USGS permite uso de los productos sin restricciones, con atribución. El servicio de extracción es [Microsoft Planetary Computer STAC](https://planetarycomputer.microsoft.com/api/stac/v1/); las respuestas originales y URLs exactas se conservan en caché, sin firmas ni credenciales.

NASA POWER y GIBS se atribuyen a NASA; imágenes de observación de la Tierra, sin imágenes de personas ni marcas promocionales. Referencia FAO citada; solo coeficientes y duraciones numéricos necesarios, sin reproducir el capítulo. Código de aplicación bajo la licencia del repositorio; dependencias conservan sus propias licencias (Next.js/React/Tailwind/shadcn/ui/AI SDK: MIT; MapLibre GL JS: BSD-3-Clause).

Las áreas son polígonos sintéticos explícitos, no observaciones de límites agrícolas. Las otras dos rotaciones son propuestas ilustrativas sin validación. No están incluidas series de precios MA limpias, relaciones de plagas IDIAF verificadas, ETo ni suelo local: esos scores no se fabrican.

`web/public/data/manifest.json` enumera los artefactos con SHA-256. Cabeceras incompatibles con JSON/GeoJSON/JPEG/PNG se documentan aquí y en `AI_USAGE.md`: scripts/ensamblaje asistidos por Codex/OpenAI, 14-11-2026; valores e imágenes provienen de las fuentes citadas, no de IA generativa. Revisión de Frainer pendiente.

## Mercado incorporado en rama de envío

Actualización asistida por Codex/OpenAI, 14-11-2026; revisión de Frainer pendiente. Se añade la [fuente oficial MA y método](../scripts/market/README.md), caché original 2017–2026 y `data/derived/market_prices.json` con 4,037 observaciones, 926 medias mensuales y siete series estacionales preliminares. El derivado aún no está conectado a `web/`: el score de mercado de la aplicación continúa null. La ausencia de precios indicada arriba describe la demo web anterior, no la disponibilidad del nuevo artefacto. Precios de Santo Domingo, no en finca; licencia de redistribución por confirmar.

## Fotografía natural en onboarding

- **Archivo:** `web/public/images/san-juan-valley.jpg` (caché local offline, incluida en `web/scripts/offline-assets.mjs`).
- **Fuente y licencia:** Wikimedia Commons — [File:El Cercado Dominican Republic rural countryside 2.jpg](https://commons.wikimedia.org/wiki/File:El_Cercado_Dominican_Republic_rural_countryside_2.jpg), autoría `Cercadero98`, dominio público / **CC0 1.0**. Fotografía documental real de campo rural en la provincia San Juan; no generada por IA.
