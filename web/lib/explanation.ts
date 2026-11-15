/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { z } from "zod";
import type { Locale } from "@/lib/i18n/messages";
import { getComparison, priorityLabels } from "@/lib/data";
export const explanationInput = z.object({ priority:z.enum(["water","soil","climate","pests","market"]),month:z.number().int().min(1).max(12),irrigation:z.enum(["unconfirmed","irrigated","rainfed"]) }).strict();
export type ExplanationInput = z.infer<typeof explanationInput>;
export function evidenceStatements(input:ExplanationInput, locale: Locale = "es") {
 const data=getComparison(input.month);
 if (locale === "en") return {
  priority: `Your priority is ${{water:"water",soil:"soil",climate:"climate",pests:"pests",market:"market"}[input.priority]}. ${input.priority === "water" ? "The ranking uses a relative water indicator; a higher score means a lower indicator among these examples." : "There is insufficient evidence to rank by this priority."}`,
  climate: `NASA POWER: regional mean temperature ${new Intl.NumberFormat("en-US").format(data.climate.temperatureC)} °C, month ${input.month}, 2016–2025 reanalysis, approximately 50 km grid in San Juan. This is historical climate, not a farm measurement or forecast.`,
  water: "The water indicator uses generic FAO-56 coefficients (1998), with low local confidence. It excludes rainfall, evapotranspiration, irrigation losses and soil; it is not irrigation demand or measured savings.",
  gaps: "There is insufficient verified local evidence to score soil, climate suitability, pests or markets for these scenarios. Yield, outbreaks and profit are not predicted. Santo Domingo prices are not equivalent to farm-gate prices.",
  review: `Water access: ${{unconfirmed:"unconfirmed",irrigated:"declared irrigated",rainfed:"declared rainfed"}[input.irrigation]}. Review the examples with a local technician. The Landsat NDVI sample is preliminary; bare-field and irrigation classification awaits validation.`,
 };
 return {
  priority:`Tu prioridad es ${priorityLabels[input.priority]}. ${input.priority === "water" ? "El orden usa un indicador relativo de agua; una puntuación mayor significa un indicador menor entre estos ejemplos." : "No hay evidencia suficiente para ordenar por esta prioridad."}`,
  climate:`NASA POWER: temperatura media regional de ${data.climate.temperatureC} °C, mes ${input.month}, reanálisis 2016–2025, grilla aproximada de 50 km de San Juan. Es historia climática, no medición de finca ni pronóstico.`,
  water:"El indicador de agua usa coeficientes genéricos FAO-56 (1998), con baja confianza local. No incluye lluvia, evapotranspiración, pérdidas de riego ni suelo; no es demanda de riego ni ahorro medido.",
  gaps:"No hay evidencia local verificada suficiente para puntuar suelo, aptitud climática, plagas o mercado de estos escenarios. No se predice rendimiento, brotes ni ganancias. Los precios de Santo Domingo no equivalen al precio recibido en finca.",
  review:`Acceso al agua: ${{unconfirmed:"sin confirmar",irrigated:"riego declarado",rainfed:"secano declarado"}[input.irrigation]}. Revisa los ejemplos con un técnico local. La muestra Landsat NDVI es preliminar; clasificación de campo pelado y riego pendiente de validación.`,
 };
}
export function fallbackExplanation(input:ExplanationInput, locale: Locale = "es") { const s=evidenceStatements(input, locale);return [s.priority,s.water,s.gaps].join(" "); }
