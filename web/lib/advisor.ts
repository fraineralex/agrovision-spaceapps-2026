/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — next-crop advisor for the farmer view. Frainer review pending. See AI_USAGE.md. */
import { pestCatalog, pestsFor, pestPrecautions, sharedPests, type PestCrop } from "./pests";
import market from "@/public/data/market-insights.json";
import { droughtScore, droughtSignal, faoProvince } from "./fao-giews";
import type { Irrigation, Priority } from "./data";

/**
 * FAO-56 (Allen et al., 1998) Table 11 stage lengths [ini, dev, mid, late] in days and Table 12 Kc [ini, mid, end].
 * https://www.fao.org/4/x0490e/x0490e0b.htm — checked 2026-11-14. Kc ini for groundnut, tomato, onion, pepper,
 * squash, potato and sorghum are the crop-group values printed in Table 12; ranges use their midpoint
 * (tomato end 0.70–0.90 → 0.80; sorghum mid 1.00–1.10 → 1.05). Regions are FAO examples, not Dominican calibration.
 */
const FAO56: Record<ScoredCropId, { stages: [number, number, number, number] | null; kc: [number, number, number]; row: string }> = {
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

type ScoredCropId = "habichuela_roja" | "habichuela_negra" | "maiz" | "arroz" | "batata" | "yuca" | "platano" | "guineo" | "mani" | "tomate" | "cebolla" | "aji" | "auyama" | "papa" | "pepino" | "berenjena" | "repollo" | "zanahoria" | "pina" | "cafe" | "cacao" | "aguacate";
import { soilNote, type SoilNote } from "@/lib/soil";
export type CropId = ScoredCropId | "ajo";
export type PreviousCrop = CropId | PestCrop | "otro" | "unknown";
export const cropNames: Record<string, string> = { ajo: "Ajo", habichuela_roja: "Habichuela roja", habichuela_negra: "Habichuela negra", maiz: "Maíz", arroz: "Arroz", batata: "Batata", yuca: "Yuca", platano: "Plátano", guineo: "Guineo", mani: "Maní", tomate: "Tomate", cebolla: "Cebolla", aji: "Ají", auyama: "Auyama", papa: "Papa", pepino: "Pepino", berenjena: "Berenjena", repollo: "Repollo", zanahoria: "Zanahoria", pina: "Piña", cafe: "Café", cacao: "Cacao", aguacate: "Aguacate" };
export const cropEmoji: Record<string, string> = { habichuela_roja: "🫘", habichuela_negra: "🫘", maiz: "🌽", arroz: "🌾", batata: "🍠", yuca: "🌿", platano: "🍌", guineo: "🍌", mani: "🥜", tomate: "🍅", cebolla: "🧅", aji: "🫑", auyama: "🎃", papa: "🥔", pepino: "🥒", berenjena: "🍆", repollo: "🥬", zanahoria: "🥕", pina: "🍍", cafe: "☕", cacao: "🍫", aguacate: "🥑" };
export const isPerennial = (id: string) => FAO56[id as ScoredCropId]?.stages === null;
const scoredCrops = Object.keys(FAO56) as ScoredCropId[];
export const allCrops: CropId[] = [...scoredCrops, "ajo"];
export const previousCrops = Array.from(new Set([...allCrops, ...Object.keys(pestCatalog) as PestCrop[]]));
export const previousCropName = (crop: PreviousCrop) => pestsFor(crop)?.name ?? cropNames[crop] ?? "otro cultivo";
export const defaultCrops: CropId[] = ["habichuela_roja", "habichuela_negra", "maiz", "arroz", "batata", "yuca", "platano", "guineo", "tomate", "aji", "auyama"];
export const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
export const TAREAS_PER_HA = 10000 / 628.86; // 1 tarea = 628.86 m² (unidad usada en RD)
export const toTareas = (ha: number) => Math.round(ha * TAREAS_PER_HA);

type MarketCrop = {
  label: string; seriesId: string | null; unit: string | null;
  priceQuality?: { excluded: { period: string; week?: string; value: number | null }[]; rule: string };
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
export type PestState = "rotation" | "repeat" | "shared" | "maybe" | "different" | "listed" | "unknown";
export type AdvicePriority = Priority | "balanced";
export type CropAdvice = {
  crop: CropId; repeats: boolean; name: string; cycleDays: number; harvestMonth: number;
  scores: Record<Pillar, number | null>; overall: number | null; viable: boolean;
  pestPrecautions: string[];
  sharedPests: ReturnType<typeof sharedPests>;
  words: Record<Pillar, string>; lights: Record<Pillar, string>; titles: Record<Pillar, string>; pestState: PestState; watch: string[]; soil: SoilNote; warnings: string[]; kcDays: number; faoRow: string;
};

const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n * 10) / 10));
// Water per cycle: integral of the FAO-56 piecewise-linear Kc curve (Kc·day, not mm). This is what a farmer
// must supply per season. Perennials have no Table 11 stages: one year at the mean of their Table 12 values.
export function meanKc(id: CropId) {
  const entry = FAO56[id as ScoredCropId];
  if (!entry) return 0;
  const { stages, kc: [ki, km, ke] } = entry;
  if (!stages) return 365 * (ki + km + ke) / 3;
  const [a, b, c, d] = stages;
  return a * ki + b * (ki + km) / 2 + c * km + d * (km + ke) / 2;
}

