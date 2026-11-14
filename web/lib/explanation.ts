/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { z } from "zod";
import { getComparison, priorityLabels } from "@/lib/data";
export const explanationInput = z.object({
  priority: z.enum(["water", "soil", "climate", "pests", "market"]),
  month: z.number().int().min(1).max(12),
  irrigation: z.enum(["unconfirmed", "irrigated", "rainfed"]),
}).strict();
export type ExplanationInput = z.infer<typeof explanationInput>;
export function evidenceStatements(input: ExplanationInput) {
  const data = getComparison(input.month);
  return {
    priority: `Your priority is ${priorityLabels[input.priority]}. ${input.priority === "water" ? "Scenarios are ordered by a relative coefficient-day proxy; higher scores mean a smaller proxy within this demo only." : "Evidence is insufficient to rank scenarios for this priority; the baseline stays first."}`,
    climate: `NASA POWER regional mean air temperature is ${data.climate.temperatureC} °C for calendar month ${input.month}, using 2016–2025 daily reanalysis at roughly 50 km resolution. These are historical regional conditions, not parcel measurements or a forecast.`,
    water: "The FAO-56 water proxy uses generic crop coefficients and example stage lengths, with low local confidence. It excludes rainfall, evapotranspiration, irrigation losses and soil condition; it is not irrigation demand or measured water savings.",
    gaps: "Climate suitability, pests, soil health and market scores lack verified local evidence. No yield, pest outbreak or profit is predicted. Santo Domingo market prices, when added, will not represent farmgate prices.",
    review: `Irrigation status is ${input.irrigation}, a user declaration only. Discuss all illustrative rotations with a local agricultural technician. A small real Landsat NDVI sample is shown separately with uncalibrated vegetation signals. Confirmed bare-soil and irrigation classification remains pending labeled training data and validation.`,
  };
}
export function fallbackExplanation(input: ExplanationInput) { return Object.values(evidenceStatements(input)).join(" "); }
