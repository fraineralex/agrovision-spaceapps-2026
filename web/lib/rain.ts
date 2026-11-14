/* AI: Claude (Anthropic), 2026-11-14 — 7-day rain and drought alert in plain words. Frainer review pending. See AI_USAGE.md. */
export type RainDay = { date: string; rainMm: number; probPct: number | null; tMaxC: number | null; gustKmh?: number | null; weatherCode?: number | null };
export type RainForecast = { source: "open-meteo" | "nasa-power"; kind: "forecast" | "recent"; url: string; fetchedAt: string; days: RainDay[]; cyclone?: boolean | null; dustPeak?: number | null };
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const dayName = (iso: string) => DAYS[new Date(`${iso}T12:00:00`).getDay()];
export const dayIcon = (d: RainDay) => d.rainMm >= 5 && (d.probPct ?? 100) >= 50 ? "🌧️" : d.rainMm >= 1 ? "🌦️" : (d.tMaxC ?? 0) >= 33 ? "🔥" : "☀️";

/** Rules (AgroVision, not agronomic advice): ≥5 mm with ≥50% probability counts as useful rain; a week with <5 mm in total is dry. */
export function rainAlert(f: RainForecast): { sentence: string; level: "rain" | "dry" | "normal" } {
  if (f.kind === "recent") {
    const total = f.days.reduce((s, d) => s + d.rainMm, 0);
    return total < 5 ? { sentence: `Sin pronóstico ahora. En los últimos ${f.days.length} días llovió muy poco (${Math.round(total)} mm): la tierra puede estar seca.`, level: "dry" }
      : { sentence: `Sin pronóstico ahora. En los últimos ${f.days.length} días llovieron unos ${Math.round(total)} mm.`, level: "normal" };
  }
  const wet = f.days.filter(d => d.rainMm >= 5 && (d.probPct ?? 100) >= 50);
  const total = f.days.reduce((s, d) => s + d.rainMm, 0);
  const hot = f.days.some(d => (d.tMaxC ?? 0) >= 33);
  if (f.days.some(d => d.rainMm >= 40 || (d.gustKmh ?? 0) >= 60 || (d.weatherCode ?? 0) >= 95)) return { sentence: "Posible lluvia intensa, tormenta o viento fuerte. Consulta los avisos de INDOMET antes de trabajar en campo.", level: "rain" };
  if (wet.length) {
    const first = wet[0];
    const when = f.days.indexOf(first) === 0 ? "hoy" : f.days.indexOf(first) === 1 ? "mañana" : `el ${dayName(first.date)}`;
    return { sentence: `No riegues ${when}: viene lluvia (unos ${Math.round(first.rainMm)} mm${first.probPct != null ? `, ${first.probPct}% de probabilidad` : ""}).`, level: "rain" };
  }
  if (total < 5) return { sentence: hot ? "Semana seca y caliente: riega temprano en la mañana o al atardecer." : "Semana seca: riega temprano y revisa la humedad de la tierra.", level: "dry" };
  return { sentence: `Poca lluvia esta semana (unos ${Math.round(total)} mm en total): riega según tu turno.`, level: "normal" };
}
export function parseOpenMeteo(j: { daily?: { time: string[]; precipitation_sum: (number | null)[]; precipitation_probability_max?: (number | null)[]; temperature_2m_max?: (number | null)[]; wind_gusts_10m_max?: (number | null)[]; weather_code?: (number | null)[] } }): RainDay[] {
  const d = j.daily; if (!d?.time?.length) return [];
  return d.time.flatMap((t, i) => Number.isFinite(d.precipitation_sum[i]) ? [{ date: t, rainMm: d.precipitation_sum[i]!, probPct: d.precipitation_probability_max?.[i] ?? null, tMaxC: d.temperature_2m_max?.[i] ?? null, gustKmh: d.wind_gusts_10m_max?.[i] ?? null, weatherCode: d.weather_code?.[i] ?? null }] : []);
}
export function parsePower(j: { properties?: { parameter?: { PRECTOTCORR?: Record<string, number>; T2M_MAX?: Record<string, number> } } }): RainDay[] {
  const p = j.properties?.parameter; if (!p?.PRECTOTCORR) return [];
  return Object.entries(p.PRECTOTCORR).filter(([, v]) => v > -900).map(([k, v]) => ({ date: `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`, rainMm: v, probPct: null, tMaxC: p.T2M_MAX?.[k] ?? null }));
}
