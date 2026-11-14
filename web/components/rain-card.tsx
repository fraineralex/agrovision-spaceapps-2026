/* AI: Claude (Anthropic), 2026-11-14 — 7-day rain card per farm with offline cache. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useEffect, useState } from "react";
import { dayIcon, dayName, rainAlert, type RainForecast } from "@/lib/rain";
import type { Location } from "@/lib/geography";

export function useRain(location: Location | null) {
  const [data, setData] = useState<{ f: RainForecast; cached: boolean } | null>(null);
  const [error, setError] = useState("");
  const key = location ? `rain:${location.longitude.toFixed(3)},${location.latitude.toFixed(3)}` : "";
  useEffect(() => {
    if (!location) return;
    const ctrl = new AbortController();
    let saved: RainForecast | null = null;
    try { saved = JSON.parse(localStorage.getItem(key) ?? "null"); } catch { saved = null; }
    const t = setTimeout(() => { if (saved) setData({ f: saved, cached: true }); }, 0);
    fetch(`/api/rain?longitude=${location.longitude}&latitude=${location.latitude}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((f: RainForecast) => { setData({ f, cached: false }); setError(""); try { localStorage.setItem(key, JSON.stringify(f)); } catch { /* optional */ } })
      .catch(() => { if (!ctrl.signal.aborted) setError(saved ? "" : "Pronóstico no disponible ahora. Vuelve a intentar con internet."); });
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [key, location]);
  return { forecast: data?.f ?? null, cached: data?.cached ?? false, error, alert: data ? rainAlert(data.f) : null };
}

export function RainCard({ rain }: { rain: ReturnType<typeof useRain> }) {
  const { forecast, cached, error, alert } = rain;
  if (!forecast) return <p role="status">{error || "Buscando el pronóstico…"}</p>;
  return <div className="rain">
    <p className={`rain-sentence ${alert?.level}`}>{alert?.level === "rain" ? "🌧️" : alert?.level === "dry" ? "☀️" : "🌦️"} {alert?.sentence}</p>
    <ol className="rain-days" aria-label={forecast.kind === "forecast" ? "Próximos 7 días" : "Últimos días"}>
      {forecast.days.map(d => <li key={d.date}><span className="rain-day">{dayName(d.date).slice(0, 3)}</span><span className="rain-icon" aria-hidden="true">{dayIcon(d)}</span><span>{Math.round(d.rainMm)} mm</span></li>)}
    </ol>
    <p className="note">Dato aproximado para el centro de tu finca. {forecast.source === "open-meteo" ? <>Pronóstico de <a href={forecast.url}>Open-Meteo</a> (modelos meteorológicos, ~10–25 km).</> : <>Lluvia de los últimos días de <a href={forecast.url}>NASA POWER</a> (~50 km); no hay pronóstico ahora.</>} {cached ? "Guardado: puede no estar al día." : ""} Regla de AgroVision: 5 mm o más con 50% de probabilidad cuenta como lluvia útil.</p>
  </div>;
}
