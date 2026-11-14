/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { CloudRain, CloudSun, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { currentRain, dayName, rainAlert, shortDate, type RainForecast } from "@/lib/rain";
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
  const maxRain = Math.max(1, ...forecast.days.map(day => day.rainMm));
  return <div className="rain">
    <div className="rain-legend">
      <span>{forecast.kind === "forecast" ? "Pronóstico regional" : "Estimación de días pasados"}</span>
      {cached && <span className="rain-cached">Copia guardada</span>}
      {forecast.days.some(day => day.probPct !== null) && <span className="rain-legend-prob">% de lluvia</span>}
    </div>
    <p className="sr-only">{alert?.sentence}</p>
    <ol className="rain-days" aria-label={forecast.kind === "forecast" ? "Próximos 7 días" : "Últimos días"}>
      {forecast.days.map(day => {
        const Icon = day.rainMm >= 5 ? CloudRain : day.rainMm > 0 || (day.probPct ?? 0) >= 50 ? CloudSun : Sun;
        return <li key={day.date} className={day.rainMm >= 5 ? "rain-wet" : undefined}>
          <time dateTime={day.date} className="rain-day"><abbr title={dayName(day.date)}>{dayName(day.date).slice(0, 3)}</abbr><small>{shortDate(day.date)}</small></time>
          <Icon className="rain-symbol" aria-hidden="true"/>
          <span className="rain-bar-track" aria-hidden="true"><span style={{ height: `${day.rainMm / maxRain * 100}%` }}/></span>
          <strong className="rain-amount">{day.rainMm > 0 && day.rainMm < 1 ? "<1" : Math.round(day.rainMm)} <small>mm</small></strong>
          {day.probPct !== null && <span aria-label={`${day.probPct}% de probabilidad de lluvia`}>{day.probPct}%</span>}
        </li>;
      })}
    </ol>
    <details className="visual-details"><summary>Fuente y fecha</summary>
      <p className="note">{forecast.source === "open-meteo" ? <>Pronóstico regional de <a href="https://open-meteo.com/en/docs">Open-Meteo</a> (resolución según el modelo). Puede variar en tu finca.</> : <>Estimación histórica de <a href="https://power.larc.nasa.gov/">NASA POWER</a> (~50 km).</>} {forecast.fetchedAt && `Consultado el ${shortDate(forecast.fetchedAt)}.`} {cached ? "La copia puede estar desactualizada." : ""}</p>
    </details>
  </div>;
}
