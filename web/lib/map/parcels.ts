/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. See AI_USAGE.md. */
import type { ExpressionSpecification } from "maplibre-gl";
import parcels from "@/public/data/parcels-san-juan.json";

export type ParcelSignal = "low" | "mid" | "high" | "unknown";
export type ParcelProps = {
  parcelId: string;
  name: string;
  center: [number, number];
  signal: ParcelSignal;
  latestNdvi: number | null;
  latestObservedMonth: string;
  coverClass: string | null;
  coverConfidence: number | null;
  areaHa: number;
  ndviSeries: { month: string; value: number | null }[];
};
export const parcelCollection = parcels as unknown as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, ParcelProps>;
export const parcelEvidence = { provenance: parcels.provenance, method: parcels.method, signalRule: parcels.signalRule, limitation: parcels.limitation };
export type ParcelSelection = { properties: ParcelProps; signalLabel: string; evidence: typeof parcelEvidence };
export const signalColor: Record<ParcelSignal, string> = { low: "#dc5545", mid: "#e6b53f", high: "#46b976", unknown: "#9ca3af" };
export const signalLabels: Record<ParcelSignal, string> = { low: "Verdor bajo", mid: "Verdor intermedio", high: "Verdor alto", unknown: "Sin datos" };
export function parcelFillColor(): ExpressionSpecification {
  return ["match", ["get", "signal"], "low", signalColor.low, "mid", signalColor.mid, "high", signalColor.high, signalColor.unknown];
}
export function polygonCenter(feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, ParcelProps>): [number, number] {
  return feature.properties.center;
}
export function findParcel(id: string) {
  return parcelCollection.features.find(feature => feature.properties.parcelId === id);
}
