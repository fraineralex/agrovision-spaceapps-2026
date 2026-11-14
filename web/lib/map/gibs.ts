/* AI: Grok (xAI), 2026-11-14; Frainer review pending. */
export type GibsOverlay = {
  id: string;
  label: string;
  maxNativeZoom: number;
  detail: string;
};

export const GIBS_WMS = "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi";

export const gibsOverlays: GibsOverlay[] = [
  { id: "MODIS_Terra_NDVI_8Day", label: "NDVI", maxNativeZoom: 9, detail: "MODIS Terra · 8 días · 250 m · visualización" },
  { id: "IMERG_Precipitation_Rate", label: "Lluvia", maxNativeZoom: 6, detail: "GPM IMERG · ~10 km · mm/h · visualización" },
  { id: "SMAP_L4_Analyzed_Surface_Soil_Moisture", label: "SMAP", maxNativeZoom: 6, detail: "SMAP L4 · humedad superficial · 9 km · visualización" },
];

export const DEFAULT_GIBS_DATE = "2026-05-14";

export function gibsWmsTile(layer: string, time: string) {
  const query = [
    "SERVICE=WMS",
    "VERSION=1.3.0",
    "REQUEST=GetMap",
    "FORMAT=image/png",
    "TRANSPARENT=TRUE",
    `LAYERS=${layer}`,
    "STYLES=",
    "CRS=EPSG:3857",
    `TIME=${time}`,
    "WIDTH=256",
    "HEIGHT=256",
    "BBOX={bbox-epsg-3857}",
  ].join("&");
  return `${GIBS_WMS}?${query}`;
}
