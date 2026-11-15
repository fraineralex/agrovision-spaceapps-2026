/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — "¿Cuánto me deja?" calculator; visual cost-vs-revenue bars & unified SVG icon by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import type { Irrigation } from "@/lib/data";
import { useState } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { CustomSelect } from "@/components/custom-select";
import { cropNames, marketSources, type CropId } from "@/lib/advisor";
import { CPI, profitFor, rd } from "@/lib/profit";

export function ProfitCard({ crops, initialCrop, tareas: farmTareas, irrigation }: { crops: CropId[]; initialCrop: CropId; tareas: number | null; irrigation: Irrigation }) {
  const [crop, setCrop] = useState<CropId>(initialCrop);
  const [tareas, setTareas] = useState(farmTareas ? String(Number(farmTareas.toFixed(2))) : "");
  const t = Math.max(0, Math.min(100000, Number(tareas.replace(",", ".")) || 0));
  const p = profitFor(crop, t, irrigation);
  const maxMoney = "unavailable" in p ? 1 : Math.max(1, p.costRD, p.income.high);
  return <div className="profit">
    <div className="profit-inputs">
      <div className="ag-select-field"><span className="ag-select-label">Cultivo</span><div className="select-with-icon"><FarmIcon name={crop} size={20} /><CustomSelect ariaLabel="Cultivo" value={crop} options={crops.map(c => ({ value: c, label: cropNames[c] }))} onChange={val => setCrop(val as CropId)} /></div></div>
      <label>Tareas<input inputMode="decimal" value={tareas} onChange={e => setTareas(e.target.value)} aria-label="Tareas" /></label>
    </div>
    {t <= 0 ? <p className="note">Escribe cuántas tareas vas a sembrar para ver el ejemplo.</p> : "unavailable" in p ? <p className="warning">No podemos calcularlo para {cropNames[crop].toLowerCase()}: {p.unavailable}</p> : <>
      <h3>Escenario histórico (precio mayorista)</h3>
      <p className="note">{p.costSource.area} · Costos y rendimiento de 2019 · RD$ por {t} tareas</p>
      <div className="profit-range" role="group" aria-label="Lo que te podría quedar">
        {(["low", "mid", "high"] as const).map(k => <div key={k} className={`profit-col ${p.profit[k] < 0 ? "loss" : "gain"}`}>
          <small>{k === "low" ? "Precio histórico bajo" : k === "mid" ? "Último precio publicado" : "Precio histórico alto"}</small>
          <strong>{rd(Math.round(p.profit[k] / 100) * 100)}</strong>
          <span>{p.profit[k] < 0 ? "pérdida" : "saldo estimado"}</span>
        </div>)}
      </div>
      <div className="profit-chart" aria-label="Comparación visual entre costo y venta esperada">
        <div className="pchart-row">
          <div className="pchart-head"><span>Costo estimado</span><strong>{rd(p.costRD)}</strong></div>
          <div className="pchart-track"><span className="pchart-bar cost" style={{ width: `${Math.round((p.costRD / maxMoney) * 100)}%` }} /></div>
        </div>
        <div className="pchart-row">
          <div className="pchart-head"><span>Venta al último precio publicado</span><strong>{rd(p.income.mid)}</strong></div>
          <div className="pchart-track">
            <span
              className={`pchart-bar ${p.income.mid >= p.costRD ? "rev-good" : "rev-low"}`}
              style={{ width: `${Math.round((p.income.mid / maxMoney) * 100)}%` }}
            />
            <span className="pchart-marker" style={{ left: `${Math.round((p.costRD / maxMoney) * 100)}%` }} title="Punto de equilibrio" aria-hidden="true" />
          </div>
        </div>
      </div>
      <ul className="profit-lines">
        <li>Gastarías unos <strong>{rd(p.costRD)}</strong> en {t} tareas.</li>
        <li>Cantidad del ejemplo con rendimientos de 2019: <strong>{Math.round(p.yieldLb).toLocaleString("es-DO")} libras</strong>.</li>
        <li>Venta al por mayor: entre <strong>{rd(p.income.low)}</strong> y <strong>{rd(p.income.high)}</strong>.</li>
      </ul>
      <details className="sources-fold">
        <summary>¿De dónde salen estos números? (MA 2019 + BCRD)</summary>
        <p className="note">Dato aproximado. {p.notes.join(" ")}</p>
        <div className="sources-box">
          <p><strong>Costo:</strong> RD${p.costSource.cost2019PerTarea.toLocaleString("es-DO")} por tarea en 2019 ({p.costSource.area}), del <a href={`${p.costSource.url}#page=${p.costSource.page}`}>informe de costos de producción del Ministerio de Agricultura, pág. {p.costSource.page}</a>, actualizado por la inflación con el <a href={CPI.url}>índice de precios del Banco Central</a>.</p>
          <p><strong>Precio:</strong> precio mayorista por libra en los últimos 12 meses del <a href={marketSources.prices}>Ministerio de Agricultura</a>: más bajo RD${p.pricePerLb.low.toFixed(1)}, último RD${p.pricePerLb.mid.toFixed(1)}, más alto RD${p.pricePerLb.high.toFixed(1)}.</p>
        </div>
      </details>
    </>}
  </div>;
}