/** Score each candidate crop for the next season. Every rule is documented in docs/16_asesor_siembra.md. */
export function adviseNextCrop(opts: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops?: CropId[] }): CropAdvice[] {
  const ids = [...new Set(opts.crops?.length ? opts.crops : defaultCrops)].filter((id): id is ScoredCropId => Object.hasOwn(FAO56, id));
  const crops = ids.map(crop => ({ crop, kcDays: meanKc(crop), cycleDays: FAO56[crop].stages?.reduce((a, b) => a + b, 0) ?? 0 }));
  const maxKc = Math.max(...scoredCrops.map(meanKc));
  const minKc = Math.min(...scoredCrops.map(meanKc));
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
    const repeats = opts.previous === crop || (bean(opts.previous) && bean(crop));
    if (repeats) warnings.push("Repetir el cultivo puede mantener plagas en el terreno. Revisa el historial de la finca.");
    if (bean(opts.previous) && crop === "maiz") pests = 5;
    else if (repeats) pests = 1;
    if (reported.length) {
      pests = 1;
    }
    // Both crops are in the Dominican pest catalogue and list no pest in common: say so instead of "no data".
    // The stars do not change: the catalogue lists only the main pests of each crop.
    const bothListed = Boolean(pestsFor(String(opts.previous)) && pestsFor(crop));
    const pestState: PestState = pests === 5 ? "rotation" : pests === 1 ? (repeats ? "repeat" : "shared") : shared.length ? "maybe" : bothListed ? "different" : pestsFor(crop) ? "listed" : "unknown";
    const watch = (pestsFor(crop)?.pests ?? []).filter(p => !p.external).map(p => p.name.toLowerCase()).filter((n, i, all) => all.indexOf(n) === i);
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
      water: !viable ? "Necesita riego y no tienes" : water >= 3.34 ? "Pide poca agua" : water >= 1.67 ? "Pide agua regular" : "Pide mucha agua",
      climate: signal.color === "green" ? "Sin sequía ahora" : signal.color === "amber" ? "Algo de sequía en la zona" : signal.color === "red" ? "Hay sequía en la zona" : "Sin dato de sequía",
      pests: reported.length ? "Comparte plagas con tu cultivo anterior" : pests === 5 ? "Ayuda a cortar las plagas (rotación del IDIAF)" : pests === 1 ? "Repetir el cultivo mantiene las plagas" : shared.length ? "Puede compartir plagas (por confirmar) †" : pestState === "different" ? "No comparten sus plagas principales, según las guías" : watch.length ? `Vigila ${watch.slice(0, 2).join(" y ")}` : "Las guías no listan plagas de este cultivo",
      market: perennial ? "Cultivo permanente: no tiene un mes de cosecha" : pctVsAvg === null ? "No hay precio de referencia" : `Cosechas en ${monthNames[harvestMonth - 1]}: el precio suele estar ${pctVsAvg > 0 ? `${pctVsAvg}% más alto que` : pctVsAvg < 0 ? `${-pctVsAvg}% más bajo que` : "igual a"} lo normal`,
    };
    return { crop, repeats, name: cropNames[crop], cycleDays, harvestMonth, scores, overall: viable ? overall : null, viable, pestPrecautions: pestPrecautions(opts.previous, crop), sharedPests: shared, words, pestState, watch, lights: { water: lightFor(water), climate: lightFor(climate), pests: pestState === "different" ? "green" : pestState === "maybe" ? "amber" : lightFor(pests), market: lightFor(marketScore) }, titles: { water: pillarTitle("water", water), climate: pillarTitle("climate", climate), pests: pestState === "different" ? "Plagas distintas" : pestState === "maybe" ? "Ojo con plagas" : pestState === "listed" ? "Plagas a vigilar" : pillarTitle("pests", pests), market: pillarTitle("market", marketScore) }, soil: soilNote(String(opts.previous), crop, previousCropName(opts.previous), cropNames[crop]), warnings, kcDays: Math.round(kcDays), faoRow: FAO56[crop].row };
  });
  // Permanent crops are investments, not the next rotation: list them after seasonal crops.
  return advice.sort((a, b) => Number(b.viable) - Number(a.viable) || Number(a.repeats) - Number(b.repeats) || Number(a.cycleDays === 0) - Number(b.cycleDays === 0) || (b.overall ?? -1) - (a.overall ?? -1));
}

