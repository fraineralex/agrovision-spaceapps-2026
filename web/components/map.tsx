/* AI: Grok (xAI), 2026-11-14; Frainer review pending. */
"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { EOX_ATTRIBUTION, EOX_SENTINEL_TILES, ESRI_ATTRIBUTION, ESRI_IMAGERY_TILES, ESRI_LABEL_TILES, type BasemapId } from "@/lib/map/basemaps";
import { cachedBasemapTiles, cachedOverlayTile, cachedRasterSource } from "@/lib/map/cache";
import { COUNTRY_VIEW, VALLEY_VIEW, filterProvinces, inDominicanRepublic, provinces } from "@/lib/map/country";
import { DEFAULT_GIBS_DATE, gibsOverlays, gibsWmsTile } from "@/lib/map/gibs";
import { findParcel, parcelCollection, parcelFillColor, polygonCenter, signalColor } from "@/lib/map/parcels";
import { loadPowerReading, type PowerReading } from "@/lib/map/power";
import { MapLayerBar, MapOverlay } from "@/components/map/toolbar";

type Props = { selected: string; onSelect: (id: string) => void };
type Place = { lon: number; lat: number; name: string };

export function MapPanel({ selected, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const pointMarker = useRef<Marker | null>(null);
  const [basemap, setBasemap] = useState<BasemapId>("imagery");
  const [overlay, setOverlay] = useState("");
  const [opacity, setOpacity] = useState(0.62);
  const [date, setDate] = useState(DEFAULT_GIBS_DATE);
  const [pitched, setPitched] = useState(true);
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [reading, setReading] = useState<PowerReading | null>(null);
  const [readingKey, setReadingKey] = useState("");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const matches = filterProvinces(query);
  const shown = place && reading && readingKey === `${place.lon.toFixed(4)},${place.lat.toFixed(4)}` ? reading : null;

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    let disposed = false;
    void import("maplibre-gl").then((module) => {
      if (disposed || !container.current || map.current) return;
      module.setWorkerUrl(new URL("/vendor/maplibre-gl-worker.mjs", location.origin).href);
      const instance = new module.Map({
        container: container.current,
        center: COUNTRY_VIEW.center,
        zoom: COUNTRY_VIEW.zoom,
        pitch: COUNTRY_VIEW.pitch,
        bearing: COUNTRY_VIEW.bearing,
        attributionControl: false,
        canvasContextAttributes: { preserveDrawingBuffer: true },
        style: {
          version: 8,
          sources: {
            imagery: { type: "raster", tiles: ESRI_IMAGERY_TILES, tileSize: 256, maxzoom: 19, attribution: ESRI_ATTRIBUTION },
            sentinel: { type: "raster", tiles: EOX_SENTINEL_TILES, tileSize: 256, maxzoom: 16, attribution: EOX_ATTRIBUTION },
            labels: { type: "raster", tiles: ESRI_LABEL_TILES, tileSize: 256, attribution: "Esri" },
          },
          layers: [
            { id: "background", type: "background", paint: { "background-color": "#d5ddd4" } },
            { id: "layer-imagery", type: "raster", source: "imagery", layout: { visibility: "visible" }, paint: { "raster-saturation": 0.06, "raster-contrast": 0.12 } },
            { id: "layer-sentinel", type: "raster", source: "sentinel", layout: { visibility: "none" } },
          ],
        },
      });
      map.current = instance;
      instance.addControl(new module.NavigationControl({ visualizePitch: true }), "bottom-right");
      instance.addControl(new module.AttributionControl({ compact: true }), "bottom-left");
      instance.on("error", (event) => {
        const message = event.error?.message ?? "";
        if (/style|worker/i.test(message)) setNote("El mapa no pudo cargar el estilo.");
      });
      instance.on("idle", () => {
        setMapLoaded(true);
        if (!instance.getSource("parcels")) return;
        const ids = new Set(instance.querySourceFeatures("parcels").map((feature) => String(feature.id ?? feature.properties?.parcelId)));
        container.current?.setAttribute("data-rendered-parcels", String(ids.size));
      });
      instance.on("load", () => {
        if (disposed) return;
        for (const tile of cachedBasemapTiles()) {
          instance.addSource(`cache-${tile.id}`, cachedRasterSource(tile));
          instance.addLayer({ id: `cache-${tile.id}`, type: "raster", source: `cache-${tile.id}`, paint: { "raster-opacity": 1, "raster-fade-duration": 0 } }, "layer-imagery");
        }
        for (const layer of gibsOverlays) {
          const cached = cachedOverlayTile(layer.id);
          if (!cached) continue;
          instance.addSource(`cache-${cached.id}`, cachedRasterSource(cached));
          instance.addLayer({ id: `cache-${cached.id}`, type: "raster", source: `cache-${cached.id}`, layout: { visibility: "none" }, paint: { "raster-opacity": 0.65, "raster-fade-duration": 0 } });
        }
        for (const layer of gibsOverlays) {
          instance.addSource(`gibs-${layer.id}`, { type: "raster", tiles: [gibsWmsTile(layer.id, DEFAULT_GIBS_DATE)], tileSize: 256, maxzoom: layer.maxNativeZoom, attribution: "NASA EOSDIS GIBS" });
          instance.addLayer({ id: `gibs-${layer.id}`, type: "raster", source: `gibs-${layer.id}`, layout: { visibility: "none" }, paint: { "raster-opacity": 0.62 } });
        }
        instance.addSource("parcels", { type: "geojson", promoteId: "parcelId", data: parcelCollection });
        instance.addLayer({ id: "parcels", type: "fill", source: "parcels", paint: { "fill-color": parcelFillColor(), "fill-opacity": 0.55 } });
        instance.addLayer({ id: "parcel-lines", type: "line", source: "parcels", paint: { "line-color": "#163528", "line-width": 1.4 } });
        instance.addLayer({ id: "layer-labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.86 } });
        for (const feature of parcelCollection.features) {
          const center = polygonCenter(feature);
          const button = document.createElement("button");
          button.className = "parcel-marker";
          button.textContent = feature.properties.name;
          button.style.borderColor = signalColor[feature.properties.signal];
          button.setAttribute("aria-label", `Seleccionar ${feature.properties.name}`);
          button.onclick = (event) => {
            event.stopPropagation();
            onSelectRef.current(feature.properties.parcelId);
            setPlace({ lon: center[0], lat: center[1], name: feature.properties.name });
          };
          new module.Marker({ element: button, anchor: "center" }).setLngLat(center).addTo(instance);
        }
        instance.on("click", "parcels", (event) => {
          const id = event.features?.[0]?.properties?.parcelId;
          if (!id) return;
          onSelectRef.current(String(id));
          setPlace({ lon: event.lngLat.lng, lat: event.lngLat.lat, name: String(event.features?.[0]?.properties?.name ?? "Parcela") });
        });
        instance.on("click", (event) => {
          const hits = instance.queryRenderedFeatures(event.point, { layers: ["parcels"] });
          if (hits.length || !inDominicanRepublic(event.lngLat.lng, event.lngLat.lat)) return;
          setPlace({ lon: event.lngLat.lng, lat: event.lngLat.lat, name: "Punto" });
          instance.flyTo({ center: [event.lngLat.lng, event.lngLat.lat], zoom: Math.max(instance.getZoom(), 9.2), pitch: instance.getPitch(), bearing: instance.getBearing(), duration: 900 });
        });
        setReady(true);
      });
    }).catch(() => setNote("El mapa no pudo iniciarse."));
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    instance.setLayoutProperty("layer-imagery", "visibility", basemap === "imagery" ? "visible" : "none");
    instance.setLayoutProperty("layer-sentinel", "visibility", basemap === "sentinel" ? "visible" : "none");
  }, [basemap, ready]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    for (const layer of gibsOverlays) {
      const visible = overlay === layer.id ? "visible" : "none";
      instance.setLayoutProperty(`gibs-${layer.id}`, "visibility", visible);
      if (instance.getLayer(`cache-${layer.id}`)) instance.setLayoutProperty(`cache-${layer.id}`, "visibility", visible);
      if (overlay === layer.id) {
        const source = instance.getSource(`gibs-${layer.id}`) as { setTiles?: (tiles: string[]) => void } | undefined;
        source?.setTiles?.([gibsWmsTile(layer.id, date)]);
        instance.setPaintProperty(`gibs-${layer.id}`, "raster-opacity", opacity);
      }
    }
  }, [overlay, opacity, date, ready]);

  useEffect(() => {
    const instance = map.current;
    const feature = findParcel(selected);
    if (!instance || !ready || !feature) return;
    instance.setPaintProperty("parcel-lines", "line-width", ["case", ["==", ["get", "parcelId"], feature.properties.parcelId], 3.2, 1.4]);
    instance.setPaintProperty("parcels", "fill-opacity", ["case", ["==", ["get", "parcelId"], feature.properties.parcelId], 0.78, 0.42]);
    const center = polygonCenter(feature);
    instance.flyTo({ center, zoom: 15.1, pitch: 48, bearing: -16, duration: 1400, essential: true });
  }, [selected, ready]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    let cancelled = false;
    void import("maplibre-gl").then((module) => {
      if (cancelled || !place) {
        pointMarker.current?.remove();
        pointMarker.current = null;
        return;
      }
      if (!pointMarker.current) {
        const dot = document.createElement("div");
        dot.style.cssText = "width:12px;height:12px;border-radius:99px;background:#173d2a;border:2px solid #fff";
        pointMarker.current = new module.Marker({ element: dot }).setLngLat([place.lon, place.lat]).addTo(instance);
      } else pointMarker.current.setLngLat([place.lon, place.lat]);
    });
    return () => { cancelled = true; };
  }, [place, ready]);

  useEffect(() => {
    if (!place) return;
    const controller = new AbortController();
    let active = true;
    const key = `${place.lon.toFixed(4)},${place.lat.toFixed(4)}`;
    loadPowerReading(place.lat, place.lon, 11, controller.signal).then((value) => { if (active) { setReading(value); setReadingKey(key); } }).catch(() => { if (active && !controller.signal.aborted) setReading(null); });
    return () => { active = false; controller.abort(); };
  }, [place]);

  const active = gibsOverlays.find((item) => item.id === overlay);
  const fly = (view: typeof COUNTRY_VIEW) => map.current?.flyTo({ ...view, duration: 1200, essential: true });

  return <>
    <div className="map-wrap">
      <div id="map" data-loaded={mapLoaded} ref={container} aria-label="Mapa de la República Dominicana" />
      <MapOverlay basemap={basemap} onBasemap={setBasemap} overlay={overlay} onOverlay={setOverlay} opacity={opacity} onOpacity={setOpacity} date={date} onDate={setDate} pitched={pitched} onTogglePitch={() => {
        const instance = map.current;
        if (!instance) return;
        const next = instance.getPitch() < 20;
        instance.easeTo({ pitch: next ? 50 : 0, bearing: next ? -16 : 0, duration: 700 });
        setPitched(next);
      }} onCountry={() => { setPlace(null); fly(COUNTRY_VIEW); setPitched(true); }} onValley={() => {
        const sanJuan = provinces.find((item) => item.id === "san-juan");
        if (sanJuan) setPlace({ lon: sanJuan.lon, lat: sanJuan.lat, name: sanJuan.name });
        fly(VALLEY_VIEW);
        setPitched(true);
      }} query={query} onQuery={setQuery} provinces={matches} onProvince={(id) => {
        const province = provinces.find((item) => item.id === id);
        if (!province || !map.current) return;
        setQuery("");
        setPlace({ lon: province.lon, lat: province.lat, name: province.name });
        map.current.flyTo({ center: [province.lon, province.lat], zoom: 9.1, pitch: 45, bearing: -12, duration: 1200 });
        setPitched(true);
      }} />
      {shown && <div style={{ position: "absolute", top: 10, right: 10, zIndex: 2, background: "rgba(255,255,255,.94)", borderRadius: 12, padding: "8px 12px", minWidth: 92 }}>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: "#173d2a" }}>{shown.temperatureC.toFixed(1)}°</div>
        <div style={{ fontSize: 12, color: "#3d5c4c" }}>{shown.precipitationMmDay.toFixed(1)} mm/día</div>
        <div style={{ fontSize: 11, color: "#60756a" }}>{place?.name}</div>
      </div>}
      {!ready && <div className="map-fallback"><strong>República Dominicana</strong>{parcelCollection.features.map((feature) => <button type="button" className="parcel-marker" key={feature.properties.parcelId} onClick={() => onSelect(feature.properties.parcelId)}>{feature.properties.name}</button>)}</div>}
    </div>
    <MapLayerBar basemap={basemap} onBasemap={setBasemap} overlay={overlay} onOverlay={(id) => { setOverlay(id); setNote(""); }} opacity={opacity} onOpacity={setOpacity} date={date} onDate={setDate} pitched={pitched} onTogglePitch={() => undefined} onCountry={() => undefined} onValley={() => undefined} query={query} onQuery={setQuery} provinces={matches} onProvince={() => undefined} />
    <div className="map-caption" aria-live="polite">{note || (active ? active.detail : "Imagen Esri / Sentinel-2. Capas NASA bajo demanda.")} {shown ? shown.detail : "Elige un punto en el país para el clima POWER."}</div>
  </>;
}
