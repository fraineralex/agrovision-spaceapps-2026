/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import { rainAlert, type RainForecast } from "@/lib/rain";
import type { Locale } from "./messages";
import { localeTag } from "./locale";

/** Render the existing forecast thresholds in the selected language. */
export function localizedRainAlert(forecast: RainForecast, locale: Locale) {
  if (locale === "es") return rainAlert(forecast);
  const alert = rainAlert(forecast);
  const total = Math.round(forecast.days.reduce((sum, day) => sum + day.rainMm, 0));
  const date = (value: string, weekday = false) => new Intl.DateTimeFormat(localeTag(locale), { timeZone: "UTC", ...(weekday ? { weekday: "long" as const } : {}), month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00Z`));
  if (forecast.kind === "recent") {
    const end = forecast.days.at(-1)?.date;
    return { ...alert, sentence: `No forecast right now. NASA POWER estimates ${total} mm over ${forecast.days.length} days${end ? ` through ${date(end)}` : ""}.` };
  }
  const first = forecast.days.find(day => day.rainMm >= 5 && (day.probPct ?? 0) >= 50);
  if (first) return { ...alert, sentence: `Possible rain on ${date(first.date, true)}: about ${Math.round(first.rainMm)} mm, with a ${first.probPct}% chance.` };
  if (alert.level === "dry") return { ...alert, sentence: `Little rain is forecast${forecast.days.some(day => (day.tMaxC ?? 0) >= 33) ? " with hot days" : ""}: about ${total} mm over ${forecast.days.length} days.` };
  return { ...alert, sentence: `The forecast totals about ${total} mm over ${forecast.days.length} days.` };
}