export function recommendedCrop(advice: CropAdvice[]) {
  return advice.find(item => item.viable && !item.repeats && item.harvestMonth > 0);
}

/** One plain sentence for the top recommendation. */
export function adviceSentence(top: CropAdvice | undefined, previous: PreviousCrop): string {
  if (!top || top.repeats || top.overall === null) return "Falta información para recomendar. Consulta con tu técnico.";
  const reasons: string[] = [];
  if (top.soil.level === "good") reasons.push(top.soil.title.toLowerCase());
  if (top.scores.pests === 5) reasons.push("el IDIAF respalda rotar habichuela con maíz");
  if ((top.scores.water ?? 0) >= 3.34) reasons.push("pide menos agua que los otros cultivos de tu lista");
  if ((top.scores.market ?? 0) >= 3.34) reasons.push(`suele venderse mejor en ${monthNames[top.harvestMonth - 1]}`);
  if (!reasons.length) reasons.push("es el que mejor sale entre los cultivos de tu lista");
  const after = previous !== "unknown" && previous !== "otro" ? ` después de ${previousCropName(previous).toLowerCase()}` : "";
  return `Considera ${top.name.toLowerCase()}${after}${reasons.length ? ": " + reasons.slice(0, 2).join(" y ") : ""}.`;
}

