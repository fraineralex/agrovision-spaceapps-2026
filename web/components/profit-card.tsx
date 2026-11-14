/* AI: Claude (Anthropic), 2026-11-14 — "¿Cuánto me deja?" calculator. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useState } from "react";
import { cropEmoji, cropNames, marketSources, type CropId } from "@/lib/advisor";
import { CPI, profitFor, rd } from "@/lib/profit";

export function ProfitCard({ crops, initialCrop, tareas: farmTareas }: { crops: CropId[]; initialCrop: CropId; tareas: number | null }) {
  const [crop, setCrop] = useState<CropId>(initialCrop);
  const [tareas, setTareas] = useState(farmTareas ? String(Number(farmTareas.toFixed(2))) : "");
  const t = Math.max(0, Math.min(100000, Number(tareas.replace(",", ".")) || 0));
  const p = profitFor(crop, t);
  return <div className="profit">
    <div className="profit-inputs">
      <label>Cultivo<select value={crop} onChange={e => setCrop(e.target.value as CropId)}>{crops.map(c => <option key={c} value={c}>{cropEmoji[c]} {cropNames[c]}</option>)}</select></label>
      <label>Tareas<input inputMode="decimal" value={tareas} onChange={e => setTareas(e.target.value)} aria-label="Tareas" /></label>
    </div>
    {t <= 0 ? <p className="note">Escribe cuántas tareas vas a sembrar para ver el ejemplo.</p> : "unavailable" in p ? <p className="warning">No podemos calcularlo para {cropNames[crop].toLowerCase()}: {p.unavailable}</p> : <>
      <div className="profit-range" role="group" aria-label="Lo que te podría quedar">
        {(["low", "mid", "high"] as const).map(k => <div key={k} className={`profit-col ${p.profit[k] < 0 ? "loss" : "gain"}`}>
          <small>{k === "low" ? "Precio histórico bajo" : k === "mid" ? "Último precio publicado" : "Precio histórico alto"}</small>
          <strong>{rd(p.profit[k])}</strong>
          <span>{p.profit[k] < 0 ? "pérdida" : "te queda"}</span>
        </div>)}
      </div>
      <ul className="profit-lines">
        <li>Gastarías unos <strong>{rd(p.costRD)}</strong> en {t} tareas.</li>
        <li>Cantidad del ejemplo con rendimientos de 2019: <strong>{Math.round(p.yieldLb).toLocaleString("es-DO")} libras</strong>.</li>
        <li>Venta al por mayor: entre <strong>{rd(p.income.low)}</strong> y <strong>{rd(p.income.high)}</strong>.</li>
      </ul>
      <p className="note">Dato aproximado. {p.notes.join(" ")}</p>
      <div className="sources-box"><h3>¿De dónde salen estos números?</h3>
        <p><strong>Costo:</strong> RD${p.costSource.cost2019PerTarea.toLocaleString("es-DO")} por tarea en 2019 ({p.costSource.area}), del <a href={`${p.costSource.url}#page=${p.costSource.page}`}>informe de costos de producción del Ministerio de Agricultura, pág. {p.costSource.page}</a>, actualizado por la inflación con el <a href={CPI.url}>índice de precios del Banco Central</a>.</p>
        <p><strong>Precio:</strong> precio mayorista por libra en los últimos 12 meses del <a href={marketSources.prices}>Ministerio de Agricultura</a>: más bajo RD${p.pricePerLb.low.toFixed(1)}, último RD${p.pricePerLb.mid.toFixed(1)}, más alto RD${p.pricePerLb.high.toFixed(1)}.</p>
      </div>
    </>}
  </div>;
}
