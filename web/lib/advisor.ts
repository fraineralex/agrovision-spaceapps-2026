/* AI: Claude (Anthropic), 2026-11-14 — next-crop advisor for the farmer view. Frainer review pending. See AI_USAGE.md. */
import { pestCatalog, pestsFor, sharedPests, type PestCrop } from "./pests";
import market from "@/public/data/market-insights.json";
import { droughtScore, droughtSignal, faoProvince } from "./fao-giews";
import type { Irrigation, Priority } from "./data";

/**
 * FAO-56 (Allen et al., 1998) Table 11 stage lengths [ini, dev, mid, late] in days and Table 12 Kc [ini, mid, end].
 * https://www.fao.org/4/x0490e/x0490e0b.htm — checked 2026-11-14. Kc ini for groundnut, tomato, onion, pepper,
 * squash, potato and sorghum are the crop-group values printed in Table 12; ranges use their midpoint
 * (tomato end 0.70–0.90 → 0.80; sorghum mid 1.00–1.10 → 1.05). Regions are FAO examples, not Dominican calibration.
 */
const FAO56: Record<CropId, { stages: [number, number, number, number] | null; kc: [number, number, number]; row: string }> = {
  habichuela_roja: { stages: [15, 25, 35, 20], kc: [0.4, 1.15, 0.35], row: "Beans, dry (Pakistan/California)" },
  habichuela_negra: { stages: [15, 25, 35, 20], kc: [0.4, 1.15, 0.35], row: "Beans, dry (Pakistan/California)" },
  maiz: { stages: [20, 35, 40, 30], kc: [0.3, 1.2, 0.6], row: "Maize, grain (Nigeria humid)" },
  arroz: { stages: [30, 30, 60, 30], kc: [1.05, 1.2, 0.9], row: "Rice (tropics)" },
  batata: { stages: [15, 30, 50, 30], kc: [0.5, 1.15, 0.65], row: "Sweet potato (tropical rainy season)" },
  yuca: { stages: [20, 40, 90, 60], kc: [0.3, 0.8, 0.3], row: "Cassava, year 1 (tropical regions)" },
  platano: { stages: [120, 90, 120, 60], kc: [0.5, 1.1, 1.0], row: "Banana, 1st year (Mediterranean)" },
  guineo: { stages: [120, 90, 120, 60], kc: [0.5, 1.1, 1.0], row: "Banana, 1st year (Mediterranean)" },
  mani: { stages: [25, 35, 45, 25], kc: [0.4, 1.15, 0.6], row: "Groundnut (West Africa)" },
  tomate: { stages: [30, 40, 40, 25], kc: [0.6, 1.15, 0.8], row: "Tomato (arid region)" },
  cebolla: { stages: [15, 25, 70, 40], kc: [0.7, 1.05, 0.75], row: "Onions, dry (Mediterranean)" },
  aji: { stages: [25, 35, 40, 20], kc: [0.6, 1.05, 0.9], row: "Sweet peppers (Europe/Mediterranean)" },
  auyama: { stages: [20, 30, 30, 20], kc: [0.5, 1.0, 0.8], row: "Pumpkin, winter squash (Mediterranean)" },
  papa: { stages: [25, 30, 45, 30], kc: [0.5, 1.15, 0.75], row: "Potato (semi-arid)" },
  pepino: { stages: [20, 30, 40, 15], kc: [0.6, 1.0, 0.75], row: "Cucumber, fresh market (arid region)" },
  berenjena: { stages: [30, 40, 40, 20], kc: [0.6, 1.05, 0.9], row: "Egg plant (arid region)" },
  repollo: { stages: [40, 60, 50, 15], kc: [0.7, 1.05, 0.95], row: "Cabbage (California desert)" },
  zanahoria: { stages: [20, 30, 50, 20], kc: [0.7, 1.05, 0.95], row: "Carrots (arid climate)" },
  pina: { stages: [60, 120, 600, 10], kc: [0.5, 0.3, 0.3], row: "Pineapple, bare soil (Hawaii)" },
  // Perennials: Table 12 gives Kc but Table 11 has no stage lengths; they are permanent plantings.
  cafe: { stages: null, kc: [0.9, 0.95, 0.95], row: "Coffee, bare ground cover (perennial)" },
  cacao: { stages: null, kc: [1.0, 1.05, 1.05], row: "Cocoa (perennial)" },
  aguacate: { stages: null, kc: [0.6, 0.85, 0.75], row: "Avocado, no ground cover (perennial)" },
};
export const FAO56_URL = "https://www.fao.org/4/x0490e/x0490e0b.htm";

