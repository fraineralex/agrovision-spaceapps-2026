/* AI: Claude (Anthropic), 2026-11-14 — 7-day rain card per farm with offline cache; animated SVG bar chart & weather icons by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { CloudRain, CloudSun, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { dayName, rainAlert, type RainForecast } from "@/lib/rain";
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

function WeatherGlyph({ rainMm }: { rainMm: number }) {
  if (rainMm >= 8) return <CloudRain size={18} className="w-glyph rain" aria-hidden="true" />;
  if (rainMm >= 2) return <CloudSun size={18} className="w-glyph mix" aria-hidden="true" />;
  return <Sun size={18} className="w-glyph sun" aria-hidden="true" />;
}

export function RainCard({ rain }: { rain: ReturnType<typeof useRain> }) {
  const { forecast, cached, error, alert } = rain;
  if (!forecast) return <p role="status">{error || "Buscando el pronóstico…"}</p>;
  const days = forecast.days;
  const maxRain = Math.max(15, ...days.map(d => d.rainMm));
  const thresholdY = 76 - (10 / maxRain) * 62;
  return <div className="rain">
    <p className={`rain-sentence ${alert?.level}`}>{alert?.level === "rain" ? <CloudRain aria-hidden="true" /> : alert?.level === "dry" ? <Sun aria-hidden="true" /> : <CloudSun aria-hidden="true" />} {alert?.sentence}</p>
    <div className="rain-chart-wrap">
      <svg className="rain-chart" viewBox={`0 0 ${Math.max(1, days.length) * 42} 86`} role="img" aria-label={`Gráfica de lluvia diaria (${Math.round(days.reduce((a, b) => a + b.rainMm, 0))} mm en total)`}>
        <line x1="0" y1={thresholdY} x2={days.length * 42} y2={thresholdY} stroke="#1d5f9e" strokeOpacity="0.32" strokeDasharray="3 3" />
        {days.map((d, i) => {
          const barH = Math.max(4, Math.round((d.rainMm / maxRain) * 62));
          const x = i * 42 + 9;
          const y = 76 - barH;
          const rainy = d.rainMm >= 8;
          return (
            <g key={d.date}>
              <rect
                className={`rain-bar ${rainy ? "heavy" : d.rainMm > 0 ? "light" : "dry"}`}
                x={x}
                y={y}
                width="24"
                height={barH}
                rx="6"
                style={{ animationDelay: `${i * 55}ms` }}
              />
              <text x={x + 12} y={Math.max(11, y - 4)} textAnchor="middle" className="rain-bar-val">
                {Math.round(d.rainMm)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
    <ol className="rain-days" aria-label={forecast.kind === "forecast" ? "Próximos 7 días" : "Últimos días"}>
      {days.map(d => <li key={d.date}><span className="rain-day">{dayName(d.date).slice(0, 3)}</span><span className="rain-icon"><WeatherGlyph rainMm={d.rainMm} /></span><span>{Math.round(d.rainMm)} mm</span></li>)}
    </ol>
    <details className="sources-fold">
      <summary>Fuente ({forecast.source === "open-meteo" ? "Open-Meteo · 7 días" : "NASA POWER · días recientes"})</summary>
      <p className="note">Dato aproximado para el centro de tu finca. {forecast.source === "open-meteo" ? <>Pronóstico de <a href={forecast.url}>Open-Meteo</a> (modelos meteorológicos, ~10–25 km).</> : <>Lluvia de los últimos días de <a href={forecast.url}>NASA POWER</a> (~50 km); no hay pronóstico ahora.</>} {cached ? "Guardado: puede no estar al día." : ""}</p>
    </details>
  </div>;
}
