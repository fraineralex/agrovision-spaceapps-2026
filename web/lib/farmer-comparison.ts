/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import evidence from "@/public/data/farmer-pillars.json";
import type { ClimateContext } from "./location-climate";
import type { Priority } from "./data";
export type Pillar = "water" | "climate" | "pests" | "market";
export const pillarColor = (score: number | null) => score === null ? "gray" : score >= 3.34 ? "green" : score >= 1.67 ? "amber" : "red";
const labels: Record<string,string> = {habichuela_roja:"Habichuela",maiz:"Maíz",leguminosa_pulse:"Leguminosa de ejemplo",guandul_cover_proxy:"Guandul (aproximación)"};
const series: Record<string,string> = {habichuela_roja:"red_bean:jose_beta_short:primera:DOP/lb",maiz:"maize:frances_largo:primera:DOP/lb"};
const round = (n:number) => Math.round(n*100)/100;
export function getFarmerComparison(sanJuan:boolean, context:ClimateContext | null, priority:Priority) {
  const proxies = evidence.rotations.map(r => r.cycles.reduce((sum,c) => {
    const [a,b,d,e]=c.stageDays;
    return sum+a*c.kcIni+b*(c.kcIni+c.kcMid)/2+d*c.kcMid+e*(c.kcMid+c.kcEnd)/2;
  },0));
  const temperatures = context?.monthly.map(m=>m.temperatureC) ?? [];
  const complete = temperatures.length === 12 && temperatures.every(t=>t!==null && Number.isFinite(t));
  // National cache has mean temperature, not Tmax: a distinct thermal screen, without rainfall.
  const hot = complete ? [...temperatures as number[]].sort((a,b)=>a-b)[8] : null;
  const scenarios = evidence.rotations.map((rotation,index) => {
    const derived = evidence.waterClimate.scenarios.find(s=>s.id===rotation.id)!;
    const climatePillar = derived.pillars.find(p=>p.pillar==="climate")!;
    const waterPillar = derived.pillars.find(p=>p.pillar==="water_soil")!;
    const days = rotation.cycles.flatMap(c=>c.months);
    const hotDays = hot === null ? null : days.reduce((sum,m)=>sum+(context!.monthly.find(row=>row.month===m.month)!.temperatureC! > hot ? m.cropDays : 0),0);
    const climate = sanJuan ? climatePillar.score : hotDays === null ? null : round(5*(1-hotDays/days.reduce((sum,m)=>sum+m.cropDays,0)));
    const prices = rotation.cycles.flatMap(c=> {
      const row = evidence.market.monthlySeasonality.find(row=>row.seriesId===series[c.cropId] && row.month===Number(c.endDateTemplate.slice(5,7)) && row.index!==null);
      return row && typeof row.index === "number" ? [{crop:labels[c.cropId],...row}] : [];
    });
    // A descriptive seasonal price index, not the source's intentionally withheld validated market score.
    const priceIndex = prices.length ? prices.reduce((sum,p)=>sum+p.index!,0)/prices.length : null;
    const market = priceIndex === null ? null : round(Math.max(0,Math.min(5,2.5+(priceIndex-100)/10)));
    const supported = rotation.cycles.some((c,i)=>c.cropId==="habichuela_roja" && rotation.cycles[i+1]?.cropId==="maiz");
    const scores:Record<Pillar,number|null> = {
      water:sanJuan ? waterPillar.score : round(5*(Math.max(...proxies)-proxies[index])/(Math.max(...proxies)-Math.min(...proxies))),
      climate,pests:supported ? 5 : null,market,
    };
    return {id:rotation.id,label:rotation.cycles.map(c=>labels[c.cropId]).join(" → "),scores,
      details: {
        water: sanJuan ? `Estimación preliminar: ${rotation.netIrrigationMm} mm/secuencia; score ${scores.water}/5 relativo a estas tres secuencias. NASA POWER diario 2016–2025, celda regional ~0.5°, FAO-56 y lluvia efectiva USDA-SCS. Confianza 0.35, sin suelo ni pérdidas de riego. Lluvia POWER limitada; no ahorro medido.` : `Indicador genérico ${round(proxies[index])} Kc·día; score ${scores.water}/5 relativo a estas secuencias. FAO-56 (1998), ejemplos publicados sin calibración local, confianza baja. No mide riego ni suelo. No se traslada el agua estimada de San Juan.`,
        climate: sanJuan ? `Score ${climate}/5: días del ciclo fuera de meses cálidos (Tmax) o secos (cuartiles). NASA POWER 2016–2025, escala regional ~0.5°, reanálisis; confianza 0.45 preliminar. Incluye lluvia POWER con limitaciones; no es aptitud del cultivo ni pronóstico.` : climate===null ? "Sin datos climáticos completos para este punto; no se sustituyen por San Juan." : `Score ${climate}/5: proporción de días del ciclo fuera del cuartil superior de temperatura media mensual. ${context!.source.name}, ${context!.source.period}, ${context!.source.scale}; reanálisis. Confianza baja, sin umbral validado por cultivo; no incluye lluvia ni equivale al método Tmax/sequía de San Juan.`,
        pests: supported ? `Regla parcial cumplida: 5/5 indica habichuela seguida de maíz, no ausencia de plagas. ${evidence.pestRule.source}. Regla agronómica para RD, sin período de observación ni validación en finca; confianza local baja. ${evidence.pestRule.rule}` : `Sin regla verificada para la secuencia completa. ${evidence.pestRule.source} respalda habichuela → maíz, pero no permite extender esa relación a una leguminosa sin identificar o al guandul. No se predicen plagas.`,
        market: priceIndex===null ? "Sin serie comparable para los cultivos y meses de cosecha del ejemplo." : `Referencia parcial ${market}/5 = limitar a 0–5 [2.5 + (índice − 100)/10]; índice estacional medio ${round(priceIndex)} (media anual=100). Cubre ${prices.length}/${rotation.cycles.length} cultivos: ${prices.map(p=>`${p.crop}, mes ${p.month}, ${p.nYears} años (${p.years.join(", ")}), ${p.seriesId}`).join("; ")}. Ministerio de Agricultura, ${evidence.market.periodStart}–${evidence.market.periodEnd}, mayoristas de Santo Domingo; no precio de finca de esta provincia. Calidad preliminar, confianza sin calibrar; score descriptivo nuevo, no validado. No garantiza buen precio ni ganancias.`,
      }, dates:rotation.cycles.map(c=>`${labels[c.cropId]}: ${c.sowingDateTemplate} a ${c.endDateTemplate}`).join("; "),
      sourceUrls:{water:"https://www.fao.org/4/x0490e/x0490e0b.htm",climate:context?.source.url ?? "https://power.larc.nasa.gov/",pests:evidence.pestRule.url,market:evidence.market.sources[0].url},
    };
  });
  const key: Pillar = priority === "soil" ? "water" : priority;
  return priority === "soil" ? scenarios : [...scenarios].sort((a,b)=>(b.scores[key]??-1)-(a.scores[key]??-1));
}
