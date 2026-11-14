/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. See AI_USAGE.md. */
import { z } from "zod";
import rawClimate from "../public/data/climate-series.json";
import rawRotations from "../public/data/rotation-scenarios.json";
import rawCatalog from "../public/data/crop-catalog.json";
import rawNdvi from "../public/data/ndvi-series.json";

export const cropLabels: Record<string, string> = { rice:"Arroz", beans:"Habichuela", maize:"Maíz", "sweet-potato":"Batata" };
export type Priority = "water" | "soil" | "climate" | "pests" | "market";
export type Irrigation = "unconfirmed" | "irrigated" | "rainfed";
export const priorityLabels: Record<Priority, string> = { water: "Agua", soil: "Suelo", climate: "Clima", pests: "Plagas", market: "Mercado" };
export const scoreDefinitions = [{ id: "water", label: "Agua y suelo" }, { id: "climate", label: "Clima" }, { id: "pests", label: "Plagas" }, { id: "market", label: "Mercado" }] as const;
const finite = z.number().finite();
export const ndvi = z.object({
  source: z.object({ name: z.string(), url: z.url(), period: z.string(), scale: z.string(), quality: z.string(), method: z.string() }),
  method: z.string(), limitation: z.string(), irrigationClassification: z.null(),
  rows: z.array(z.object({ parcelId: z.string(), date: z.iso.date(), sceneId: z.string(), ndvi: finite.min(-1).max(1).nullable(), signal: z.string(), confidence: z.null(), quality: z.string(), sourceUrl: z.url() })),
}).parse(rawNdvi);
export const climate = z.object({
  schemaVersion: z.literal(1), generatedAt: z.iso.datetime(), caseId: z.string(),
  source: z.object({ name: z.string(), url: z.url(), periodStart: z.string(), periodEnd: z.string(), scale: z.string(), method: z.string(), quality: z.string() }),
  monthlyClimatology: z.array(z.object({ month: finite.min(1).max(12), temperatureC: finite, precipitationMmDay: finite, relativeHumidityPct: finite, sampleDays: finite } )).length(12),
}).parse(rawClimate);
const cropSchema = z.object({ id: z.string(), label: z.string(), stages: z.tuple([finite, finite, finite, finite]), kc: z.tuple([finite, finite, finite]), region: z.string() });
export const catalog = z.object({ source: z.object({ name: z.string(), url: z.url(), period: z.string(), scale: z.string(), quality: z.string(), method: z.string() }), crops: z.array(cropSchema) }).parse(rawCatalog);
const rotations = z.object({ scenarios: z.array(z.object({ id: z.string(), label: z.string(), status: z.enum(["baseline", "illustrative"]), crops: z.array(z.string()), cropIds: z.array(z.string()), citation: z.string(), sourceUrl: z.url().nullable() })).min(3) }).parse(rawRotations);

// Integral of the FAO piecewise-linear Kc curve; unit Kc·day, NOT mm of irrigation.
export function coefficientDays(crop: z.infer<typeof cropSchema>): number {
  const [initial, development, middle, late] = crop.stages;
  const [ki, km, ke] = crop.kc;
  return initial * ki + development * (ki + km) / 2 + middle * km + late * (km + ke) / 2;
}
export function relativeScore(value: number, minimum: number, maximum: number): number | null {
  if (![value, minimum, maximum].every(Number.isFinite) || maximum <= minimum) return null;
  return Math.round(Math.max(0, Math.min(5, 5 * (maximum - value) / (maximum - minimum))) * 10) / 10;
}
export function getComparison(month = 11) {
  const context = climate.monthlyClimatology.find((item) => item.month === month);
  if (!context) throw new Error("Invalid month");
  const raw = rotations.scenarios.map((scenario) => {
    const crops = scenario.cropIds.map((id) => {
      const crop = catalog.crops.find((item) => item.id === id);
      if (!crop) throw new Error(`Missing crop: ${id}`);
      return crop;
    });
    return { ...scenario, label: scenario.cropIds.map(id => cropLabels[id] ?? id).join(" → "), crops: scenario.cropIds.map(id => cropLabels[id] ?? id), coefficientDays: Math.round(crops.reduce((sum, crop) => sum + coefficientDays(crop), 0) * 100) / 100 };
  });
  const values = raw.map((scenario) => scenario.coefficientDays);
  return { climate: context, provenance: climate.source, scenarios: raw.map((scenario) => ({ ...scenario,
    scores: { water: relativeScore(scenario.coefficientDays, Math.min(...values), Math.max(...values)), climate: null, pests: null, market: null },
    confidence: "Low — generic published coefficients; no local calibration",
  })) };
}
export type Scenario = ReturnType<typeof getComparison>["scenarios"][number];
export function orderScenarios(scenarios: Scenario[], priority: Priority): Scenario[] {
  if (priority !== "water") return [...scenarios]; // No evidence: no invented ranking.
  return [...scenarios].sort((a, b) => (b.scores.water ?? -1) - (a.scores.water ?? -1));
}
