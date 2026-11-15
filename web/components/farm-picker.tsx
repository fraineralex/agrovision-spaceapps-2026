/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — map to pick one or more cells/parcels, draw a polygon or drag a box; responsive layout & unified Lucide SVG icons by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { Check, MousePointerClick, Pencil, RotateCcw, SquareDashed, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, GeoJSONSource, MapMouseEvent } from "maplibre-gl";
import { parcelCollection } from "@/lib/map/parcels";
import { FIELDS_URL, fieldMeta } from "@/lib/map/fields";
import { ESRI_IMAGERY_TILES, ESRI_ATTRIBUTION, ESRI_LABEL_TILES } from "@/lib/map/basemaps";
import { addPieces, areaLabel, cellAt, cellsInBox, drawnPiece, gridAround, piecesAreaM2, piecesToGeoJSON, ringAreaM2, togglePiece, type Piece, type Ring } from "@/lib/farms";
import { type Location } from "@/lib/geography";
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
  const [showFields, setShowFields] = useState(false);
  const [ready, setReady] = useState(false);
  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); setDraft([]); const mp = map.current; if (mp) { if (m === "box") mp.dragPan.disable(); else mp.dragPan.enable(); } };

  useEffect(() => {
    let disposed = false;
    void import("maplibre-gl").then(mod => {
      if (disposed || !box.current) return;
      mod.setWorkerUrl(new URL("/vendor/maplibre-gl-worker.mjs", window.location.origin).href);
      const m = new mod.Map({ container: box.current, center: [center.longitude, center.latitude], zoom: 16, maxZoom: 19, attributionControl: { compact: true },
        style: { version: 8, sources: { imagery: { type: "raster", tiles: ESRI_IMAGERY_TILES, tileSize: 256, maxzoom: 19, attribution: ESRI_ATTRIBUTION } }, layers: [{ id: "bg", type: "background", paint: { "background-color": "#3b4a35" } }, { id: "imagery", type: "raster", source: "imagery" }] } });
      map.current = m;
      (window as unknown as { __farmPicker?: MapLibreMap }).__farmPicker = m;
      m.on("error", () => setStatus("Sin internet no se ve la foto satelital, pero puedes marcar la cuadrícula."));
      m.on("load", () => {
        m.addSource("place-labels", { type: "raster", tiles: ESRI_LABEL_TILES, tileSize: 256, maxzoom: 19 });
        m.addLayer({ id: "place-labels", type: "raster", source: "place-labels" });
        m.addSource("grid", { type: "geojson", data: gridAround([center.longitude, center.latitude]) });
        m.addLayer({ id: "grid-fill", type: "fill", source: "grid", paint: { "fill-color": "#ffffff", "fill-opacity": 0.01 } });
        m.addLayer({ id: "grid-line", type: "line", source: "grid", paint: { "line-color": "#ffffff", "line-opacity": 0.35, "line-width": 0.6 } });
        m.addSource("parcels", { type: "geojson", data: parcelCollection as GeoJSON.FeatureCollection });
        m.addLayer({ id: "parcels-fill", type: "fill", source: "parcels", paint: { "fill-color": "#9fe0b4", "fill-opacity": 0.04 } });
        m.addLayer({ id: "parcels-line", type: "line", source: "parcels", paint: { "line-color": "#9fe0b4", "line-width": 1.4 } });
        m.addSource("fields", { type: "geojson", data: FIELDS_URL });
        m.addLayer({ id: "fields-fill", type: "fill", source: "fields", layout: { visibility: "none" }, paint: { "fill-color": "#fff3a2", "fill-opacity": 0.06 } });
        m.addLayer({ id: "fields-line", type: "line", source: "fields", layout: { visibility: "none" }, paint: { "line-color": "#fff3a2", "line-width": 2 } });
        m.addSource("sel", { type: "geojson", data: piecesToGeoJSON(piecesRef.current) });
        m.addLayer({ id: "sel-fill", type: "fill", source: "sel", paint: { "fill-color": "#22c55e", "fill-opacity": 0.45 } });
        m.addLayer({ id: "sel-line", type: "line", source: "sel", paint: { "line-color": "#14532d", "line-width": 2.5 } });
        m.addSource("draft", { type: "geojson", data: empty });
        m.addLayer({ id: "draft-line", type: "line", source: "draft", paint: { "line-color": "#f59e0b", "line-width": 3, "line-dasharray": [2, 1] } });
        m.addLayer({ id: "draft-pts", type: "circle", source: "draft", filter: ["==", "$type", "Point"], paint: { "circle-radius": 7, "circle-color": "#f59e0b", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
        box.current?.setAttribute("data-ready", "true");
        setReady(true);
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
  const toggleFields = () => {
    const m = map.current;
    if (!m?.getLayer("fields-fill")) return;
    const visible = !showFields;
    for (const layer of ["fields-fill", "fields-line"]) m.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
    setShowFields(visible);
    if (visible) {
      const [west, south, east, north] = fieldMeta.bbox;
      m.fitBounds([[west, south], [east, north]], { padding: 24, duration: 650 });
    }
  };
  return <div className="picker">
    <div className="picker-toolbar">
      <div className="picker-modes" role="group" aria-label="Cómo marcar la finca">
        <button type="button" aria-pressed={mode === "tap"} className={mode === "tap" ? "chip on" : "chip"} onClick={() => setMode("tap")}><MousePointerClick size={16} aria-hidden="true" /> Tocar cuadros</button>
        <button type="button" aria-pressed={mode === "box"} className={mode === "box" ? "chip on" : "chip"} onClick={() => setMode("box")}><SquareDashed size={16} aria-hidden="true" /> Arrastrar</button>
        <button type="button" aria-pressed={mode === "draw"} className={mode === "draw" ? "chip on" : "chip"} onClick={() => setMode("draw")}><Pencil size={16} aria-hidden="true" /> Dibujar</button>
      </div>
      <p className="picker-help">{mode === "tap" ? "Toca para marcar o quitar un cuadro." : mode === "box" ? "Arrastra el dedo para marcar un rectángulo de cuadros." : "Toca las esquinas de tu finca y luego “Cerrar figura”."}</p>
      <details className="picker-instructions"><summary>¿Cómo marco mi finca?</summary><p className="note">Toca los cuadros de tu finca, marca un rectángulo o dibuja el borde. Los cuadros miden 50 × 50 m (unas 4 tareas). Las imágenes Esri requieren internet.</p></details>
    </div>
    <div className="picker-stage">
      <div ref={box} className="picker-map" data-testid="farm-picker-map" />
      <div className="picker-map-actions">
        <button type="button" className="chip" disabled={!ready} aria-pressed={showFields} onClick={toggleFields}>Ver fincas de San Juan</button>
        <button type="button" className="chip" disabled={!ready} aria-label="Acercar mapa" onClick={() => map.current?.zoomIn()}>+</button>
        <button type="button" className="chip" disabled={!ready} aria-label="Alejar mapa" onClick={() => map.current?.zoomOut()}>−</button>
      </div>
      {showFields && <p className="note picker-outlines-note">Contornos aproximados por satélite, no catastrales.</p>}
      <p className="note picker-scale-note">Los contornos amarillos son candidatos aproximados, no catastrales. Cuadros de 50 × 50 m (unas 4 tareas). 1 tarea = 628,86 m². {fieldMeta.attribution}</p>
    </div>
    <div className="picker-status">
      {mode === "draw" && <div className="picker-draw">
        <span>{draft.length} puntos</span>
        <button type="button" className="chip" disabled={!draft.length} onClick={() => setDraft(d => d.slice(0, -1))}><RotateCcw size={15} aria-hidden="true" /> Deshacer punto</button>
        <button type="button" className="chip on" disabled={draft.length < 3} onClick={closeShape}><Check size={15} aria-hidden="true" /> Cerrar figura</button>
      </div>}
      {status && <p role="status" className="note">{status}</p>}
      <div className="picker-total" aria-live="polite"><strong>{pieces.length ? `Marcado: ${areaLabel(total)}` : "Aún no has marcado nada"}</strong>
        {pieces.length > 0 && <button type="button" className="ob-link" onClick={() => onChange([])}>Borrar todo</button>}</div>
      {pieces.length > 0 && <ul className="picker-pieces">{pieces.slice(-4).map(p => <li key={p.id}>{p.kind === "cell" ? "Cuadro" : p.kind === "field" ? "Parcela satelital" : p.kind === "drawn" ? "Figura dibujada" : "Parcela"}: {areaLabel(ringAreaM2(p.ring))}<button type="button" aria-label="Quitar" className="ob-link picker-remove" onClick={() => onChange(pieces.filter(x => x.id !== p.id))}><X size={16} aria-hidden="true" /></button></li>)}{pieces.length > 4 && <li>…y {pieces.length - 4} más</li>}</ul>}
    </div>
  </div>;
}
