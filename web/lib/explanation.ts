/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { z } from "zod";
import { getComparison, priorityLabels } from "@/lib/data";
export const explanationInput = z.object({ priority:z.enum(["water","soil","climate","pests","market"]),month:z.number().int().min(1).max(12),irrigation:z.enum(["unconfirmed","irrigated","rainfed"]) }).strict();
export type ExplanationInput = z.infer<typeof explanationInput>;
export function evidenceStatements(input:ExplanationInput) {
 const data=getComparison(input.month);
 return {
  priority:`Tu prioridad es ${priorityLabels[input.priority]}. ${input.priority === "water" ? "El orden usa un indicador relativo de agua; una puntuación mayor significa un indicador menor entre estos ejemplos." : "No hay evidencia suficiente para ordenar por esta prioridad."}`,
  climate:`NASA POWER: temperatura media regional de ${data.climate.temperatureC} °C, mes ${input.month}, reanálisis 2016–2025, grilla aproximada de 50 km de San Juan. Es historia climática, no medición de finca ni pronóstico.`,
  water:"El indicador de agua usa coeficientes genéricos FAO-56 (1998), con baja confianza local. No incluye lluvia, evapotranspiración, pérdidas de riego ni suelo; no es demanda de riego ni ahorro medido.",
  gaps:"No hay evidencia local verificada suficiente para puntuar suelo, aptitud climática, plagas o mercado de estos escenarios. No se predice rendimiento, brotes ni ganancias. Los precios de Santo Domingo no equivalen al precio recibido en finca.",
  review:`Acceso al agua: ${{unconfirmed:"sin confirmar",irrigated:"riego declarado",rainfed:"secano declarado"}[input.irrigation]}. Revisa los ejemplos con un técnico local. La muestra Landsat NDVI es preliminar; clasificación de campo pelado y riego pendiente de validación.`,
 };
}
export function fallbackExplanation(input:ExplanationInput) { const s=evidenceStatements(input);return [s.priority,s.water,s.gaps].join(" "); }
