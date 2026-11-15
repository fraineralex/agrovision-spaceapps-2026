/* AI: OpenAI GPT-6, 2026-11-15; existing geometry and selection rules preserved. Frainer review pending. */
import rawBoundaries from "@/public/data/provinces.json";
// Modern display names verified against https://ambiente.gob.do/informacion-ambiental/informacion-provincial/ (2026-11-14). Source geometry/names remain intact on disk.
const displayNames:Record<string,string> = {"Hermanas":"Hermanas Mirabal","La Estrelleta":"Elías Piña","El Seybo":"El Seibo"};
const boundaries = {...rawBoundaries,features:rawBoundaries.features.map(feature => ({...feature,properties:{...feature.properties,shapeName:displayNames[feature.properties.shapeName]??feature.properties.shapeName}}))};
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
  const shape = polygons(feature);
  const rings = shape.flat();
  const points = rings.flat();
  const west = Math.min(...points.map(p => p[0]));
  const east = Math.max(...points.map(p => p[0]));
  const south = Math.min(...points.map(p => p[1]));
  const north = Math.max(...points.map(p => p[1]));
  const center = { longitude: (west + east) / 2, latitude: (south + north) / 2 };
  // A bounding-box center can fall offshore. Choose an interior grid point if necessary.
  let location = center;
  if (provinceAt(center) !== feature.properties.shapeName) {
    outer: for (let y = south + .01; y < north; y += .01) for (let x = west + .01; x < east; x += .01) {
      if (shape.some(r => inRing({ longitude:x, latitude:y }, r[0]) && !r.slice(1).some(h => inRing({ longitude:x, latitude:y }, h)))) { location = { longitude:x, latitude:y }; break outer; }
    }
  }
  return { name: feature.properties.shapeName, ...location };
}).sort((a,b) => a.name.localeCompare(b.name, "es"));
export const nationalCenter: Location = { longitude: -70.2, latitude: 18.8 };
