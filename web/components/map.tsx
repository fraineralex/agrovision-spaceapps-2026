/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import parcels from "@/public/data/demo-parcels.json";
import boundaries from "@/public/data/provinces.json";
import { isInCountry, type Location } from "@/lib/geography";
import sample from "@/public/data/gibs-sample.json";
import { Button } from "@/components/ui/button";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = { selected: string; onSelect: (id: string) => void; location: Location; onLocation: (point:Location) => void };
const layers = [
  { id: "MODIS_Terra_NDVI_8Day", label: "NDVI", level: 9, detail: "MODIS Terra · visualización de 8 días · 250 m · NDVI sin unidad; baja confianza a escala de parcela" },
  { id: "IMERG_Precipitation_Rate", label: "Lluvia IMERG", level: 6, detail: "GPM IMERG · visualización diaria · ~10 km · mm/h; contexto regional" },
];
function tileCoordinates(tile: typeof sample.tiles[number]): [[number, number], [number, number], [number, number], [number, number]] {
  const longitude = (x: number) => x / 2 ** tile.zoom * 360 - 180;
  const latitude = (y: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** tile.zoom))) * 180 / Math.PI;
  return [[longitude(tile.x), latitude(tile.y)], [longitude(tile.x + 1), latitude(tile.y)], [longitude(tile.x + 1), latitude(tile.y + 1)], [longitude(tile.x), latitude(tile.y + 1)]];
}
export function MapPanel({ selected, onSelect, location, onLocation }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [activeLayer, setActiveLayer] = useState("");
  const [remote, setRemote] = useState(false);
  const [date, setDate] = useState("2026-11-01");
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  useEffect(() => {
    let disposed = false;
    void import("maplibre-gl").then((module) => {
      if (disposed || !container.current) return;
      module.setWorkerUrl(new URL("/vendor/maplibre-gl-worker.mjs", window.location.origin).href);
      const instance = new module.Map({ container: container.current, style: { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#e1e9e1" } }] }, center: [-70.2, 18.8], zoom: 7.3, locale: {"Map.Title":"Mapa","NavigationControl.ZoomIn":"Acercar","NavigationControl.ZoomOut":"Alejar","AttributionControl.ToggleAttribution":"Mostrar fuentes"}, attributionControl: {}, canvasContextAttributes: { preserveDrawingBuffer: true } });
      map.current = instance;
      instance.fitBounds([[-72.05,17.4],[-68.2,19.95]],{padding:24,maxZoom:7.3,duration:0});
      instance.on("idle", () => {
        setMapLoaded(true);
        container.current?.setAttribute("data-rendered-parcels", String(instance.queryRenderedFeatures({ layers: ["parcels"] }).length));
      });
      instance.on("error", () => setError("Imágenes remotas no disponibles. Se conservan las imágenes NASA guardadas."));
      instance.on("load", () => {
        if (disposed) return;
        for (const tile of [...sample.tiles].sort((a, b) => Number(b.id.startsWith("BlueMarble")) - Number(a.id.startsWith("BlueMarble")) || a.zoom - b.zoom)) {
          const corners = tileCoordinates(tile);
          instance.addSource(tile.id, { type: "raster", tiles: [`/data/${tile.file}`], tileSize: 256,
            minzoom: tile.zoom, maxzoom: tile.zoom,
            bounds: [corners[0][0], corners[2][1], corners[2][0], corners[0][1]], attribution: "NASA EOSDIS GIBS" });
          instance.addLayer({ id: `cached-${tile.id}`, type: "raster", source: tile.id, layout: { visibility: tile.id.startsWith("BlueMarble") ? "visible" : "none" }, paint: { "raster-opacity": tile.id.startsWith("BlueMarble") ? 1 : 0.65, "raster-fade-duration": 0 } });
        }
        instance.addSource("provinces", { type:"geojson", data:boundaries as GeoJSON.FeatureCollection });
        instance.addLayer({ id:"province-fill",type:"fill",source:"provinces",paint:{"fill-color":"#9cae6b","fill-opacity":.12} });
        instance.addLayer({ id:"province-lines",type:"line",source:"provinces",paint:{"line-color":"#eef5d5","line-width":1.5} });
        instance.addSource("point", {type:"geojson",data:{type:"FeatureCollection",features:[]}});
        instance.addLayer({id:"selected-point",type:"circle",source:"point",paint:{"circle-radius":10,"circle-color":"#fff3a2","circle-stroke-color":"#133d2c","circle-stroke-width":4}});
        instance.on("click", event => { if (instance.queryRenderedFeatures(event.point,{layers:["parcels"]}).length) return; const point={longitude:event.lngLat.lng,latitude:event.lngLat.lat}; if (isInCountry(point)) { onLocation(point);setError(""); } else setError("Selecciona un punto terrestre de República Dominicana."); });
        instance.addSource("parcels", { type: "geojson", promoteId: "parcelId", data: parcels as GeoJSON.FeatureCollection });
        instance.addLayer({ id: "parcels", type: "fill", source: "parcels", paint: { "fill-color": "#55bd8c", "fill-opacity": 0.7 } });
        instance.addLayer({ id: "outlines", type: "line", source: "parcels", paint: { "line-color": "#0c3e29", "line-width": 2 } });
        for (const feature of parcels.features) {
          const ring = feature.geometry.coordinates[0];
          const button = document.createElement("button");
          button.className = "parcel-marker"; button.textContent = `Área ${String.fromCharCode(65+parcels.features.indexOf(feature))}`;
          button.setAttribute("aria-label", `Seleccionar área de ejemplo ${String.fromCharCode(65+parcels.features.indexOf(feature))}`);
          button.onclick = () => onSelect(feature.id);
          const showMarker = () => {button.style.display=instance.getZoom()>=9?"block":"none";};
          showMarker();instance.on("zoom",showMarker);
          new module.Marker({ element: button, anchor: "bottom" }).setLngLat([ring[0][0] + .005, ring[0][1] + .008]).addTo(instance);
        }
        instance.on("click", "parcels", (event) => { const id = event.features?.[0]?.id; if (id) onSelect(String(id)); });
        instance.addControl(new module.NavigationControl({ showCompass: false }), "top-right");
        setMapReady(true);
      });
    }).catch(() => setError("Mapa no disponible. Selecciona una provincia con los controles."));
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, [onSelect, onLocation]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !mapReady) return;
    instance.setPaintProperty("parcels", "fill-color", ["case", ["==", ["id"], selected], "#fff0a4", "#55bd8c"]);
    const source = instance.getSource("point") as import("maplibre-gl").GeoJSONSource;
    source.setData({type:"FeatureCollection",features:[{type:"Feature",properties:{},geometry:{type:"Point",coordinates:[location.longitude,location.latitude]}}]});
    // Keep the initial country view. Fly only after an explicit selection changes location.
    if (location.longitude !== -70.2 || location.latitude !== 18.8) instance.easeTo({center:[location.longitude,location.latitude],zoom: selected === "location" ? 8 : 11,duration:400});
  }, [selected, location.longitude, location.latitude, mapReady]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !mapReady) return;
    if (instance.getLayer("remote-layer")) instance.removeLayer("remote-layer");
    if (instance.getSource("remote")) instance.removeSource("remote");
    layers.forEach((layer) => instance.setLayoutProperty(`cached-${layer.id}`, "visibility", activeLayer === layer.id ? "visible" : "none"));
    const layer = layers.find((item) => item.id === activeLayer);
    if (remote && layer) {
      instance.addSource("remote", { type: "raster", tileSize: 256, maxzoom: layer.level, attribution: "NASA EOSDIS GIBS", tiles: [`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer.id}/default/${date}/GoogleMapsCompatible_Level${layer.level}/{z}/{y}/{x}.png`] });
      instance.addLayer({ id: "remote-layer", type: "raster", source: "remote", paint: { "raster-opacity": .65 } }, "parcels");
    }
  }, [activeLayer, remote, date, mapReady]);
  const layer = layers.find((item) => item.id === activeLayer);
  return <>
    <div className="map-wrap"><div id="map" data-loaded={mapLoaded} ref={container} aria-label="Mapa de República Dominicana; toca para seleccionar tu zona" />
      {!mapReady && <div className="map-fallback"><strong>República Dominicana</strong><p>Límites aproximados de ejemplo</p>{parcels.features.map((feature) => <Button size="sm" variant="outline" key={feature.id} onClick={() => onSelect(feature.id)}>{`Área ${String.fromCharCode(65+parcels.features.indexOf(feature))}`}</Button>)}</div>}
      <div className="map-views"><Button size="sm" variant="outline" onClick={() => map.current?.fitBounds([[-72.05,17.4],[-68.2,19.95]],{padding:24,maxZoom:7.3})}>Todo el país</Button><Button size="sm" variant="outline" onClick={() => map.current?.flyTo({ center: [-71.23, 18.8], zoom: 11 })}>Ejemplos San Juan</Button></div>
    </div>
    <div className="map-foot"><div className="layer-row">{layers.map((item) => <button aria-pressed={activeLayer === item.id} key={item.id} className={`layer-toggle ${activeLayer === item.id ? "active" : ""}`} onClick={() => { setActiveLayer(activeLayer === item.id ? "" : item.id); setError(""); }}>{item.label}</button>)}</div><label><input type="checkbox" checked={remote} onChange={(event) => { setRemote(event.target.checked); setError(""); }} /> Imágenes en línea</label></div>
    {remote && <label className="timeline">Fecha de imagen <input aria-label="Fecha de imagen" type="date" min="2026-10-01" max="2026-11-10" value={date} onChange={(event) => setDate(event.target.value)} /></label>}
    <details className="map-caption"><summary>Fuentes del mapa y estado de imágenes</summary><div aria-live="polite">{error || (remote ? `Imagen en línea solicitada: ${date}. Si falla se conserva la imagen guardada.` : "Imágenes NASA guardadas · 2026-11-01 · disponibles sin conexión.")}<br />{layer?.detail ?? "NASA Blue Marble · contexto estático; no es una imagen actual de la parcela."}<br />{layer && "Colores de visualización NASA; no se infieren valores numéricos. "}Límites generales geoBoundaries / Natural Earth (2022, dominio público), no catastrales. © NASA EOSDIS GIBS.</div></details>
  </>;
}
