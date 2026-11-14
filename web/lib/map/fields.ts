/* AI: Claude (Anthropic), 2026-11-14 — MobileSAM field candidates for the map (loaded lazily by URL). Frainer review pending. */
export const FIELDS_URL = "/data/fields_san_juan.geojson";
export type FieldInfo = { id: string; areaHa: number; center: [number, number]; confidence: number };
export const fieldMeta = {
  method: "MobileSAM (vit_t) sobre Esri World Imagery zoom 17, filtrado con ESA WorldCover 2021; bordes aproximados.",
  attribution: "Fuente: Esri, Vantor, Earthstar Geographics y la comunidad de usuarios GIS; ESA WorldCover 2021 v200.",
  limitations: "No son límites catastrales ni identifican dueños. Cobertura parcial del valle (10 de 42 ventanas procesadas). Validación de campo pendiente.",
  docs: "docs/12_field_boundaries_method.md",
};