export type CropId = "habichuela_roja" | "habichuela_negra" | "maiz" | "arroz" | "batata" | "yuca" | "platano" | "guineo" | "mani" | "tomate" | "cebolla" | "aji" | "auyama" | "papa" | "pepino" | "berenjena" | "repollo" | "zanahoria" | "pina" | "cafe" | "cacao" | "aguacate";
export type PreviousCrop = CropId | PestCrop | "otro" | "unknown";
export const cropNames: Record<string, string> = { habichuela_roja: "Habichuela roja", habichuela_negra: "Habichuela negra", maiz: "Maíz", arroz: "Arroz", batata: "Batata", yuca: "Yuca", platano: "Plátano", guineo: "Guineo", mani: "Maní", tomate: "Tomate", cebolla: "Cebolla", aji: "Ají", auyama: "Auyama", papa: "Papa", pepino: "Pepino", berenjena: "Berenjena", repollo: "Repollo", zanahoria: "Zanahoria", pina: "Piña", cafe: "Café", cacao: "Cacao", aguacate: "Aguacate" };
export const cropEmoji: Record<string, string> = { habichuela_roja: "🫘", habichuela_negra: "🫘", maiz: "🌽", arroz: "🌾", batata: "🍠", yuca: "🌿", platano: "🍌", guineo: "🍌", mani: "🥜", tomate: "🍅", cebolla: "🧅", aji: "🫑", auyama: "🎃", papa: "🥔", pepino: "🥒", berenjena: "🍆", repollo: "🥬", zanahoria: "🥕", pina: "🍍", cafe: "☕", cacao: "🍫", aguacate: "🥑" };
export const isPerennial = (id: string) => FAO56[id as CropId]?.stages === null;
export const allCrops = Object.keys(FAO56) as CropId[];
export const previousCrops = Array.from(new Set([...allCrops, ...Object.keys(pestCatalog) as PestCrop[]]));
export const previousCropName = (crop: PreviousCrop) => pestsFor(crop)?.name ?? cropNames[crop] ?? "otro cultivo";
export const defaultCrops: CropId[] = ["habichuela_roja", "habichuela_negra", "maiz", "arroz", "batata", "yuca", "platano", "guineo", "tomate", "aji", "auyama"];
export const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
export const TAREAS_PER_HA = 10000 / 628.86; // 1 tarea = 628.86 m² (unidad usada en RD)
export const toTareas = (ha: number) => Math.round(ha * TAREAS_PER_HA);

type MarketCrop = {
  label: string; seriesId: string | null; unit: string | null;
  latest?: { period: string; price: number }; yearAgo?: { period: string; price: number } | null;
  seasonalIndex?: Record<string, number | null>; seasonalYearsUsed?: string[]; firstPeriod?: string; bestSellMonths?: number[]; worstSellMonths?: number[];
  outlook?: { horizonMonths: number; period: string; price: number; low: number; high: number; backtestMapePct: number; backtestN: number }[];
  recent?: { period: string; price: number }[];
  sowing: { status: string | null; ratio?: number | null; peakSowingMonths: number[]; windowEnd?: string; tareasLast12?: number; medianPrev12?: number } | null;
  cost2019?: { area: string; pdfPage: number; yield: number; yieldUnit: string; yieldLb: number | null; costPerTarea: number; source: string };
};
export const marketFor = (crop: string): MarketCrop | undefined => (market.crops as unknown as Record<string, MarketCrop>)[crop];
export const marketSources = market.sources;
export const marketLimits = market.limits;

export type Pillar = "water" | "climate" | "pests" | "market";
export type CropAdvice = {
  crop: CropId; name: string; cycleDays: number; harvestMonth: number;
  scores: Record<Pillar, number | null>; overall: number | null; viable: boolean;
  sharedPests: ReturnType<typeof sharedPests>;
  words: Record<Pillar, string>; warnings: string[]; kcDays: number; faoRow: string;
};

