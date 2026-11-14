/* AI: Claude (Anthropic), 2026-11-14 — "¿Cuánto me deja?" calculator. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useState } from "react";
import { cropEmoji, cropNames, marketSources, type CropId } from "@/lib/advisor";
import { CPI, profitFor, rd } from "@/lib/profit";

export function ProfitCard({ crops, initialCrop, tareas: farmTareas }: { crops: CropId[]; initialCrop: CropId; tareas: number | null }) {
  const [crop, setCrop] = useState<CropId>(initialCrop);
  const [tareas, setTareas] = useState(String(farmTareas ? Math.max(1, Math.round(farmTareas)) : 10));
  const t = Math.max(0, Math.min(100000, Number(tareas.replace(",", ".")) || 0));
  const p = profitFor(crop, t);
  return <div className="profit">
    <div className="profit-inputs">
      <label>Cultivo<select value={crop} onChange={e => setCrop(e.target.value as CropId)}>{crops.map(c => <option key={c} value={c}>{cropEmoji[c]} {cropNames[c]}</option>)}</select></label>
      <label>Tareas<input inputMode="decimal" value={tareas} onChange={e => setTareas(e.target.value)} aria-label="Tareas" /></label>
    </div>
    {!farmTareas && <p className="note">No marcaste tu finca en el mapa: usamos {tareas} tareas. Cámbialo arriba.</p>}
    {"unavailable" in p ? <p className="warning">No podemos calcularlo para {cropNames[crop].toLowerCase()}: {p.unavailable}</p> : <>
      <div className="profit-range" role="group" aria-label="Lo que te podría quedar">
        {(["low", "mid", "high"] as const).map(k => <div key={k} className={`profit-col ${p.profit[k] < 0 ? "loss" : "gain"}`}>
          <small>{k === "low" ? "Si el precio baja" : k === "mid" ? "Con el precio de hoy" : "Si el precio sube"}</small>
          <strong>{rd(p.profit[k])}</strong>
          <span>{p.profit[k] < 0 ? "pérdida" : "te queda"}</span>
        </div>)}
      </div>
      <ul className="profit-lines">
        <li>Gastarías unos <strong>{rd(p.costRD)}</strong> en {t} tareas.</li>
        <li>Cosecha esperada: unas <strong>{Math.round(p.yieldLb).toLocaleString("es-DO")} libras</strong>.</li>
        <li>Venta al por mayor: entre <strong>{rd(p.income.low)}</strong> y <strong>{rd(p.income.high)}</strong>.</li>
      </ul>
      <p className="note">Dato aproximado. {p.notes.join(" ")}</p>
      <details className="evidence-details"><summary>¿De dónde salen estos números?</summary>
        <p><strong>Costo:</strong> RD${p.costSource.cost2019PerTarea.toLocaleString("es-DO")} por tarea en 2019 ({p.costSource.area}), del <a href={`${p.costSource.url}#page=${p.costSource.page}`}>informe de costos de producción del Ministerio de Agricultura, pág. {p.costSource.page}</a>, multiplicado por {CPI.factor.toFixed(2).replace(".", ",")} por la inflación: <a href={CPI.url}>{CPI.label}</a>.</p>
        <p><strong>Precio:</strong> precio mayorista por libra en los últimos 12 meses del <a href={marketSources.prices}>Ministerio de Agricultura</a>: más bajo RD${p.pricePerLb.low.toFixed(1)}, último RD${p.pricePerLb.mid.toFixed(1)}, más alto RD${p.pricePerLb.high.toFixed(1)}.</p>
        <p><strong>Cuenta:</strong> lo que te queda = libras × precio − costo. No incluye transporte, intermediarios ni pérdidas de cosecha.</p>
      </details>
    </>}
  </div>;
}
