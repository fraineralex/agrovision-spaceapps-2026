/* AI: Grok (xAI), 2026-11-14; Frainer review pending. */
import type { RasterSourceSpecification } from "maplibre-gl";
import sample from "@/public/data/gibs-sample.json";

type SampleTile = (typeof sample.tiles)[number];

function tileBounds(tile: SampleTile): [number, number, number, number] {
  const span = 2 ** tile.zoom;
  const longitude = (x: number) => x / span * 360 - 180;
  const latitude = (y: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / span))) * 180 / Math.PI;
  const west = longitude(tile.x);
  const north = latitude(tile.y);
  const east = longitude(tile.x + 1);
  const south = latitude(tile.y + 1);
  return [west, south, east, north];
}

export function cachedRasterSource(tile: SampleTile): RasterSourceSpecification {
  return {
    type: "raster",
    tiles: [`/data/${tile.file}`],
    tileSize: 256,
    minzoom: tile.zoom,
    maxzoom: tile.zoom,
    bounds: tileBounds(tile),
    attribution: "NASA EOSDIS GIBS",
  };
}

export function cachedBasemapTiles() {
  return sample.tiles.filter((tile) => tile.id.startsWith("BlueMarble"));
}

export function cachedOverlayTile(layerId: string) {
  return sample.tiles.find((tile) => tile.id === layerId);
}