/** Short farmer-facing headline per pillar: what the colour means in plain words. */
export function pillarTitle(id: Pillar, score: number | null): string {
  const c = lightFor(score);
  const t: Record<Pillar, Record<string, string>> = {
    water: { green: "Pide poca agua", amber: "Pide agua regular", red: "Pide mucha agua", gray: "Sin dato de agua" },
    climate: { green: "Sin sequía", amber: "Algo de sequía", red: "Hay sequía", gray: "Sin dato" },
    pests: { green: "Menos plagas", amber: "Ojo con plagas", red: "Riesgo de plagas", gray: "Sin dato" },
    market: { green: "Buen precio", amber: "Precio normal", red: "Precio bajo", gray: "Sin precio" },
  };
  return t[id][c];
}
/** Whole stars (1-5) shown instead of the decimal score. */
export const starsFor = (score: number | null) => score === null ? 0 : Math.max(1, Math.min(5, Math.round(score)));
/** Plain "why this crop and not another" text built only from the same comparison data. */
export function whyThisCrop(a: CropAdvice, all: CropAdvice[], previous: PreviousCrop): string[] {
  const out: string[] = [];
  const name = a.name.toLowerCase();
  const good = (["water", "climate", "pests", "market"] as Pillar[]).filter(p => (a.scores[p] ?? 0) >= 3.34);
  const bad = (["water", "climate", "pests", "market"] as Pillar[]).filter(p => a.scores[p] !== null && a.scores[p]! < 1.67);
  const say: Record<Pillar, string> = {
    water: "pide poca agua", climate: "no hay sequía en tu zona ahora",
    pests: "ayuda a cortar las plagas del cultivo anterior", market: `se cosecha en ${a.harvestMonth ? monthNames[a.harvestMonth - 1] : "un mes"} con buen precio`,
  };
  const sayBad: Record<Pillar, string> = {
    water: "pide mucha agua", climate: "hay sequía en tu zona",
    pests: "puede mantener las plagas del cultivo anterior", market: "se cosecha cuando el precio suele estar bajo",
  };
  if (!a.viable) { out.push(`${a.name} necesita riego y dijiste que no tienes. Por eso no lo recomendamos ahora.`); return out; }
  const top = recommendedCrop(all);
  if (good.length) out.push(`${a.name} sale bien porque ${good.map(p => say[p]).join(", ").replace(/, ([^,]*)$/, " y $1")}.`);
  else out.push(`${a.name} no destaca en nada, pero tampoco sale mal en la comparación.`);
  if (a.soil.level === "good") out.push(`Para la tierra: ${a.soil.text}`);
  if (a.soil.level === "bad") out.push(`Ojo con la tierra: ${a.soil.text}`);
  if (bad.length) out.push(`Lo que tiene en contra: ${bad.map(p => sayBad[p]).join(" y ")}.`);
  if (a.scores.market !== null && !good.includes("market") && !bad.includes("market")) out.push("El precio al cosechar es normal: ni muy bueno ni muy malo.");
  if (a.pestState === "different") out.push(`De plagas: ${name} y tu cultivo anterior no comparten sus plagas principales según las guías dominicanas, así que el cambio ayuda a cortarlas.${a.watch.length ? ` En ${name} hay que vigilar ${a.watch.slice(0, 2).join(" y ")}.` : ""}`);
  else if (a.pestState === "listed" && a.watch.length) out.push(`De plagas: en ${name} hay que vigilar ${a.watch.slice(0, 2).join(" y ")}. Dinos qué sembraste antes para comparar.`);
  else if (a.pestState === "unknown") out.push(`De plagas: las guías que usamos no listan las plagas de ${name}. Pregunta a tu técnico.`);
  const gaps = ["no medimos tu tierra (haría falta un análisis de suelo)", "el precio es al por mayor en Santo Domingo, no lo que te pagan en la finca"];
  if (a.pestState === "unknown") gaps.unshift(`las guías no listan las plagas de ${name}`);
  if (a.pestState === "different" || a.pestState === "listed") gaps.unshift("las guías solo listan las plagas principales; puede haber otras en tu zona");
  out.push(`Lo que no sabemos: ${gaps.join("; ")}.`);
  if (top && top.crop === a.crop) {
    const next = all.find(x => x.viable && x.crop !== a.crop && x.overall !== null);
    if (next) {
      const worse = (["water", "pests", "market"] as Pillar[]).find(p => a.scores[p] !== null && next.scores[p] !== null && a.scores[p]! - next.scores[p]! >= 0.5);
      const w: Record<string, string> = { water: "pide menos agua", pests: "trae menos riesgo de plagas", market: "se cosecha con mejor precio" };
      const noPestData = a.scores.pests === 5 && next.scores.pests === null;
      out.push(worse ? `¿Por qué no ${next.name.toLowerCase()}? Porque ${name} ${w[worse]}.`
        : noPestData ? `¿Por qué no ${next.name.toLowerCase()}? Porque para ${name} hay una rotación recomendada por el IDIAF y para ${next.name.toLowerCase()} no tenemos ese dato.`
        : `${next.name} sale parecido: también es una opción.`);
    }
    const prev = previous !== "unknown" && previous !== "otro" ? all.find(x => x.crop === previous) : undefined;
    if (prev && prev.repeats) out.push(`¿Por qué no repetir ${prev.name.toLowerCase()}? Porque sembrar lo mismo seguido cansa la tierra (saca siempre los mismos nutrientes) y deja las plagas en el terreno.`);
  } else if (top) {
    out.push(`El que mejor sale en tu lista es ${top.name.toLowerCase()}.`);
  }
  return out;
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
  if (low) return { level: "temporada", sentence: `En ${monthNames[harvestMonth - 1]} el precio mayorista histórico estuvo ${Math.round(100 - idx!)}% más bajo que el promedio.` };
  return null;
}

