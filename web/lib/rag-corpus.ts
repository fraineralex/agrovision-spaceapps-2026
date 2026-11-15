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
];