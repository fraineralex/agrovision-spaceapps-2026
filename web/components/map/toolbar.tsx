/* AI: Grok (xAI), 2026-11-14; Frainer review pending. */
import type { CSSProperties } from "react";
import { basemaps, type BasemapId } from "@/lib/map/basemaps";
import { gibsOverlays } from "@/lib/map/gibs";
import type { Province } from "@/lib/map/country";

type Shared = {
  basemap: BasemapId;
  onBasemap: (id: BasemapId) => void;
  overlay: string;
  onOverlay: (id: string) => void;
  opacity: number;
  onOpacity: (value: number) => void;
  date: string;
  onDate: (value: string) => void;
  pitched: boolean;
  onTogglePitch: () => void;
  onCountry: () => void;
  onValley: () => void;
  query: string;
  onQuery: (value: string) => void;
  provinces: Province[];
  onProvince: (id: string) => void;
};

export function MapOverlay(props: Shared) {
  return <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, display: "grid", gap: 6, width: "min(240px, calc(100% - 20px))" }}>
    <input aria-label="Buscar provincia" placeholder="Provincia" value={props.query} onChange={(event) => props.onQuery(event.target.value)} style={field} />
    <select aria-label="Elegir provincia" value="" onChange={(event) => { if (event.target.value) props.onProvince(event.target.value); }} style={field}>
      <option value="">Ir a…</option>
      {props.provinces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
    <div style={{ display: "flex", gap: 6 }}>
      <button type="button" className="layer-toggle" onClick={props.onCountry}>RD</button>
      <button type="button" className="layer-toggle" onClick={props.onValley}>Valle</button>
      <button type="button" className="layer-toggle" aria-pressed={props.pitched} onClick={props.onTogglePitch}>{props.pitched ? "3D" : "2D"}</button>
    </div>
  </div>;
}

export function MapLayerBar({ basemap, onBasemap, overlay, onOverlay, opacity, onOpacity, date, onDate }: Shared) {
  return <div className="map-foot">
    <div className="layer-row">
      {basemaps.map((item) => <button type="button" key={item.id} aria-pressed={basemap === item.id} className={`layer-toggle ${basemap === item.id ? "active" : ""}`} onClick={() => onBasemap(item.id)}>{item.label}</button>)}
      {gibsOverlays.map((item) => <button type="button" key={item.id} aria-pressed={overlay === item.id} className={`layer-toggle ${overlay === item.id ? "active" : ""}`} onClick={() => onOverlay(overlay === item.id ? "" : item.id)}>{item.label}</button>)}
    </div>
    {overlay && <label style={{ display: "flex", alignItems: "center", gap: 8 }}>Opacidad <input aria-label="Opacidad de la capa" type="range" min={0.15} max={0.9} step={0.05} value={opacity} onChange={(event) => onOpacity(Number(event.target.value))} /></label>}
    {overlay && <label>Fecha <input aria-label="Fecha de la capa" type="date" min="2015-03-31" max="2026-11-13" value={date} onChange={(event) => onDate(event.target.value)} /></label>}
  </div>;
}

const field: CSSProperties = { border: "1px solid #d5ddd6", background: "rgba(255,255,255,.94)", borderRadius: 8, padding: "6px 8px", fontSize: 13, color: "#173d2a" };
