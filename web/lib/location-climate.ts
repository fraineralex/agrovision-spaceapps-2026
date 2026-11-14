/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import "server-only";
import { climate } from "@/lib/data";
import type { Location } from "@/lib/geography";
import { readFile } from "node:fs/promises";
import path from "node:path";
export type ClimateContext = { monthly: { month: number; temperatureC: number | null; precipitationMmDay: number | null; relativeHumidityPct: number | null }[]; source: { name: string; url: string; period: string; scale: string; quality: string; method: string }; location: Location };
const cache = new Map<string, Promise<ClimateContext>>();
export async function loadClimate(location: Location): Promise<ClimateContext> {
  const key = `${location.longitude.toFixed(3)},${location.latitude.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key)!;
  const task = (async () => {
    const cachedFile = path.join(process.cwd(), "public/data/power", `${key}.json`);
    try { return JSON.parse(await readFile(cachedFile, "utf8")) as ClimateContext; } catch { /* Explicit absence; no substitution from another region. */ }
    const url = new URL("https://power.larc.nasa.gov/api/temporal/climatology/point");
    url.search = new URLSearchParams({ parameters:"T2M,PRECTOTCORR,RH2M", community:"AG", longitude:location.longitude.toFixed(3), latitude:location.latitude.toFixed(3), start:"2016", end:"2025", format:"JSON" }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000), next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("NASA POWER no disponible");
    const data = await response.json();
    const parameters = data.properties?.parameter;
    if (!parameters) throw new Error("Respuesta POWER inválida");
    const names = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const value = (parameter: string, name: string) => { const n = parameters[parameter]?.[name]; return typeof n === "number" && Number.isFinite(n) && n !== -999 ? n : null; };
    const monthly = names.map((name,index) => ({ month:index+1, temperatureC:value("T2M",name), precipitationMmDay:value("PRECTOTCORR",name), relativeHumidityPct:value("RH2M",name) }));
    if (monthly.every(m => m.temperatureC === null)) throw new Error("Sin observaciones POWER");
    return { monthly, location, source: { name:"NASA POWER / MERRA-2", url:url.href, period:"2016–2025", scale:"Regional · grilla aproximada de 0.5° × 0.625°", quality:"Sin validación local; lluvia tropical limitada y excluida del score", method:"Reanálisis · media mensual histórica, no pronóstico" } };
  })();
  cache.set(key,task); if (cache.size > 128) cache.delete(cache.keys().next().value!);
  try { return await task; } catch (error) { cache.delete(key); throw error; }
}
export function demoClimate(): ClimateContext {
  return { monthly:climate.monthlyClimatology, location:{longitude:-71.23,latitude:18.8}, source:{ name:climate.source.name,url:climate.source.url,period:"2016–2025",scale:"Regional · ~50 km · San Juan",quality:"Sin validación local; lluvia excluida del score",method:"Reanálisis histórico" } };
}
