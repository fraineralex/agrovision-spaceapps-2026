/* AI: Grok (xAI), 2026-11-14; Frainer review pending. */
import type { ExpressionSpecification } from "maplibre-gl";
import parcels from "@/public/data/parcels-san-juan.json";

export type ParcelSignal = "low" | "mid" | "high";

export type ParcelProps = {
  parcelId: string;
  name: string;
  demo: boolean;
  regionId: string;
  ndviMean: number;
  signal: ParcelSignal;
  areaHa: number;
  cropFraction2021: number;
  limitation: string;
};

export const parcelCollection = parcels as GeoJSON.FeatureCollection<GeoJSON.Polygon, ParcelProps>;

export const signalColor: Record<ParcelSignal, string> = {
  low: "#d4533c",
  mid: "#e0a325",
  high: "#2f9d57",
};

export function parcelFillColor(): ExpressionSpecification {
  return ["match", ["get", "signal"], "low", signalColor.low, "mid", signalColor.mid, "high", signalColor.high, "#8aa394"];
}

export function polygonCenter(feature: GeoJSON.Feature<GeoJSON.Polygon>): [number, number] {
  const ring = feature.geometry.coordinates[0];
  let lon = 0;
  let lat = 0;
  const count = Math.max(ring.length - 1, 1);
  for (let index = 0; index < count; index += 1) {
    lon += ring[index][0];
    lat += ring[index][1];
  }
  return [lon / count, lat / count];
}

export function findParcel(id: string) {
  return parcelCollection.features.find((feature) => feature.id === id || feature.properties.parcelId === id);
}