export type OptionKey = "water" | "market" | "pests" | "climate" | "keep" | "other";
export type FarmOption = { key: OptionKey; goal: string; advice: CropAdvice | null; note?: string };
/** The five choices the farmer compares: the best crop for each goal plus keeping the current crop. */
export function fiveOptions(opts: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; crops?: CropId[] }): FarmOption[] {
  const goals: [Pillar, string][] = [["water", "Menor demanda de agua"], ["market", "Mejor precio histórico"], ["pests", "Rotación respaldada para plagas"], ["climate", "Comparar ante la sequía"]];
  const out: FarmOption[] = goals.map(([key, goal]) => {
    const ranked = adviseNextCrop({ ...opts, priority: key });
    const alternatives = ranked.filter(a => a.viable && a.harvestMonth > 0 && !a.repeats && a.scores[key] !== null);
    const best = key === "pests"
      ? alternatives.find(a => a.scores.pests === 5) ?? ranked.find(a => a.viable && a.harvestMonth > 0 && !a.repeats && a.pestState === "different") ?? null
      : alternatives.sort((a, b) => b.scores[key]! - a.scores[key]!)[0] ?? null;
    return { key, goal, advice: best, note: key === "pests" ? "Falta evidencia local a favor de una rotación con los cultivos elegidos." : "Faltan datos para comparar este criterio en las alternativas." };
  });
  const keepCrop = allCrops.find(crop => crop === opts.previous) ?? null;
  const keep = keepCrop ? adviseNextCrop({ ...opts, priority: "water", crops: [keepCrop] })[0] ?? null : null;
  // The challenge asks for at least three strategies including the current one: add the next-best crop when the goals all point to the same crop.
  const shown = new Set(out.flatMap(o => o.advice ? [o.advice.crop] : []));
  if (shown.size < 2) {
    const next = adviseNextCrop({ ...opts, priority: "balanced" as AdvicePriority }).find(a => a.viable && a.harvestMonth > 0 && !a.repeats && a.overall !== null && !shown.has(a.crop));
    if (next) out.push({ key: "other", goal: "Otra opción de tu lista", advice: next });
  }
  out.push({ key: "keep", goal: keepCrop ? `Seguir con ${cropNames[keepCrop].toLowerCase()}` : "Seguir con lo que siembras", advice: keep, note: keepCrop ? undefined : opts.previous === "unknown" || opts.previous === "otro" ? "No nos dijiste qué siembras ahora. Puedes decirlo en “Editar”." : "Este cultivo aún no está disponible para comparar." });
  return out;
}