const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n * 10) / 10));
// Water per cycle: integral of the FAO-56 piecewise-linear Kc curve (Kc·day, not mm). This is what a farmer
// must supply per season. Perennials have no Table 11 stages: one year at the mean of their Table 12 values.
export function meanKc(id: CropId) {
  const { stages, kc: [ki, km, ke] } = FAO56[id];
  if (!stages) return 365 * (ki + km + ke) / 3;
  const [a, b, c, d] = stages;
  return a * ki + b * (ki + km) / 2 + c * km + d * (km + ke) / 2;
}

/** Score each candidate crop for the next season. Every rule is documented in docs/16_asesor_siembra.md. */
export function adviseNextCrop(opts: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: Priority; crops?: CropId[] }): CropAdvice[] {
  const ids = (opts.crops?.length ? opts.crops : defaultCrops).filter(id => id in FAO56);
  const crops = ids.map(crop => ({ crop, kcDays: meanKc(crop), cycleDays: FAO56[crop].stages?.reduce((a, b) => a + b, 0) ?? 0 }));
  const maxKc = Math.max(...allCrops.map(meanKc));
  const minKc = Math.min(...allCrops.map(meanKc));
  const fao = faoProvince(opts.province);
  const signal = droughtSignal(fao);
  const advice = crops.map(({ crop, kcDays, cycleDays }) => {
    const perennial = cycleDays === 0;
    const harvestMonth = perennial ? 0 : ((opts.sowMonth - 1 + Math.round(cycleDays / 30)) % 12) + 1;
    const warnings: string[] = [];
    if (perennial) warnings.push("Cultivo permanente: tarda años en producir y ocupa la tierra muchos años. Es una inversión, no una rotación.");
    // Water: mean daily Kc relative to all crops in the list (fixed scale, so choosing crops does not move scores).
    let water: number | null = clamp(5 * (maxKc - kcDays) / (maxKc - minKc));
    let viable = true;
    if (crop === "arroz" && opts.irrigation === "rainfed") { water = 0; viable = false; warnings.push("El arroz necesita riego; sin riego no se recomienda."); }
    if (!perennial && cycleDays > 300) warnings.push(`Es un cultivo largo (unos ${Math.round(cycleDays / 30)} meses): ocupa la tierra todo ese tiempo.`);
    const climate = droughtScore(fao, kcDays, maxKc);
    const shared = sharedPests(opts.previous, crop);
    const reported = shared.filter(pest => !pest.external);
    let pests: number | null = null;
    // Red and black beans are the same species (Phaseolus vulgaris), so they share hosts in the IDIAF rule.
    const bean = (c: string) => c === "habichuela_roja" || c === "habichuela_negra";
    if (bean(opts.previous) && crop === "maiz") pests = 5;
    else if (opts.previous !== "unknown" && opts.previous !== "otro" && (opts.previous === crop || (bean(opts.previous) && bean(crop)))) pests = 1;
    if (reported.length) {
      pests = 1;
      warnings.push(`Vigila ${reported.map(pest => pest.name.toLowerCase()).join(", ")}: aparecen en la lista de ambos cultivos.`);
    }
    const m = marketFor(crop);
    const idx = perennial ? null : m?.seasonalIndex?.[String(harvestMonth)] ?? null;
    let marketScore: number | null = typeof idx === "number" ? clamp(2.5 + (idx - 100) / 5) : null;
    const glut = perennial ? null : oversupplyFor(crop, harvestMonth);
    if (glut) warnings.push(glut.sentence);
    if (m?.sowing?.status === "alta" && marketScore !== null) marketScore = clamp(marketScore - 1);
    const scores: Record<Pillar, number | null> = { water, climate, pests, market: marketScore };
    const weightFor = (p: Pillar) => (opts.priority === p || (opts.priority === "soil" && p === "water")) ? 2 : 1;
    const used = (Object.keys(scores) as Pillar[]).filter(p => scores[p] !== null);
    // A host overlap must lower the ranking even when the other pillars average below one.
    const weighted = used.filter(p => p !== "pests" || pests === 5);
    const base = weighted.reduce((s, p) => s + scores[p]! * weightFor(p), 0) / weighted.reduce((s, p) => s + weightFor(p), 0);
    const overall = clamp(base - (pests === 1 ? 0.5 * weightFor("pests") : 0));
    const pctVsAvg = typeof idx === "number" ? Math.round(idx - 100) : null;
    const words: Record<Pillar, string> = {
      water: !viable ? "Necesita riego" : water >= 3.34 ? "Gasta poca agua" : water >= 1.67 ? "Agua media" : "Gasta mucha agua",
      climate: climate === null ? "Sin dato de sequía" : signal.color === "green" ? "Sin sequía ahora" : climate >= 3.34 ? "Aguanta la sequía actual" : "Riesgo con la sequía",
      pests: reported.length ? "Plagas en común" : pests === 5 ? "Rotación citada por IDIAF" : pests === 1 ? "Repetición de cultivo" : shared.length ? "Plaga en común por confirmar †" : "Sin puntaje de plagas",
      market: perennial ? "Permanente: sin mes de cosecha" : pctVsAvg === null ? "Sin precio de referencia" : `Cosecha en ${monthNames[harvestMonth - 1]}: precio ${pctVsAvg > 0 ? `${pctVsAvg}% sobre` : pctVsAvg < 0 ? `${-pctVsAvg}% bajo` : "igual al"} promedio`,
    };
    return { crop, name: cropNames[crop], cycleDays, harvestMonth, scores, overall: viable ? overall : null, viable, sharedPests: shared, words, warnings, kcDays: Math.round(kcDays), faoRow: FAO56[crop].row };
  });
  // Permanent crops are investments, not the next rotation: list them after seasonal crops.
  return advice.sort((a, b) => Number(a.cycleDays === 0) - Number(b.cycleDays === 0) || (b.overall ?? -1) - (a.overall ?? -1));
}

