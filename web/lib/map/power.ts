/* AI: Grok (xAI), 2026-11-14; Frainer review pending. */
import climate from "@/public/data/climate-series.json";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;
const VALLEY = { lat: 18.8, lon: -71.23 };
const cache = new Map<string, PowerReading>();

export type PowerReading = {
  temperatureC: number;
  precipitationMmDay: number;
  relativeHumidityPct: number;
  label: string;
  detail: string;
};

type Climatology = Record<(typeof MONTHS)[number] | "ANN", number>;

export async function loadPowerReading(lat: number, lon: number, month: number, signal: AbortSignal): Promise<PowerReading> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)},${month}`;
  const saved = cache.get(key);
  if (saved) return saved;
  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR,RH2M&community=AG&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&format=JSON`;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(String(response.status));
    const body = await response.json() as { properties?: { parameter?: { T2M?: Climatology; PRECTOTCORR?: Climatology; RH2M?: Climatology } }; header?: { range?: string } };
    const parameter = body.properties?.parameter;
    const slot = MONTHS[month - 1] ?? "ANN";
    const temperature = parameter?.T2M?.[slot];
    const rain = parameter?.PRECTOTCORR?.[slot];
    const humidity = parameter?.RH2M?.[slot];
    if (temperature == null || temperature <= -999 || rain == null || humidity == null) throw new Error("empty");
    const reading: PowerReading = {
      temperatureC: temperature,
      precipitationMmDay: rain,
      relativeHumidityPct: humidity,
      label: "NASA POWER",
      detail: `${body.header?.range ?? "Climatología POWER"} · celda ~50 km · no es medición de finca`,
    };
    cache.set(key, reading);
    return reading;
  } catch (error) {
    if (signal.aborted) throw error;
    return valleyCache(lat, lon, month);
  }
}

function valleyCache(lat: number, lon: number, month: number): PowerReading {
  const near = Math.abs(lat - VALLEY.lat) <= 0.25 && Math.abs(lon - VALLEY.lon) <= 0.25;
  const row = climate.monthlyClimatology.find((item) => item.month === month);
  if (!near || !row) throw new Error("POWER no disponible para este punto");
  return {
    temperatureC: row.temperatureC,
    precipitationMmDay: row.precipitationMmDay,
    relativeHumidityPct: row.relativeHumidityPct,
    label: "Caché POWER",
    detail: `${climate.source.periodStart}–${climate.source.periodEnd} · ${climate.source.scale}`,
  };
}
