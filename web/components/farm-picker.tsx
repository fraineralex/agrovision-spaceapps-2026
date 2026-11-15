/* AI: Claude (Anthropic), 2026-11-14 — map to pick one or more cells/parcels, draw a polygon or drag a box. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, GeoJSONSource, MapMouseEvent } from "maplibre-gl";
import { parcelCollection } from "@/lib/map/parcels";
import { FIELDS_URL, fieldMeta } from "@/lib/map/fields";
import { ESRI_IMAGERY_TILES, ESRI_ATTRIBUTION } from "@/lib/map/basemaps";
import { addPieces, areaLabel, cellAt, cellsInBox, drawnPiece, gridAround, piecesAreaM2, piecesToGeoJSON, ringAreaM2, togglePiece, type Piece, type Ring } from "@/lib/farms";
import { provinceAt, type Location } from "@/lib/geography";
import "maplibre-gl/dist/maplibre-gl.css";

type Mode = "tap" | "draw" | "box";
const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const ringOf = (g?: GeoJSON.Geometry | null): Ring | null => !g ? null : g.type === "Polygon" ? g.coordinates[0] as Ring : g.type === "MultiPolygon" ? g.coordinates[0][0] as Ring : null;

export function FarmPicker({ center, pieces, onChange }: { center: Location; pieces: Piece[]; onChange: (p: Piece[]) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const piecesRef = useRef(pieces);
  const changeRef = useRef(onChange);
  useEffect(() => { piecesRef.current = pieces; changeRef.current = onChange; });
  const modeRef = useRef<Mode>("tap");
  const [mode, setModeState] = useState<Mode>("tap");
  const [draft, setDraft] = useState<[number, number][]>([]);
  const [status, setStatus] = useState("");
  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); setDraft([]); const mp = map.current; if (mp) { if (m === "box") mp.dragPan.disable(); else mp.dragPan.enable(); } };

  useEffect(() => {
    let disposed = false;
    void import("maplibre-gl").then(mod => {
      if (disposed || !box.current) return;
      mod.setWorkerUrl(new URL("/vendor/maplibre-gl-worker.mjs", window.location.origin).href);
      const m = new mod.Map({ container: box.current, center: [center.longitude, center.latitude], zoom: 16, attributionControl: { compact: true },
        style: { version: 8, sources: { imagery: { type: "raster", tiles: ESRI_IMAGERY_TILES, tileSize: 256, maxzoom: 19, attribution: ESRI_ATTRIBUTION } }, layers: [{ id: "bg", type: "background", paint: { "background-color": "#3b4a35" } }, { id: "imagery", type: "raster", source: "imagery" }] } });
      map.current = m;
      (window as unknown as { __farmPicker?: MapLibreMap }).__farmPicker = m;
      m.on("error", () => setStatus("Sin internet no se ve la foto satelital, pero puedes marcar la cuadrícula."));
      m.on("load", () => {
        m.addSource("grid", { type: "geojson", data: gridAround([center.longitude, center.latitude]) });
        m.addLayer({ id: "grid-fill", type: "fill", source: "grid", paint: { "fill-color": "#ffffff", "fill-opacity": 0.01 } });
        m.addLayer({ id: "grid-line", type: "line", source: "grid", paint: { "line-color": "#ffffff", "line-opacity": 0.35, "line-width": 0.6 } });
        m.addSource("parcels", { type: "geojson", data: parcelCollection as GeoJSON.FeatureCollection });
        m.addLayer({ id: "parcels-fill", type: "fill", source: "parcels", paint: { "fill-color": "#9fe0b4", "fill-opacity": 0.04 } });
        m.addLayer({ id: "parcels-line", type: "line", source: "parcels", paint: { "line-color": "#9fe0b4", "line-width": 1.4 } });
        m.addSource("fields", { type: "geojson", data: FIELDS_URL });
        m.addLayer({ id: "fields-fill", type: "fill", source: "fields", paint: { "fill-color": "#fff3a2", "fill-opacity": 0.06 } });
        m.addLayer({ id: "fields-line", type: "line", source: "fields", paint: { "line-color": "#fff3a2", "line-width": 2 } });
        m.addSource("sel", { type: "geojson", data: piecesToGeoJSON(piecesRef.current) });
        m.addLayer({ id: "sel-fill", type: "fill", source: "sel", paint: { "fill-color": "#22c55e", "fill-opacity": 0.45 } });
        m.addLayer({ id: "sel-line", type: "line", source: "sel", paint: { "line-color": "#14532d", "line-width": 2.5 } });
        m.addSource("draft", { type: "geojson", data: empty });
        m.addLayer({ id: "draft-line", type: "line", source: "draft", paint: { "line-color": "#f59e0b", "line-width": 3, "line-dasharray": [2, 1] } });
        m.addLayer({ id: "draft-pts", type: "circle", source: "draft", filter: ["==", "$type", "Point"], paint: { "circle-radius": 7, "circle-color": "#f59e0b", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
        box.current?.setAttribute("data-ready", "true");
      });
      m.on("moveend", () => { const c = m.getCenter(); (m.getSource("grid") as GeoJSONSource | undefined)?.setData(m.getZoom() >= 14 ? gridAround([c.lng, c.lat]) : empty); });
      m.on("click", (e: MapMouseEvent) => {
        if (modeRef.current === "draw") { setDraft(d => [...d, [e.lngLat.lng, e.lngLat.lat]]); return; }
        if (modeRef.current !== "tap") return;
        // Priority: SAM field outline, then Sentinel-2 analysis unit, then the 50 m grid cell.
        const field = m.queryRenderedFeatures(e.point, { layers: ["fields-fill"].filter(l => m.getLayer(l)) })[0];
        const unit = field ? undefined : m.queryRenderedFeatures(e.point, { layers: ["parcels-fill"].filter(l => m.getLayer(l)) })[0];
        const hit = field ?? unit;
        const ring = ringOf(hit?.geometry);
        const piece: Piece = hit && ring ? { id: `${field ? "field" : "parcel"}:${hit.properties?.id ?? hit.properties?.parcelId ?? ring[0].join(",")}`, kind: field ? "field" : "parcel", ring } : cellAt(e.lngLat.lng, e.lngLat.lat);
        changeRef.current(togglePiece(piecesRef.current, piece));
      });
      // Drag a box (mouse or finger) to select every grid cell inside it.
      let start: [number, number] | null = null;
      const startBox = (lng: number, lat: number) => { if (modeRef.current === "box") start = [lng, lat]; };
      const moveBox = (lng: number, lat: number) => { if (!start) return; (m.getSource("draft") as GeoJSONSource | undefined)?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [start, [lng, start[1]], [lng, lat], [start[0], lat], start] } }); };
      const endBox = (lng: number, lat: number) => { if (!start) return; const cells = cellsInBox(start, [lng, lat]); start = null; (m.getSource("draft") as GeoJSONSource | undefined)?.setData(empty); if (cells.length) changeRef.current(addPieces(piecesRef.current, cells)); };
      m.on("mousedown", e => startBox(e.lngLat.lng, e.lngLat.lat)); m.on("mousemove", e => moveBox(e.lngLat.lng, e.lngLat.lat)); m.on("mouseup", e => endBox(e.lngLat.lng, e.lngLat.lat));
      m.on("touchstart", e => { if (modeRef.current === "box") { e.preventDefault(); startBox(e.lngLat.lng, e.lngLat.lat); } }); m.on("touchmove", e => moveBox(e.lngLat.lng, e.lngLat.lat)); m.on("touchend", e => endBox(e.lngLat.lng, e.lngLat.lat));
    }).catch(() => setStatus("No se pudo abrir el mapa. Puedes seguir sin marcar la finca."));
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, [center.longitude, center.latitude]);

  useEffect(() => { (map.current?.getSource("sel") as GeoJSONSource | undefined)?.setData(piecesToGeoJSON(pieces)); }, [pieces]);
  useEffect(() => {
    const pts: GeoJSON.Feature[] = draft.map(p => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: p } }));
    if (draft.length > 1) pts.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: draft } });
    (map.current?.getSource("draft") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: pts });
  }, [draft]);

  const closeShape = () => { const p = drawnPiece(draft); if (p) { onChange([...pieces, p]); setDraft([]); } };
  const total = piecesAreaM2(pieces);
  const province = provinceAt(center) ?? "República Dominicana";
  const inDetectionArea = center.longitude >= fieldMeta.bbox[0] && center.longitude <= fieldMeta.bbox[2] && center.latitude >= fieldMeta.bbox[1] && center.latitude <= fieldMeta.bbox[3];
  return <div className="picker">
    <div className="picker-modes" role="group" aria-label="Cómo marcar la finca">
      <button type="button" aria-pressed={mode === "tap"} className={mode === "tap" ? "chip on" : "chip"} onClick={() => setMode("tap")}>👆 Tocar cuadros</button>
      <button type="button" aria-pressed={mode === "box"} className={mode === "box" ? "chip on" : "chip"} onClick={() => setMode("box")}>⬚ Arrastrar</button>
      <button type="button" aria-pressed={mode === "draw"} className={mode === "draw" ? "chip on" : "chip"} onClick={() => setMode("draw")}>✏️ Dibujar</button>
    </div>
    <p className="picker-help">{mode === "tap" ? "Toca los cuadros o las parcelas amarillas que son tuyas. Toca otra vez para quitar." : mode === "box" ? "Arrastra el dedo para marcar un rectángulo de cuadros." : "Toca las esquinas de tu finca y luego “Cerrar figura”."}</p>
    <p className="note" role="status">{inDetectionArea ? `En ${province} hay contornos satelitales experimentales solo en este recorte: 10 de 42 ventanas procesadas. Confirma el lindero en campo.` : `En ${province} no hay contornos automáticos verificados. Puedes marcar cuadros o dibujar la finca.`} Las imágenes Esri requieren internet; su fecha y resolución cambian según la zona.</p>
    <div ref={box} className="picker-map" data-testid="farm-picker-map" />
    {mode === "draw" && <div className="picker-draw">
      <span>{draft.length} puntos</span>
      <button type="button" className="chip" disabled={!draft.length} onClick={() => setDraft(d => d.slice(0, -1))}>↶ Deshacer punto</button>
      <button type="button" className="chip on" disabled={draft.length < 3} onClick={closeShape}>✔ Cerrar figura</button>
    </div>}
    {status && <p role="status" className="note">{status}</p>}
    <div className="picker-total" aria-live="polite"><strong>{pieces.length ? `Marcado: ${areaLabel(total)}` : "Aún no has marcado nada"}</strong>
      {pieces.length > 0 && <button type="button" className="ob-link" onClick={() => onChange([])}>Borrar todo</button>}</div>
    {pieces.length > 0 && <ul className="picker-pieces">{pieces.slice(-6).map(p => <li key={p.id}>{p.kind === "cell" ? "Cuadro" : p.kind === "field" ? "Parcela satelital" : p.kind === "drawn" ? "Figura dibujada" : "Parcela"}: {areaLabel(ringAreaM2(p.ring))}<button type="button" aria-label="Quitar" className="ob-link" onClick={() => onChange(pieces.filter(x => x.id !== p.id))}>✕</button></li>)}{pieces.length > 6 && <li>…y {pieces.length - 6} más</li>}</ul>}
    <p className="note">Los contornos amarillos son candidatos aproximados, no catastrales. Cuadros de 50 × 50 m (unas 4 tareas). 1 tarea = 628,86 m². {fieldMeta.attribution}</p>
  </div>;
}
