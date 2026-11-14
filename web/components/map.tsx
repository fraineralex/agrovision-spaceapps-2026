/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import parcels from "@/public/data/demo-parcels.json";
import sample from "@/public/data/gibs-sample.json";
import { Button } from "@/components/ui/button";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = { selected: string; onSelect: (id: string) => void };
const layers = [
  { id: "MODIS_Terra_NDVI_8Day", label: "NDVI", level: 9, detail: "MODIS Terra · 8-day visualization · 250 m · unitless NDVI; low parcel confidence" },
  { id: "IMERG_Precipitation_Rate", label: "IMERG rain", level: 6, detail: "GPM IMERG · daily visualization · ~10 km · mm/hour; regional context" },
];
function tileCoordinates(tile: typeof sample.tiles[number]): [[number, number], [number, number], [number, number], [number, number]] {
  const longitude = (x: number) => x / 2 ** tile.zoom * 360 - 180;
  const latitude = (y: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** tile.zoom))) * 180 / Math.PI;
  return [[longitude(tile.x), latitude(tile.y)], [longitude(tile.x + 1), latitude(tile.y)], [longitude(tile.x + 1), latitude(tile.y + 1)], [longitude(tile.x), latitude(tile.y + 1)]];
}
export function MapPanel({ selected, onSelect }: Props) {
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
      module.setWorkerUrl(new URL("/vendor/maplibre-gl-worker.mjs", location.origin).href);
      const instance = new module.Map({ container: container.current, style: { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#e1e9e1" } }] }, center: [-71.23, 18.8], zoom: 10.3, attributionControl: {}, canvasContextAttributes: { preserveDrawingBuffer: true } });
      map.current = instance;
      instance.on("idle", () => {
        setMapLoaded(true);
        container.current?.setAttribute("data-rendered-parcels", String(instance.queryRenderedFeatures({ layers: ["parcels"] }).length));
      });
      instance.on("error", () => setError("Remote imagery unavailable. Cached NASA imagery and demo areas remain available."));
      instance.on("load", () => {
        if (disposed) return;
        for (const tile of [...sample.tiles].sort((a, b) => Number(b.id.startsWith("BlueMarble")) - Number(a.id.startsWith("BlueMarble")) || a.zoom - b.zoom)) {
          const corners = tileCoordinates(tile);
          instance.addSource(tile.id, { type: "raster", tiles: [`/data/${tile.file}`], tileSize: 256,
            minzoom: tile.zoom, maxzoom: tile.zoom,
            bounds: [corners[0][0], corners[2][1], corners[2][0], corners[0][1]], attribution: "NASA EOSDIS GIBS" });
          instance.addLayer({ id: `cached-${tile.id}`, type: "raster", source: tile.id, layout: { visibility: tile.id.startsWith("BlueMarble") ? "visible" : "none" }, paint: { "raster-opacity": tile.id.startsWith("BlueMarble") ? 1 : 0.65, "raster-fade-duration": 0 } });
        }
        instance.addSource("parcels", { type: "geojson", promoteId: "parcelId", data: parcels as GeoJSON.FeatureCollection });
        instance.addLayer({ id: "parcels", type: "fill", source: "parcels", paint: { "fill-color": "#55bd8c", "fill-opacity": 0.7 } });
        instance.addLayer({ id: "outlines", type: "line", source: "parcels", paint: { "line-color": "#0c3e29", "line-width": 2 } });
        for (const feature of parcels.features) {
          const ring = feature.geometry.coordinates[0];
          const button = document.createElement("button");
          button.className = "parcel-marker"; button.textContent = feature.properties.name;
          button.setAttribute("aria-label", `Select ${feature.properties.name}`);
          button.onclick = () => onSelect(feature.id);
          new module.Marker({ element: button, anchor: "bottom" }).setLngLat([ring[0][0] + .005, ring[0][1] + .008]).addTo(instance);
        }
        instance.on("click", "parcels", (event) => { const id = event.features?.[0]?.id; if (id) onSelect(String(id)); });
        instance.addControl(new module.NavigationControl({ showCompass: false }), "top-right");
        setMapReady(true);
      });
    }).catch(() => setError("Map rendering unavailable. Select a demo area using the local controls."));
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, [onSelect]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !mapReady) return;
    instance.setPaintProperty("parcels", "fill-color", ["case", ["==", ["id"], selected], "#fff0a4", "#55bd8c"]);
    const feature = parcels.features.find((item) => item.id === selected)!;
    const point = feature.geometry.coordinates[0][0];
    instance.easeTo({ center: [point[0] + .005, point[1] + .004], duration: 400 });
  }, [selected, mapReady]);
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
    <div className="map-wrap"><div id="map" data-loaded={mapLoaded} ref={container} aria-label="Map centered on the San Juan Valley" />
      {!mapReady && <div className="map-fallback"><strong>San Juan Valley · local case</strong><p>Approximate demo boundaries</p>{parcels.features.map((feature) => <Button size="sm" variant="outline" key={feature.id} onClick={() => onSelect(feature.id)}>{feature.properties.name}</Button>)}</div>}
      <div className="map-views"><Button size="sm" variant="outline" onClick={() => map.current?.flyTo({ center: [-70.5, 18.9], zoom: 6.3 })}>Dominican Republic</Button><Button size="sm" variant="outline" onClick={() => map.current?.flyTo({ center: [-71.23, 18.8], zoom: 10.3 })}>San Juan</Button></div>
    </div>
    <div className="map-foot"><div className="layer-row">{layers.map((item) => <button aria-pressed={activeLayer === item.id} key={item.id} className={`layer-toggle ${activeLayer === item.id ? "active" : ""}`} onClick={() => { setActiveLayer(activeLayer === item.id ? "" : item.id); setError(""); }}>{item.label}</button>)}</div><label><input type="checkbox" checked={remote} onChange={(event) => { setRemote(event.target.checked); setError(""); }} /> Online timeline</label></div>
    {remote && <label className="timeline">Imagery date <input aria-label="Imagery date" type="date" min="2026-10-01" max="2026-11-10" value={date} onChange={(event) => setDate(event.target.value)} /></label>}
    <div className="map-caption" aria-live="polite">{error || (remote ? `Online imagery requested: ${date}. Cached sample stays underneath if unavailable.` : "Cached NASA imagery · 2026-11-01 · works offline.")}<br />{layer?.detail ?? "NASA Blue Marble shaded relief / bathymetry · static context · not current field imagery."}<br />{layer && "Colors are a NASA browse visualization; no numerical values are inferred from colors. "}Approximate demo polygons; no identified farms. © NASA EOSDIS GIBS.</div>
  </>;
}
