/* AI: Claude (Anthropic), 2026-11-14 — next-crop advisor for the farmer view. Frainer review pending. See AI_USAGE.md. */
import market from "@/public/data/market-insights.json";
import { catalog, coefficientDays } from "./data";
import { droughtScore, droughtSignal, faoProvince } from "./fao-giews";
import type { Irrigation, Priority } from "./data";

export type CropId = "habichuela_roja" | "maiz" | "arroz" | "batata";
export type PreviousCrop = CropId | "otro" | "unknown";
export const cropNames: Record<CropId, string> = { habichuela_roja: "Habichuela", maiz: "Maíz", arroz: "Arroz", batata: "Batata" };
const catalogId: Record<CropId, string> = { habichuela_roja: "beans", maiz: "maize", arroz: "rice", batata: "sweet-potato" };
export const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
export const TAREAS_PER_HA = 10000 / 628.86; // 1 tarea = 628.86 m² (unidad usada en RD)
export const toTareas = (ha: number) => Math.round(ha * TAREAS_PER_HA);

type MarketCrop = (typeof market.crops)[keyof typeof market.crops] & {
  latest?: { period: string; price: number }; yearAgo?: { period: string; price: number } | null;
  seasonalIndex?: Record<string, number | null>; bestSellMonths?: number[]; worstSellMonths?: number[];
  outlook?: { horizonMonths: number; period: string; price: number; low: number; high: number; backtestMapePct: number; backtestN: number }[];
  recent?: { period: string; price: number }[];
  sowing: { status: string | null; ratio?: number | null; peakSowingMonths: number[]; windowEnd?: string; tareasLast12?: number; medianPrev12?: number } | null;
  cost2019?: { area: string; pdfPage: number; yield: number; yieldUnit: string; yieldLb: number | null; costPerTarea: number; source: string };
};
export const marketFor = (crop: string) => (market.crops as unknown as Record<string, MarketCrop>)[crop];
export const marketSources = market.sources;
export const marketLimits = market.limits;

export type Pillar = "water" | "climate" | "pests" | "market";
export type CropAdvice = {
  crop: CropId; name: string; cycleDays: number; harvestMonth: number;
  scores: Record<Pillar, number | null>; overall: number | null; viable: boolean;
  words: Record<Pillar, string>; warnings: string[]; kcDays: number;
};

const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n * 10) / 10));

/** Score each candidate crop for the next season. Every rule is documented in docs/16_asesor_siembra.md. */
export function adviseNextCrop(opts: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: Priority }): CropAdvice[] {
  const crops = (Object.keys(cropNames) as CropId[]).map(crop => {
    const c = catalog.crops.find(x => x.id === catalogId[crop])!;
    return { crop, kcDays: coefficientDays(c), cycleDays: c.stages.reduce((a, b) => a + b, 0) };
  });
  const maxKc = Math.max(...crops.map(c => c.kcDays));
  const minKc = Math.min(...crops.map(c => c.kcDays));
  const fao = faoProvince(opts.province);
  const signal = droughtSignal(fao);
  const advice = crops.map(({ crop, kcDays, cycleDays }) => {
    const harvestMonth = ((opts.sowMonth - 1 + Math.round(cycleDays / 30)) % 12) + 1;
    const warnings: string[] = [];
    // Water: relative FAO-56 Kc·day among candidates. Flooded rice uses more than this (ponding, seepage).
    let water: number | null = clamp(5 * (maxKc - kcDays) / (maxKc - minKc));
    let viable = true;
    if (crop === "arroz" && opts.irrigation === "rainfed") { water = 0; viable = false; warnings.push("El arroz necesita riego; sin riego no se recomienda."); }
    const climate = droughtScore(fao, kcDays, maxKc);
    // Pests: only the cited IDIAF relation (bean followed by a non-host such as maize), and repeating the same host.
    let pests: number | null = null;
    if (opts.previous === "habichuela_roja" && crop === "maiz") pests = 5;
    else if (opts.previous !== "unknown" && opts.previous !== "otro" && opts.previous === crop) pests = 1;
    const m = marketFor(crop);
    const idx = m?.seasonalIndex?.[String(harvestMonth)] ?? null;
    let marketScore: number | null = typeof idx === "number" ? clamp(2.5 + (idx - 100) / 5) : null;
    const sowing = m?.sowing;
    if (sowing?.status === "alta") { warnings.push("Este año se está sembrando más de lo normal en el país: el precio podría bajar."); if (marketScore !== null) marketScore = clamp(marketScore - 1); }
    const scores: Record<Pillar, number | null> = { water, climate, pests, market: marketScore };
    const weightFor = (p: Pillar) => (opts.priority === p || (opts.priority === "soil" && p === "water")) ? 2 : 1;
    const used = (Object.keys(scores) as Pillar[]).filter(p => scores[p] !== null);
    const overall = used.length ? clamp(used.reduce((s, p) => s + scores[p]! * weightFor(p), 0) / used.reduce((s, p) => s + weightFor(p), 0)) : null;
    const pctVsAvg = typeof idx === "number" ? Math.round(idx - 100) : null;
    const words: Record<Pillar, string> = {
      water: !viable ? "Necesita riego" : water >= 3.34 ? "Gasta poca agua" : water >= 1.67 ? "Agua media" : "Gasta mucha agua",
      climate: climate === null ? "Sin dato de sequía" : signal.color === "green" ? "Sin sequía ahora" : climate >= 3.34 ? "Aguanta la sequía actual" : "Riesgo con la sequía",
      pests: pests === 5 ? "Corta plagas de la habichuela" : pests === 1 ? "Repetir no corta plagas" : "Sin regla de plagas",
      market: pctVsAvg === null ? "Sin precio de referencia" : `Cosecha en ${monthNames[harvestMonth - 1]}: precio ${pctVsAvg > 0 ? `${pctVsAvg}% sobre` : pctVsAvg < 0 ? `${-pctVsAvg}% bajo` : "igual al"} promedio`,
    };
    return { crop, name: cropNames[crop], cycleDays, harvestMonth, scores, overall: viable ? overall : null, viable, words, warnings, kcDays: Math.round(kcDays) };
  });
  return advice.sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));
}

/** One plain sentence for the top recommendation. */
export function adviceSentence(top: CropAdvice | undefined, previous: PreviousCrop): string {
  if (!top || top.overall === null) return "Falta información para recomendar. Consulta con tu técnico.";
  const reasons: string[] = [];
  if (top.scores.pests === 5) reasons.push("corta plagas de la habichuela");
  if ((top.scores.water ?? 0) >= 3.34) reasons.push("gasta menos agua");
  if ((top.scores.market ?? 0) >= 3.34) reasons.push(`suele venderse mejor en ${monthNames[top.harvestMonth - 1]}`);
  const after = previous !== "unknown" && previous !== "otro" ? ` después de ${cropNames[previous].toLowerCase()}` : "";
  return `Conviene sembrar ${top.name.toLowerCase()}${after}${reasons.length ? ": " + reasons.slice(0, 2).join(" y ") : ""}.`;
}

export const lightFor = (score: number | null) => score === null ? "gray" : score >= 3.34 ? "green" : score >= 1.67 ? "amber" : "red";
