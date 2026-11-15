/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { parcelCollection as parcels, parcelFillColor } from "@/lib/map/parcels";
import boundaries from "@/public/data/provinces.json";
import { isInCountry, type Location } from "@/lib/geography";
import sample from "@/public/data/gibs-sample.json";
import { Button } from "@/components/ui/button";
import { ESRI_IMAGERY_TILES, ESRI_LABEL_TILES, ESRI_ATTRIBUTION } from "@/lib/map/basemaps";
import { FIELDS_URL, type FieldInfo } from "@/lib/map/fields";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = { selected: string; onSelect: (id: string) => void; location: Location; onLocation: (point:Location) => void; onField?: (field: FieldInfo) => void; advanced?: boolean };
const layers = [
  { id: "MODIS_Terra_NDVI_8Day", label: "NDVI", level: 9, detail: "MODIS Terra · visualización de 8 días · 250 m · NDVI sin unidad; baja confianza a escala de parcela" },
  { id: "IMERG_Precipitation_Rate", label: "Lluvia IMERG", level: 6, detail: "GPM IMERG · visualización diaria · ~10 km · mm/h; contexto regional" },
];
function tileCoordinates(tile: typeof sample.tiles[number]): [[number, number], [number, number], [number, number], [number, number]] {
  const longitude = (x: number) => x / 2 ** tile.zoom * 360 - 180;
  const latitude = (y: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** tile.zoom))) * 180 / Math.PI;
  return [[longitude(tile.x), latitude(tile.y)], [longitude(tile.x + 1), latitude(tile.y)], [longitude(tile.x + 1), latitude(tile.y + 1)], [longitude(tile.x), latitude(tile.y + 1)]];
}
export function MapPanel({ selected, onSelect, location, onLocation, onField, advanced = false }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [activeLayer, setActiveLayer] = useState("");
  const [remote, setRemote] = useState(false);
  const [opacity, setOpacity] = useState(0.4);
  const [date, setDate] = useState("2026-11-01");
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  useEffect(() => {
    let disposed = false;
    void import("maplibre-gl").then((module) => {
      if (disposed || !container.current) return;
      module.setWorkerUrl(new URL("/vendor/maplibre-gl-worker.mjs", window.location.origin).href);
      const instance = new module.Map({ container: container.current, style: { version: 8, sources: { imagery: { type: "raster", tiles: ESRI_IMAGERY_TILES, tileSize: 256, maxzoom: 19, attribution: ESRI_ATTRIBUTION }, labels: { type: "raster", tiles: ESRI_LABEL_TILES, tileSize: 256, maxzoom: 19, attribution: "Esri" } }, layers: [{ id: "background", type: "background", paint: { "background-color": "#e1e9e1" } }, { id: "esri-imagery", type: "raster", source: "imagery" }] }, center: [-70.2, 18.8], zoom: 7.3, maxZoom: 19, pitch: 0, locale: {"Map.Title":"Mapa","NavigationControl.ZoomIn":"Acercar","NavigationControl.ZoomOut":"Alejar","NavigationControl.ResetBearing":"Orientar al norte","AttributionControl.MapFeedback":"Comentarios del mapa","AttributionControl.ToggleAttribution":"Mostrar fuentes"}, attributionControl: {}, canvasContextAttributes: { preserveDrawingBuffer: true } });
      map.current = instance;
      instance.fitBounds([[-72.05,17.4],[-68.2,19.95]],{padding:24,maxZoom:7.3,duration:0});
      instance.on("idle", () => {
        setMapLoaded(true);
        container.current?.setAttribute("data-rendered-parcels", String(instance.queryRenderedFeatures({ layers: ["parcels"] }).length));
      });
      instance.on("error", () => setError("Imágenes remotas no disponibles. El contexto NASA guardado está disponible al alejar el mapa. Esri requiere conexión."));
      instance.on("load", () => {
        if (disposed) return;
        for (const tile of [...sample.tiles].sort((a, b) => Number(b.id.startsWith("BlueMarble")) - Number(a.id.startsWith("BlueMarble")) || a.zoom - b.zoom)) {
          const corners = tileCoordinates(tile);
          instance.addSource(tile.id, { type: "raster", tiles: [`/data/${tile.file}`], tileSize: 256,
            minzoom: tile.zoom, maxzoom: tile.zoom,
            bounds: [corners[0][0], corners[2][1], corners[2][0], corners[0][1]], attribution: "NASA EOSDIS GIBS" });
          instance.addLayer({ id: `cached-${tile.id}`, type: "raster", source: tile.id, layout: { visibility: tile.id.startsWith("BlueMarble") ? "visible" : "none" }, maxzoom: tile.id.startsWith("BlueMarble") ? 10 : 24, paint: { "raster-opacity": tile.id.startsWith("BlueMarble") ? 1 : 0.65, "raster-fade-duration": 0 } }, tile.id.startsWith("BlueMarble") ? "esri-imagery" : undefined);
        }
        instance.addSource("provinces", { type:"geojson", data:boundaries as GeoJSON.FeatureCollection });
        instance.addLayer({ id:"province-fill",type:"fill",source:"provinces",paint:{"fill-color":"#9cae6b","fill-opacity":["interpolate",["linear"],["zoom"],7,.06,11,0]} });
        instance.addLayer({ id:"province-lines",type:"line",source:"provinces",paint:{"line-color":"#eef5d5","line-width":1.5} });
        instance.addSource("point", {type:"geojson",data:{type:"FeatureCollection",features:[]}});
        instance.addLayer({id:"selected-point",type:"circle",source:"point",paint:{"circle-radius":10,"circle-color":"#fff3a2","circle-stroke-color":"#133d2c","circle-stroke-width":4}});
        instance.on("click", event => { if (instance.queryRenderedFeatures(event.point,{layers:["parcels","fields-fill"].filter(l=>instance.getLayer(l))}).length) return; const point={longitude:event.lngLat.lng,latitude:event.lngLat.lat}; if (isInCountry(point)) { onLocation(point);setError(""); } else setError("Selecciona un punto terrestre de República Dominicana."); });
        instance.addSource("parcels", { type: "geojson", promoteId: "parcelId", data: parcels as GeoJSON.FeatureCollection });
        instance.addLayer({ id: "parcels", type: "fill", source: "parcels", minzoom: 11, paint: { "fill-color": parcelFillColor(), "fill-opacity": 0.18 } });
        instance.addLayer({ id: "outlines", type: "line", source: "parcels", minzoom: 11, paint: { "line-color": parcelFillColor(), "line-width": 1.8 } });
        instance.on("click", "parcels", (event) => { const id = event.features?.[0]?.properties?.parcelId; if (id) onSelect(String(id)); });
        instance.on("mouseenter", "parcels", () => { instance.getCanvas().style.cursor = "pointer"; });
        instance.on("mouseleave", "parcels", () => { instance.getCanvas().style.cursor = ""; });
        instance.addSource("fields", { type: "geojson", data: FIELDS_URL });
        instance.addLayer({ id: "fields-fill", type: "fill", source: "fields", minzoom: 13, paint: { "fill-color": "#fff3a2", "fill-opacity": 0.08 } });
        instance.addLayer({ id: "fields-line", type: "line", source: "fields", minzoom: 13, paint: { "line-color": "#fff3a2", "line-width": 2 } });
        instance.on("click", "fields-fill", (event) => { const f = event.features?.[0]; const p = f?.properties; if (!p) return; const center = typeof p.centroid === "string" ? JSON.parse(p.centroid) : p.centroid; onField?.({ id: String(p.id), areaHa: Number(p.area_ha), center, confidence: Number(p.confidence) }); });
        instance.on("mouseenter", "fields-fill", () => { instance.getCanvas().style.cursor = "pointer"; });
        instance.on("mouseleave", "fields-fill", () => { instance.getCanvas().style.cursor = ""; });
        instance.addLayer({id:"esri-labels",type:"raster",source:"labels",paint:{"raster-opacity":.85}});
        instance.addControl(new module.NavigationControl({ visualizePitch: true }), "top-right");
        setMapReady(true);
      });
    }).catch(() => setError("Mapa no disponible. Selecciona una provincia con los controles."));
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, [onSelect, onLocation, onField]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !mapReady) return;
    instance.setPaintProperty("outlines", "line-width", ["case", ["==", ["get", "parcelId"], selected], 4, 1.8]);
    instance.setPaintProperty("parcels", "fill-opacity", ["case", ["==", ["get", "parcelId"], selected], 0.45, 0.18]);
    const source = instance.getSource("point") as import("maplibre-gl").GeoJSONSource;
    source.setData({type:"FeatureCollection",features:[{type:"Feature",properties:{},geometry:{type:"Point",coordinates:[location.longitude,location.latitude]}}]});
    // Keep the initial country view. Fly only after an explicit selection changes location.
    if (location.longitude !== -70.2 || location.latitude !== 18.8) instance.flyTo({center:[location.longitude,location.latitude],zoom: selected === "location" ? 10 : 15,pitch:0,duration:700});
  }, [selected, location.longitude, location.latitude, mapReady]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !mapReady) return;
    if (instance.getLayer("remote-layer")) instance.removeLayer("remote-layer");
    if (instance.getSource("remote")) instance.removeSource("remote");
    layers.forEach((layer) => {
      instance.setLayoutProperty(`cached-${layer.id}`, "visibility", advanced && activeLayer === layer.id && (!remote || date === "2026-11-01") ? "visible" : "none");
      instance.setPaintProperty(`cached-${layer.id}`, "raster-opacity", opacity);
    });
    const layer = layers.find((item) => item.id === activeLayer);
    if (advanced && remote && layer) {
      instance.addSource("remote", { type: "raster", tileSize: 256, maxzoom: layer.level, attribution: "NASA EOSDIS GIBS", tiles: [`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer.id}/default/${date}/GoogleMapsCompatible_Level${layer.level}/{z}/{y}/{x}.png`] });
      instance.addLayer({ id: "remote-layer", type: "raster", source: "remote", paint: { "raster-opacity": opacity } }, "parcels");
    }
  }, [activeLayer, remote, date, opacity, mapReady, advanced]);
  const layer = layers.find((item) => item.id === activeLayer);
  return <>
    <div className="map-wrap"><div id="map" role="region" data-loaded={mapLoaded} ref={container} aria-label="Mapa de República Dominicana; toca para seleccionar tu zona" />
      {!mapReady && <div className="map-fallback"><strong>República Dominicana</strong><p>Preparando mapa… Puedes seleccionar una provincia arriba.</p></div>}
    </div>
    <div className="map-views-below"><Button variant="outline" onClick={() => map.current?.fitBounds([[-72.05,17.4],[-68.2,19.95]],{padding:24,maxZoom:7.3})}>Todo el país</Button><Button variant="outline" onClick={() => map.current?.flyTo({ center: [-71.26, 18.79], zoom: 14, pitch: 0 })}>Ver fincas de San Juan</Button></div>
    {advanced && <details className="map-caption"><summary>Más capas de la NASA</summary><div className="map-foot"><div className="layer-row">{layers.map((item) => <button aria-pressed={activeLayer === item.id} key={item.id} className={`layer-toggle ${activeLayer === item.id ? "active" : ""}`} onClick={() => { setActiveLayer(activeLayer === item.id ? "" : item.id); setError(""); }}>{item.label}</button>)}</div><label><input type="checkbox" checked={remote} onChange={(event) => { setRemote(event.target.checked); setError(""); }} /> Ver imagen más reciente (requiere internet)</label></div></details>}
    <p className="map-caption">Toca tu finca en el mapa. Líneas amarillas: fincas aproximadas detectadas por satélite (no catastrales). Colores: verdor de la vegetación.</p>
    <div className="pillar-legend" aria-label="Verdor de parcelas"><span><i className="light red"/>Verdor bajo</span><span><i className="light amber"/>Intermedio</span><span><i className="light green"/>Alto</span><span><i className="light gray"/>Sin datos</span></div>
    {advanced && activeLayer && <label className="timeline">Opacidad NASA <input aria-label="Opacidad NASA" type="range" min="0" max="0.8" step="0.05" value={opacity} onChange={event => setOpacity(Number(event.target.value))}/></label>}
    {advanced && remote && <label className="timeline">Fecha de imagen <input aria-label="Fecha de imagen" type="date" min="2026-10-01" max="2026-11-10" value={date} onChange={(event) => setDate(event.target.value)} /></label>}
    <details className="map-caption"><summary>Fuentes del mapa y estado de imágenes</summary><div aria-live="polite">{error || (remote ? `Imagen en línea solicitada: ${date}. Si falla se conserva la imagen guardada.` : "Esri World Imagery · detalle hasta zoom 19 · requiere conexión. Contexto NASA guardado · 2026-11-01 · sin conexión al alejar.")}<br />{layer?.detail ?? "Esri / Maxar / Earthstar Geographics; fechas de captura variables, sin verificar por parcela. NASA Blue Marble solo como contexto sin conexión."}<br />{layer && "Colores de visualización NASA; no se infieren valores numéricos. "}Límites generales geoBoundaries / Natural Earth (2022, dominio público), no catastrales. © NASA EOSDIS GIBS.</div></details>
  </>;
}
