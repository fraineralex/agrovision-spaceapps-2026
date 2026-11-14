/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending; see AI_USAGE.md. */
import { z } from "zod";
import type { RainForecast } from "./rain";

export const weatherSignalSchema = z.object({
  dry: z.boolean(), severe: z.boolean(), cyclone: z.boolean().nullable(),
  dustPeak: z.number().nonnegative().nullable(),
  through: z.iso.date(),
});
export type WeatherSignal = z.infer<typeof weatherSignalSchema>;

export function weatherForSowing(forecast: RainForecast | null, month: number, now = new Date()): WeatherSignal | undefined {
  if (forecast?.kind !== "forecast" || !forecast.fetchedAt) return;
  const age = now.getTime() - Date.parse(forecast.fetchedAt);
  if (!Number.isFinite(age) || age < 0 || age > 24 * 3600_000) return;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  if (month !== Number(today.slice(5, 7))) return;
  const days = forecast.days.filter(day => day.date >= today);
  if (!days.length) return;
  return {
    dry: days.length >= 5 && days.reduce((sum, day) => sum + day.rainMm, 0) < 5,
    severe: days.some(day => day.rainMm >= 40 || (day.gustKmh ?? 0) >= 60 || (day.weatherCode ?? 0) >= 95),
    cyclone: forecast.cyclone ?? null,
    dustPeak: forecast.dustPeak ?? null,
    through: days.at(-1)!.date,
  };
}

export const climateSources = [
  ["Pronóstico meteorológico · Open-Meteo", "https://open-meteo.com/en/docs"],
  ["Ciclones · NOAA/NHC", "https://www.nhc.noaa.gov/cyclones/"],
  ["Polvo de Sahara · CAMS ENSEMBLE / Open-Meteo", "https://open-meteo.com/en/docs/air-quality-api"],
  ["Avisos oficiales · INDOMET", "https://indomet.gob.do/pronostico/"],
] as const;

export function weatherPrecautions(weather?: WeatherSignal) {
  if (!weather) return [];
  const notes: string[] = [];
  if (weather.severe) notes.push("Posible tormenta, lluvia intensa o ráfagas fuertes. Pospón la siembra hasta revisar el pronóstico y los avisos de INDOMET; comprueba el drenaje cuando sea seguro.");
  if (weather.cyclone) notes.push("El NHC registra un ciclón en la región. Consulta los avisos de INDOMET antes de fijar la fecha de siembra.");
  if (weather.dry) notes.push("Se prevén menos de 5 mm de lluvia en el período. Confirma la humedad del suelo y el agua disponible para establecer el cultivo.");
  if (weather.dustPeak !== null) notes.push(`Polvo de Sahara modelado por CAMS: máximo de ${Math.round(weather.dustPeak)} µg/m³ en la ventana consultada de hasta tres días. Si INDOMET emite avisos por polvo, ajusta las labores al aire libre.`);
  return notes;
}
