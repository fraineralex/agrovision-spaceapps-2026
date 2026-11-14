/* AI: Claude (Anthropic), 2026-11-14 — 7-day rain card per farm with offline cache. Frainer review pending. See AI_USAGE.md. */
"use client";
import { CloudRain, CloudSun, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { currentRain, dayIcon, dayName, rainAlert, shortDate, type RainForecast } from "@/lib/rain";
import type { Location } from "@/lib/geography";

export function useRain(location: Location | null) {
  const [data, setData] = useState<{ key: string; forecast: RainForecast | null; cached: boolean } | null>(null);
  const [failed, setFailed] = useState("");
  const key = location ? `rain:${location.longitude.toFixed(3)},${location.latitude.toFixed(3)}` : "";
  useEffect(() => {
    if (!location) return;
    const ctrl = new AbortController();
    let saved: RainForecast | null = null;
    try { saved = JSON.parse(localStorage.getItem(key) ?? "null"); } catch { saved = null; }
    const cached = saved?.days?.length ? currentRain(saved) : null;
    const t = setTimeout(() => { if (cached) setData({ key, forecast: cached, cached: true }); }, 0);
    fetch(`/api/rain?longitude=${location.longitude}&latitude=${location.latitude}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((f: RainForecast) => {
        if (ctrl.signal.aborted) return;
        clearTimeout(t);
        setData({ key, forecast: currentRain(f), cached: false });
        setFailed("");
        try { localStorage.setItem(key, JSON.stringify(f)); } catch { /* optional */ }
      })
      .catch(() => { if (!ctrl.signal.aborted && !cached) setFailed(key); });
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [key, location]);
  const forecast = data?.key === key && data.forecast ? currentRain(data.forecast) : null;
  const error = key && (failed === key || (data?.key === key && !forecast)) ? "Pronóstico no disponible. Consulta el boletín oficial." : "";
  const cached = data?.key === key && data.cached;
  return { forecast, cached, error, alert: forecast ? rainAlert(forecast) : null };
}

export function RainCard({ rain }: { rain: ReturnType<typeof useRain> }) {
  const { forecast, cached, error, alert } = rain;
  if (!forecast) return <p role="status">{error || "Buscando el pronóstico…"}</p>;
  return <div className="rain">
    <p className={`rain-sentence ${alert?.level}`}>{alert?.level === "rain" ? <CloudRain aria-hidden="true" /> : alert?.level === "dry" ? <Sun aria-hidden="true" /> : <CloudSun aria-hidden="true" />} {alert?.sentence}</p>
    <ol className="rain-days" aria-label={forecast.kind === "forecast" ? "Próximos 7 días" : "Últimos días"}>
      {forecast.days.map(d => <li key={d.date}>
        <time dateTime={d.date} className="rain-day"><abbr title={dayName(d.date)}>{dayName(d.date).slice(0, 3)}</abbr> {shortDate(d.date)}</time>
        <span className="rain-icon" aria-hidden="true">{dayIcon(d)}</span><span>{Math.round(d.rainMm)} mm</span>
        {d.probPct !== null && <span aria-label={`${d.probPct}% de probabilidad de lluvia`}>{d.probPct}%</span>}
      </li>)}
    </ol>
    <p className="note">{forecast.source === "open-meteo" ? <>Pronóstico regional de <a href="https://open-meteo.com/en/docs">Open-Meteo</a> (resolución según el modelo). Puede variar en tu finca.</> : <>Estimación histórica de <a href="https://power.larc.nasa.gov/">NASA POWER</a> (~50 km).</>} {forecast.fetchedAt && `Consultado el ${shortDate(forecast.fetchedAt)}.`} {cached ? "Copia guardada. Puede estar desactualizada." : ""}</p>
  </div>;
}
