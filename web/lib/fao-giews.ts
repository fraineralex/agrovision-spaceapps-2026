/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. See AI_USAGE.md. */
import raw from "@/public/data/fao-giews.json";
export const faoGiews = raw;
export type FaoProvince = typeof raw.provinces[number];
export function faoProvince(name?: string): FaoProvince | undefined {
  return raw.provinces.find(p => p.name === name);
}
export function isRecent(date: string, asOf = new Date()): boolean {
  const days = (asOf.getTime() - Date.parse(date + "T00:00:00Z")) / 86400000;
  return Number.isFinite(days) && days >= 0 && days <= 45;
}
export function droughtSignal(province?: FaoProvince, asOf = new Date()) {
  const asi = province?.asi;
  const vhi = province?.weightedVhi ?? province?.vhi;
  if (!asi || !vhi || !isRecent(asi.date, asOf) || !isRecent(vhi.date, asOf)) {
    return { label: "Sin datos recientes", color: "gray", sentence: "No hay observación reciente suficiente para mostrar una alerta." };
  }
  if (asi.value > 30 || vhi.value < .35) return { label: "Sequía", color: "red", sentence: "Hay señales de estrés en la provincia; revisa el agua disponible antes de sembrar." };
  if (asi.value >= 10 || vhi.value < .5) return { label: "Atención", color: "amber", sentence: "Se observa estrés en parte de la provincia; comprueba las condiciones de tu terreno." };
  return { label: "Normal", color: "green", sentence: "La señal provincial es baja; confirma la humedad y el acceso al agua en tu terreno." };
}
export const faoScoreRule = "Regla exploratoria AgroVision, confianza baja: riesgo = máximo de ASI/100, déficit VHI max(0, (0.5 − VHI)/0.5) y frecuencia histórica ASI >30% (la mayor de las temporadas con ≥30 años válidos). Clima = 5 × (1 − riesgo × Kc·día de la rotación / máximo Kc·día comparado). No es aptitud climática ni probabilidad de pérdida. Lluvia y fenología no puntúan.";
export function droughtScore(province: FaoProvince | undefined, waterProxy: number, maximumProxy: number, asOf = new Date()): number | null {
  if (!province || droughtSignal(province, asOf).color === "gray" || !Number.isFinite(waterProxy) || !Number.isFinite(maximumProxy) || waterProxy < 0 || maximumProxy <= 0 || waterProxy > maximumProxy) return null;
  const histories = province.history.filter(h => h.seasons >= 30);
  if (!histories.length) return null;
  const vhi = (province.weightedVhi ?? province.vhi)!;
  const risk = Math.max(province.asi!.value / 100, Math.max(0, (.5 - vhi.value) / .5), ...histories.map(h => h.frequency30Pct / 100));
  return Math.round(50 * (1 - risk * waterProxy / maximumProxy)) / 10;
}
