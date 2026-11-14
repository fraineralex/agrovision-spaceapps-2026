/* AI: Claude (Anthropic), 2026-11-14 — 7-day rain and drought alert in plain words. Frainer review pending. See AI_USAGE.md. */
export type RainDay = { date: string; rainMm: number; probPct: number | null; tMaxC: number | null };
export type RainForecast = { source: "open-meteo" | "nasa-power"; kind: "forecast" | "recent"; url: string; fetchedAt: string; days: RainDay[] };
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const santoDomingoDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit" });
export const localDate = (date = new Date()) => santoDomingoDate.format(date);
export const shortDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
export const dayName = (iso: string) => DAYS[new Date(`${iso}T12:00:00`).getDay()];
export const dayIcon = (d: RainDay) => d.rainMm >= 5 && (d.probPct ?? 100) >= 50 ? "🌧️" : d.rainMm >= 1 ? "🌦️" : (d.tMaxC ?? 0) >= 33 ? "🔥" : "☀️";

/** Heuristics for summarizing a model forecast, not thresholds for irrigation. */
export function rainAlert(f: RainForecast): { sentence: string; level: "rain" | "dry" | "normal" } {
  if (f.kind === "recent") {
    const total = f.days.reduce((s, d) => s + d.rainMm, 0);
    const end = f.days.at(-1)?.date;
    return { sentence: `Sin pronóstico ahora. NASA POWER estima ${Math.round(total)} mm en ${f.days.length} días${end ? ` hasta el ${shortDate(end)}` : ""}.`, level: "normal" };
  }
  const first = f.days.find(d => d.rainMm >= 5 && (d.probPct ?? 0) >= 50);
  const total = f.days.reduce((s, d) => s + d.rainMm, 0);
  const hot = f.days.some(d => (d.tMaxC ?? 0) >= 33);
  if (first) {
    return { sentence: `Posible lluvia el ${dayName(first.date)} ${shortDate(first.date)}: unos ${Math.round(first.rainMm)} mm, ${first.probPct}% de probabilidad.`, level: "rain" };
  }
  if (total < 5) return { sentence: `Poca lluvia prevista${hot ? " y días calurosos" : ""}: unos ${Math.round(total)} mm en ${f.days.length} días.`, level: "dry" };
  return { sentence: `El pronóstico suma unos ${Math.round(total)} mm en ${f.days.length} días.`, level: "normal" };
}

export function currentRain(forecast: RainForecast, today = localDate()): RainForecast | null {
  if (forecast.kind === "recent") return forecast;
  const days = forecast.days.filter(day => day.date >= today);
  return days.length ? { ...forecast, days } : null;
}
export function parseOpenMeteo(j: { daily?: { time: string[]; precipitation_sum: (number | null)[]; precipitation_probability_max?: (number | null)[]; temperature_2m_max?: (number | null)[] } }): RainDay[] {
  const d = j.daily; if (!d?.time?.length) return [];
  if (!d.precipitation_sum || d.time.some((_, i) => !Number.isFinite(d.precipitation_sum[i]) || d.precipitation_sum[i]! < 0)) return [];
  return d.time.map((t, i) => ({ date: t, rainMm: d.precipitation_sum[i]!, probPct: d.precipitation_probability_max?.[i] ?? null, tMaxC: d.temperature_2m_max?.[i] ?? null }));
}
export function parsePower(j: { properties?: { parameter?: { PRECTOTCORR?: Record<string, number>; T2M_MAX?: Record<string, number> } } }): RainDay[] {
  const p = j.properties?.parameter; if (!p?.PRECTOTCORR) return [];
  return Object.entries(p.PRECTOTCORR).filter(([, v]) => Number.isFinite(v) && v >= 0).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ date: `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`, rainMm: v, probPct: null, tMaxC: p.T2M_MAX?.[k] ?? null }));
}
