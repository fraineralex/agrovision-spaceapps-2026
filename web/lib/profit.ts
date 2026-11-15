/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — "¿Cuánto me deja?" profit range per crop and farm. Frainer review pending. See AI_USAGE.md. */
import type { Irrigation } from "./data";
import { marketFor } from "./advisor";

/** Banco Central RD, IPC general enero 2026 = 137,74 (base octubre 2019–septiembre 2020 = 100). Used to bring 2019 costs to today. */
export const CPI = { factor: 137.74 / 100, label: "IPC del Banco Central, enero 2026 = 137,74 (base oct. 2019–sep. 2020 = 100)", url: "https://cdn.bancentral.gov.do/documents/publicaciones-economicas/indice-de-precios-al-consumidor-informe-mensual/documents/Informe-IPC-2026-01.pdf" };
const LB_PER_KG = 2.20462;

export type ProfitRange = {
  crop: string; tareas: number; costRD: number; yieldLb: number; pricePerLb: { low: number; mid: number; high: number };
  income: { low: number; mid: number; high: number }; profit: { low: number; mid: number; high: number };
  notes: string[]; costSource: { page: number; url: string; area: string; cost2019PerTarea: number }; priceUnit: string;
} | { crop: string; unavailable: string };

function yieldLbPerTarea(c: NonNullable<ReturnType<typeof marketFor>>["cost2019"]): { lb: number; note?: string } | null {
  if (!c) return null;
  if (c.yieldLb) return { lb: c.yieldLb };
  if (/^(quintales|QQ)$/.test(c.yieldUnit)) return { lb: c.yield * 100, note: "Quintal tomado como 100 libras." };
  return null; // e.g. rice in fanegas of paddy vs. milled-rice price: not comparable
}
function toPerLb(price: number, unit: string | null) {
  if (unit === "DOP/lb") return price;
  if (unit === "DOP/kg") return price / LB_PER_KG;
  if (unit === "DOP/quintal") return price / 100;
  return null;
}

export function historicCost(crop: string, irrigation: Irrigation) {
  const cost = marketFor(crop)?.cost2019;
  if (!cost || irrigation !== "irrigated" || !/\briego\b/i.test(cost.area)) return null;
  return { cost, yieldLb: yieldLbPerTarea(cost)?.lb ?? null };
}

export function wholesaleRange(crop: string) {
  const market = marketFor(crop);
  // This price is for milled rice. The farm sells paddy.
  if (!market?.latest || crop === "arroz") return null;
  const prices = (market.recent ?? []).filter(row => row.period >= periodStart(market.latest!.period)).map(row => toPerLb(row.price, market.unit)).filter((price): price is number => price !== null);
  const mid = toPerLb(market.latest.price, market.unit);
  if (!prices.length || mid === null) return null;
  return { low: Math.min(...prices), mid, high: Math.max(...prices) };
}

function periodStart(period: string) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 12, 1));
  return date.toISOString().slice(0, 7);
}

export function profitFor(crop: string, tareas: number, irrigation: Irrigation = "unconfirmed"): ProfitRange {
  const m = marketFor(crop);
  const c = m?.cost2019;
  if (!c) return { crop, unavailable: "No hay costos de producción publicados para este cultivo en el informe de 2019." };
  if (irrigation === "unconfirmed") return { crop, unavailable: "Confirma si tienes riego para buscar un costo y rendimiento del mismo sistema." };
  if (irrigation === "rainfed") return { crop, unavailable: "No hay datos de secano para este cultivo." };
  if (!historicCost(crop, irrigation)) return { crop, unavailable: "El informe no identifica el sistema de riego de este cultivo." };
  const y = yieldLbPerTarea(c);
  if (!y) return { crop, unavailable: crop === "arroz" ? "El rendimiento del arroz está en fanegas de arroz en cáscara y el precio es de arroz pilado: no se pueden comparar sin inventar un factor." : "La unidad de cosecha no se puede convertir a la del precio." };
  const pl = wholesaleRange(crop);
  if (!pl) return { crop, unavailable: "No hay precio mayorista comparable para este cultivo." };
  const costRD = c.costPerTarea * CPI.factor * tareas;
  const yieldLb = y.lb * tareas;
  const income = { low: yieldLb * pl.low, mid: yieldLb * pl.mid, high: yieldLb * pl.high };
  const notes = ["Precio mayorista de Santo Domingo: en la finca normalmente te pagan menos.", "Costo de 2019 ajustado con la inflación general, no con el precio real de tus insumos.", "Rendimiento promedio del Ministerio; tu cosecha puede ser mayor o menor.", ...(y.note ? [y.note] : [])];
  return { crop, tareas, costRD, yieldLb, pricePerLb: pl, income, profit: { low: income.low - costRD, mid: income.mid - costRD, high: income.high - costRD }, notes, costSource: { page: c.pdfPage, url: c.source, area: c.area, cost2019PerTarea: c.costPerTarea }, priceUnit: m!.unit ?? "" };
}
export const rd = (n: number) => `${n < 0 ? "−" : ""}RD$${Math.round(Math.abs(n)).toLocaleString("es-DO")}`;
