/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import path from "node:path";

export type CorpusDoc = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl?: string;
  filePath: string;
  absolutePath: string;
};

const root = path.resolve(process.cwd(), "..");

function doc(
  id: string,
  title: string,
  sourceName: string,
  rel: string,
  sourceUrl?: string,
): CorpusDoc {
  return { id, title, sourceName, sourceUrl, filePath: rel, absolutePath: path.join(root, rel) };
}

export const corpusDocs: CorpusDoc[] = [
  doc("data-sources", "Fuentes de la demo", "AgroVision / NASA y socios", "docs/DATA_SOURCES.md"),
  doc("methodology", "Metodología AgroVision", "AgroVision", "docs/METHODOLOGY.md"),
  doc("asesor", "Asesor de siembra y mercado", "AgroVision", "docs/16_asesor_siembra.md"),
  doc("farmer-pillars-doc", "Pilares del productor", "AgroVision", "docs/12_farmer_pillars.md"),
  doc("water-climate", "Agua y clima", "AgroVision", "docs/11_water_climate_method.md"),
  doc("plan-fincas", "Fincas, lluvia y GIEWS", "AgroVision", "docs/13_plan_fincas_y_tarjetas.md"),
  doc("recursos", "Recursos de datos", "AgroVision", "docs/02_recursos_datos.md"),
  doc("resumen-equipo", "Resumen del equipo", "Equipo AgroVision", "docs/fuentes_equipo/resumen_equipo.txt"),
  doc("inventario", "Inventario de datos", "Equipo AgroVision", "docs/fuentes_equipo/inventario_datos.txt"),
  doc("market-readme", "Precios mayoristas MA", "Ministerio de Agricultura RD", "scripts/market/README.md", "https://agricultura.gob.do/transparencia/categoria/informe-precios-de-mercado-interdiario-2017-2025/"),
  doc("fao56", "Coeficientes FAO-56", "FAO", "data/cache/fao56-crops.json", "https://www.fao.org/4/x0490e/x0490e0b.htm"),
  doc("market-insights", "Mercado y costos 2019", "Ministerio de Agricultura RD", "web/public/data/market-insights.json", "https://agricultura.gob.do/wp-content/uploads/2022/09/Costos-Estimados-de-Produccin-de-Cultivos-Agrcolas-2019.pdf"),
  doc("fao-giews", "Sequía FAO GIEWS", "FAO GIEWS", "web/public/data/fao-giews.json", "https://www.fao.org/giews/earthobservation/country/index.jsp?lang=es&code=DOM"),
  doc("farmer-pillars", "Rotaciones San Juan", "AgroVision / NASA POWER", "web/public/data/farmer-pillars.json"),
  doc("ndvi-series", "Muestra Landsat NDVI", "USGS/NASA Landsat", "web/public/data/ndvi-series.json", "https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-reflectance"),
  doc("cedaf-crop-guides", "Guías CEDAF de arroz y guandul: siembra, variedades y cosecha", "CEDAF", "data/rag-corpus/cedaf-crop-guides-excerpts.md", "https://www.cedaf.org.do/guias-tecnicas/"),
  doc("cedaf-plantain-cassava", "CEDAF guías técnicas de plátano y yuca", "CEDAF", "data/rag-corpus/cedaf-plantain-cassava.md", "https://www.cedaf.org.do/guias-tecnicas/"),
  doc("idiaf-bean-compendium", "Compendio IDIAF: manejo integrado de habichuela en República Dominicana", "IDIAF", "data/rag-corpus/idiaf-habichuela-compendio.txt", "https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf"),
  doc("idiaf-bean-practices", "Compendio IDIAF: siembra y manejo de habichuela en San Juan", "IDIAF", "data/rag-corpus/idiaf-habichuela-practices.md", "https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf"),
  doc("nasa-data-guides", "NASA para agricultores: POWER, IMERG, SMAP, GIBS y Landsat", "NASA Earthdata / POWER / GPM / USGS", "data/rag-corpus/nasa-earth-data-guides.md", "https://power.larc.nasa.gov/docs/tutorials/data-access-viewer/quick-start/"),
  doc("rotation-best4soil", "Rotación de cultivos: información práctica", "Best4Soil — Houben et al.", "data/rag-corpus/best4soil.md", "https://orgprints.org/id/eprint/43540/7/ES_ROTACIO%CC%81N%20DE%20CULTIVOS_%20INFORMACIO%CC%81N%20PR%C3%81CTICA.pdf"),
  doc("rotation-ekonekazaritza", "Rotaciones y asociaciones de cultivos", "Ekonekazaritza — Sauca Ibiricu y Urabayen Aróstegui", "data/rag-corpus/ekone.md", "https://agricultura.gencat.cat/web/.content/03-agricultura/pae/publicacions-material-referencia/produccions-agricoles/hortalisses/rotacions_cultius_horticoles.pdf"),
  doc("rotation-uchile", "Rotación de cultivos", "Universidad de Chile — Silva, Vergara y Acevedo", "data/rag-corpus/uchile.md", "https://bibliotecadigital.ciren.cl/bitstream/20.500.13082/31852/1/Boletin_INIA_385.pdf"),
  doc("rotation-sekhar", "Crop rotation and intercropping techniques", "Sekhar et al. / ND Global Publication House", "data/rag-corpus/sekhar.md", "https://doi.org/10.5281/zenodo.11051201"),
];
