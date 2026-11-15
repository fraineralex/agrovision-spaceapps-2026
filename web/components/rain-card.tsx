/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14; interactive day inspector & weather animations by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { CloudRain, CloudSun, Droplets, Sun, ThermometerSun } from "lucide-react";
import { useState, useEffect } from "react";
import { currentRain, isFreshForecast, dayName, rainAlert, shortDate, type RainForecast } from "@/lib/rain";
import type { Location } from "@/lib/geography";

export function useRain(location: Location | null) {
  const [data, setData] = useState<{ key: string; forecast: RainForecast | null; cached: boolean; loadedAt: number } | null>(null);
  const [clock, setClock] = useState(0);
  const [failed, setFailed] = useState("");
  const key = location ? `rain:${location.longitude.toFixed(3)},${location.latitude.toFixed(3)}` : "";
  useEffect(() => {
    if (!location) return;
    const ctrl = new AbortController();
    let saved: RainForecast | null = null;
    try { saved = JSON.parse(localStorage.getItem(key) ?? "null"); } catch { saved = null; }
    const cached = saved?.days?.length ? currentRain(saved) : null;
    const t = setTimeout(() => { if (cached) setData({ key, forecast: cached, cached: true, loadedAt: Date.now() }); }, 0);
    fetch(`/api/rain?longitude=${location.longitude}&latitude=${location.latitude}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((f: RainForecast) => {
        if (ctrl.signal.aborted) return;
        clearTimeout(t);
        setData({ key, forecast: currentRain(f), cached: false, loadedAt: Date.now() });
        setFailed("");
        try { localStorage.setItem(key, JSON.stringify(f)); } catch { /* optional */ }
      })
      .catch(() => { if (!ctrl.signal.aborted && !cached) setFailed(key); });
    const tick = setInterval(() => setClock(Date.now()), 60_000);
    return () => { clearTimeout(t); clearInterval(tick); ctrl.abort(); };
  }, [key, location]);
  const forecast = data?.key === key && data.forecast ? currentRain(data.forecast) : null;
  const error = key && (failed === key || (data?.key === key && !forecast)) ? "Pronóstico no disponible. Consulta el boletín oficial." : "";
  const cached = data?.key === key && data.cached;
  return { forecast, cached, error, fresh: Boolean(forecast && data && isFreshForecast(forecast, Math.max(data.loadedAt, clock))), loadedAt: data ? Math.max(data.loadedAt, clock) : undefined, alert: forecast ? rainAlert(forecast) : null };
}

export function RainCard({ rain }: { rain: ReturnType<typeof useRain> }) {
  const { forecast, cached, error, alert } = rain;
  const fetched = forecast?.fetchedAt ? new Date(forecast.fetchedAt) : null;
  const ageHours = fetched ? Math.max(0, Math.floor(((rain.loadedAt ?? fetched.getTime()) - fetched.getTime()) / 3600000)) : null;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  if (!forecast) return <p role="status">{error || "Buscando el pronóstico…"}</p>;
  const days = forecast.days;
  const maxRain = Math.max(10, ...days.map(day => day.rainMm));
  const defaultIdx = Math.max(0, days.findIndex(d => d.rainMm >= 5));
  const activeIdx = selectedIdx !== null && selectedIdx < days.length ? selectedIdx : defaultIdx;
  const activeDay = days[activeIdx];

  return <div className="rain">
    <div className="rain-legend">
      <span className={`rain-badge-kind ${alert?.level ?? "normal"}`}>
        {forecast.kind === "forecast" ? "Pronóstico regional · 7 días" : "Estimación de días pasados"}
      </span>
      {cached && <span className="rain-cached">Copia guardada{ageHours === null ? "" : ageHours < 1 ? " · hace menos de 1 h" : " · hace " + ageHours + " h"}</span>}
      {alert?.sentence && <span className="rain-summary-pill">{alert.sentence}</span>}
    </div>
    <ol className="rain-days" aria-label={forecast.kind === "forecast" ? "Próximos 7 días" : "Últimos días"}>
      {days.map((day, idx) => {
        const wet = day.rainMm >= 5;
        const mix = !wet && (day.rainMm > 0 || (day.probPct ?? 0) >= 50);
        const Icon = wet ? CloudRain : mix ? CloudSun : Sun;
        const barPct = day.rainMm > 0 ? Math.max(10, Math.round((day.rainMm / maxRain) * 100)) : 4;
        const isSelected = idx === activeIdx;
        return <li key={day.date} className={`${wet ? "rain-wet" : mix ? "rain-mix" : "rain-dry"}${isSelected ? " is-selected" : ""}`}>
          <button type="button" className="rain-day-btn" aria-pressed={isSelected} onClick={() => setSelectedIdx(idx)}>
            <time dateTime={day.date} className="rain-day"><abbr title={dayName(day.date)}>{dayName(day.date).slice(0, 3)}</abbr><small>{shortDate(day.date)}</small></time>
            <span className="rain-glyph-wrap" aria-hidden="true">
              <Icon className="rain-symbol" />
              {wet && <span className="rain-drops"><i /><i /><i /></span>}
            </span>
            <span className="rain-bar-track" aria-hidden="true"><span style={{ height: `${barPct}%`, animationDelay: `${idx * 45}ms` }}/></span>
            <strong className="rain-amount">{day.rainMm > 0 && day.rainMm < 1 ? "<1" : Math.round(day.rainMm)} <small>mm</small></strong>
            {day.probPct !== null && <span className="rain-prob" aria-label={`${day.probPct}% de probabilidad de lluvia`}>{day.probPct}%</span>}
          </button>
        </li>;
      })}
    </ol>
    {activeDay && (
      <div className="rain-day-inspector" aria-live="polite">
        <span className="rdi-date"><strong style={{ textTransform: "capitalize" }}>{dayName(activeDay.date)}</strong> {shortDate(activeDay.date)}</span>
        <span className="rdi-metrics">
          <span><Droplets size={15} aria-hidden="true" /> {activeDay.rainMm > 0 && activeDay.rainMm < 1 ? "<1" : Math.round(activeDay.rainMm)} mm</span>
          {activeDay.probPct !== null && <span>· {activeDay.probPct}% prob. lluvia</span>}
          {activeDay.tMaxC !== null && <span><ThermometerSun size={15} aria-hidden="true" /> Máx {Math.round(activeDay.tMaxC)} °C</span>}
        </span>
      </div>
    )}
    <details className="visual-details"><summary>Fuente y fecha</summary>
      <p className="note">{forecast.source === "open-meteo" ? <>Pronóstico regional de <a href="https://open-meteo.com/en/docs/gfs-api">Open-Meteo</a>{forecast.model === "gfs_global" ? " · NOAA GFS (~13 km), probabilidad del conjunto GEFS (~25 km)." : " · modelo y resolución sin confirmar para esta copia."} Puede variar en tu finca.</> : <>Estimación histórica de <a href="https://power.larc.nasa.gov/">NASA POWER</a> (~50 km).</>} {fetched && Number.isFinite(fetched.getTime()) && <>Consultado el <time dateTime={forecast.fetchedAt}>{fetched.toLocaleString("es-DO", { timeZone: "America/Santo_Domingo", dateStyle: "short", timeStyle: "short" })}</time> AST{cached && ageHours !== null ? ` · hace ${ageHours < 1 ? "menos de una hora" : `${ageHours} h`}` : ""}.</>} {cached ? "La copia puede estar desactualizada." : ""}</p>
    </details>
  </div>;
}