/** One plain sentence for the top recommendation. */
export function adviceSentence(top: CropAdvice | undefined, previous: PreviousCrop): string {
  if (!top || top.overall === null) return "Falta información para recomendar. Consulta con tu técnico.";
  const reasons: string[] = [];
  if (top.scores.pests === 5) reasons.push("el IDIAF respalda rotar habichuela con maíz");
  if ((top.scores.water ?? 0) >= 3.34) reasons.push("gasta menos agua");
  if ((top.scores.market ?? 0) >= 3.34) reasons.push(`suele venderse mejor en ${monthNames[top.harvestMonth - 1]}`);
  const after = previous !== "unknown" && previous !== "otro" ? ` después de ${previousCropName(previous).toLowerCase()}` : "";
  return `Conviene sembrar ${top.name.toLowerCase()}${after}${reasons.length ? ": " + reasons.slice(0, 2).join(" y ") : ""}.`;
}

export const unitWord = (u?: string | null) => u === "DOP/lb" ? "la libra" : u === "DOP/quintal" ? "el quintal" : u === "DOP/kg" ? "el kilo" : u === "DOP/unidad" ? "la unidad" : "la unidad";
export const lightFor = (score: number | null) => score === null ? "gray" : score >= 3.34 ? "green" : score >= 1.67 ? "amber" : "red";

/** Oversupply warning: national sowing in the last 12 months vs. previous years (MA consolidado de siembra) plus the
 *  price seasonality of the harvest month (MA wholesale prices). Provincial sowing is not published, so it says "en el país". */
export function oversupplyFor(crop: string, harvestMonth: number): { level: "alta" | "temporada"; sentence: string } | null {
  const m = marketFor(crop); if (!m) return null;
  const name = (cropNames[crop] ?? crop).toLowerCase();
  const idx = harvestMonth ? m.seasonalIndex?.[String(harvestMonth)] ?? null : null;
  const low = typeof idx === "number" && idx <= 95;
  if (m.sowing?.status === "alta") return { level: "alta", sentence: `Mucha gente está sembrando ${name} en el país (${Math.round(((m.sowing.ratio ?? 1) - 1) * 100)}% más que lo normal)${low || harvestMonth ? `; el precio podría bajar en la cosecha${harvestMonth ? ` (${monthNames[harvestMonth - 1]})` : ""}` : ""}.` };
  if (low) return { level: "temporada", sentence: `En ${monthNames[harvestMonth - 1]} suele haber mucha ${name} en el mercado: el precio suele estar ${Math.round(100 - idx!)}% más bajo que el promedio.` };
  return null;
}
