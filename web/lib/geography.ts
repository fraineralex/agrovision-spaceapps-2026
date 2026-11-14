/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { z } from "zod";
import boundaries from "@/public/data/provinces.json";
export const locationSchema = z.object({ longitude: z.number().finite().min(-72.1).max(-68), latitude: z.number().finite().min(17.4).max(20) }).strict().refine(isInCountry, "Selecciona un punto terrestre de República Dominicana");
export type Location = { longitude: number; latitude: number };
function inRing(point: Location, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i], [px, py] = ring[j];
    if ((y > point.latitude) !== (py > point.latitude) && point.longitude < (px - x) * (point.latitude - y) / (py - y) + x) inside = !inside;
  }
  return inside;
}
function polygons(feature: typeof boundaries.features[number]): number[][][][] {
  return (feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates) as number[][][][];
}
export function provinceAt(point: Location) {
  return boundaries.features.find(feature => polygons(feature).some(rings => inRing(point, rings[0]) && !rings.slice(1).some(ring => inRing(point, ring))))?.properties.shapeName;
}
export function isInCountry(point: Location) { return Boolean(provinceAt(point)); }
export const provinces = boundaries.features.map(feature => {
  const rings = polygons(feature).flat();
  const points = rings.flat();
  const longitude = (Math.min(...points.map(p => p[0])) + Math.max(...points.map(p => p[0]))) / 2;
  const latitude = (Math.min(...points.map(p => p[1])) + Math.max(...points.map(p => p[1]))) / 2;
  const center = { longitude, latitude };
  // A bounding-box center can fall offshore. Choose an interior grid point if necessary.
  let location = center;
  if (provinceAt(center) !== feature.properties.shapeName) {
    outer: for (let y = Math.min(...points.map(p => p[1])) + .01; y < Math.max(...points.map(p => p[1])); y += .01) for (let x = Math.min(...points.map(p => p[0])) + .01; x < Math.max(...points.map(p => p[0])); x += .01) {
      if (polygons(feature).some(r => inRing({ longitude:x, latitude:y }, r[0]) && !r.slice(1).some(h => inRing({ longitude:x, latitude:y }, h)))) { location = { longitude:x, latitude:y }; break outer; }
    }
  }
  return { name: feature.properties.shapeName, ...location };
}).sort((a,b) => a.name.localeCompare(b.name, "es"));
export const nationalCenter: Location = { longitude: -70.2, latitude: 18.8 };
