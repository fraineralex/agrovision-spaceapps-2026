/* AI: Grok (xAI), 2026-11-14; Frainer review pending. */
export type BasemapId = "imagery" | "sentinel";

export const ESRI_IMAGERY_TILES = ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"];
export const ESRI_ATTRIBUTION = "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";
export const EOX_SENTINEL_TILES = ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg"];
export const EOX_ATTRIBUTION = "Sentinel-2 cloudless 2024 © EOX (s2maps.eu) — contains modified Copernicus Sentinel data";
export const ESRI_LABEL_TILES = ["https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"];

export const basemaps: { id: BasemapId; label: string }[] = [
  { id: "imagery", label: "Esri" },
  { id: "sentinel", label: "Sentinel-2" },
];
