/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — saved farms: geometry, grid cells, area and local storage. Frainer review pending. See AI_USAGE.md. */
import type { CropId, PreviousCrop } from "./advisor";
import type { Irrigation, Priority } from "./data";
import type { Location } from "./geography";

export const TAREA_M2 = 628.86;
export type Ring = [number, number][]; // [lon, lat], closed or open
export type Piece = { id: string; kind: "cell" | "field" | "parcel" | "drawn"; ring: Ring };
export type IrrigationDate = { date: string; mode: "own" | "assigned" };
export type Farm = {
  id: string; name: string; province: string; location: Location; pieces: Piece[];
  previous: PreviousCrop; irrigation: Irrigation; crops: CropId[]; sowMonth: number; priority: Priority;
  plan?: { crop: CropId; sowMonth: number };
  waterTurn?: string; // Legacy assigned turn, kept for existing farms.
  irrigationDate?: IrrigationDate;
  declaredTareas?: number;
  placeName?: string;
};

const R = 6378137;
/** Geodesic polygon area in m² (spherical excess formula used by common GIS libraries, e.g. Turf/OpenLayers). */
export function ringAreaM2(ring: Ring): number {
  const pts = ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1] ? ring.slice(0, -1) : ring;
  if (pts.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const [lon1, lat1] = pts[i], [lon2, lat2] = pts[(i + 1) % pts.length];
    total += (lon2 - lon1) * Math.PI / 180 * (2 + Math.sin(lat1 * Math.PI / 180) + Math.sin(lat2 * Math.PI / 180));
  }
  return Math.abs(total * R * R / 2);
}
export const piecesAreaM2 = (pieces: Piece[]) => pieces.reduce((s, p) => s + ringAreaM2(p.ring), 0);
export const m2ToTareas = (m2: number) => m2 / TAREA_M2;
export const m2ToHa = (m2: number) => m2 / 10000;
export function areaLabel(m2: number) {
  const t = m2ToTareas(m2), ha = m2ToHa(m2);
  return `${t < 10 ? t.toFixed(1).replace(".", ",") : Math.round(t).toLocaleString("es-DO")} tareas · ${ha < 10 ? ha.toFixed(2).replace(".", ",") : ha.toFixed(1).replace(".", ",")} ha`;
}
export function centroid(pieces: Piece[]): Location | null {
  const pts = pieces.flatMap(p => p.ring);
  if (!pts.length) return null;
  return { longitude: pts.reduce((s, p) => s + p[0], 0) / pts.length, latitude: pts.reduce((s, p) => s + p[1], 0) / pts.length };
}

/** Grid of square cells of ~`sizeM` metres snapped to a fixed lattice (stable ids anywhere in the country). */
export const CELL_M = 50; // 50 m × 50 m = 2 500 m² ≈ 4 tareas
export function cellAt(lon: number, lat: number, sizeM = CELL_M): Piece {
  const dLat = sizeM / 111320, dLon = sizeM / (111320 * Math.cos(lat * Math.PI / 180));
  const i = Math.floor(lon / dLon), j = Math.floor(lat / dLat);
  const x0 = i * dLon, y0 = j * dLat;
  return { id: `cell:${i}:${j}`, kind: "cell", ring: [[x0, y0], [x0 + dLon, y0], [x0 + dLon, y0 + dLat], [x0, y0 + dLat], [x0, y0]] };
}
export function cellsInBox(a: [number, number], b: [number, number], sizeM = CELL_M, max = 2000): Piece[] {
  const [w, e] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])], [s, n] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  const midLat = (s + n) / 2;
  const dLat = sizeM / 111320, dLon = sizeM / (111320 * Math.cos(midLat * Math.PI / 180));
  const out: Piece[] = [];
  for (let lat = s + dLat / 2; lat < n; lat += dLat) for (let lon = w + dLon / 2; lon < e; lon += dLon) {
    out.push(cellAt(lon, lat, sizeM));
    if (out.length >= max) return out;
  }
  return out;
}
export function gridAround(center: [number, number], radiusM = 600, sizeM = CELL_M): GeoJSON.FeatureCollection {
  const dLat = radiusM / 111320, dLon = radiusM / (111320 * Math.cos(center[1] * Math.PI / 180));
  const cells = cellsInBox([center[0] - dLon, center[1] - dLat], [center[0] + dLon, center[1] + dLat], sizeM, 4000);
  return { type: "FeatureCollection", features: cells.map(c => ({ type: "Feature", properties: { pieceId: c.id }, geometry: { type: "Polygon", coordinates: [c.ring] } })) };
}
export const togglePiece = (pieces: Piece[], piece: Piece) => pieces.some(p => p.id === piece.id) ? pieces.filter(p => p.id !== piece.id) : [...pieces, piece];
export const addPieces = (pieces: Piece[], more: Piece[]) => { const ids = new Set(pieces.map(p => p.id)); return [...pieces, ...more.filter(p => !ids.has(p.id))]; };
export function drawnPiece(points: [number, number][]): Piece | null {
  if (points.length < 3) return null;
  return { id: `drawn:${Date.now().toString(36)}:${points.length}`, kind: "drawn", ring: [...points, points[0]] };
}
export function piecesToGeoJSON(pieces: Piece[]): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: pieces.map(p => ({ type: "Feature", properties: { pieceId: p.id, kind: p.kind }, geometry: { type: "Polygon", coordinates: [p.ring.at(-1)![0] === p.ring[0][0] && p.ring.at(-1)![1] === p.ring[0][1] ? p.ring : [...p.ring, p.ring[0]]] } })) };
}

// ---- Local storage (this device only, no account) ----
const KEY = "agrovision:farms", ACTIVE = "agrovision:activeFarm", OLD = "agrovision:profile";
export function loadFarms(): { farms: Farm[]; active: string | null } {
  try {
    const raw = localStorage.getItem(KEY);
    let farms: Farm[] = raw ? JSON.parse(raw) : [];
    if (!farms.length) {
      const old = localStorage.getItem(OLD); // migrate the single profile used before farms existed
      if (old) { const p = JSON.parse(old); if (p?.location) farms = [{ id: "finca-1", name: "Mi finca", pieces: [], ...p }]; }
    }
    return { farms, active: localStorage.getItem(ACTIVE) ?? farms[0]?.id ?? null };
  } catch { return { farms: [], active: null }; }
}
export function saveFarms(farms: Farm[], active: string | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify(farms));
    if (active) localStorage.setItem(ACTIVE, active); else localStorage.removeItem(ACTIVE);
    localStorage.removeItem(OLD);
    return true;
  } catch { return false; }
}
export const newFarmId = () => `finca-${Date.now().toString(36)}`;
