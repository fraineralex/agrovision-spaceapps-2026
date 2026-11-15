/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending. */
import { useMemo } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { scoreDefinitions, type Priority } from "@/lib/data";
import { getFarmerComparison, pillarColor } from "@/lib/farmer-comparison";
import type { ClimateContext } from "@/lib/location-climate";

export function SupervisorRotations({ sanJuan, context, priority }: { sanJuan: boolean; context: ClimateContext | null; priority: Priority }) {
  const ordered = useMemo(() => getFarmerComparison(sanJuan, context, priority), [sanJuan, context, priority]);
  return <>
    <p>Secuencias ilustrativas con riego neto modelado (NASA POWER + FAO-56) para el Valle de San Juan; en otras provincias, indicador genérico. Iconos: agua, clima, plagas, mercado.</p>
    <div className="scenario-grid">{ordered.map(s => <article key={s.id} className="card scenario-card" data-scenario={s.id}>
      <h3>{s.label}</h3>
      <div className="farmer-pillars" aria-label="Agua y suelo, clima, plagas y mercado">{scoreDefinitions.map(p => {
        const score=s.scores[p.id];
        const label=score===null?"Sin datos suficientes":score>=3.34?"Favorable":score>=1.67?"Revisar":"Menos favorable";
        return <span key={p.id} className={`farmer-pillar ${pillarColor(score)}`} role="img" aria-label={`${p.label}: ${label}`} title={`${p.label}: ${label}`}><FarmIcon name={p.id} size={28}/></span>;
      })}</div>
      {s.pestPrecautions.length > 0 && <div><strong>Precauciones de plagas</strong><ul>{s.pestPrecautions.map(note => <li key={note}>{note}</li>)}</ul></div>}
      <details className="evidence-details"><summary>Ver detalles</summary>
        <p>Fechas ilustrativas: {s.dates}.</p>
        {scoreDefinitions.map(p=><p key={p.id}><strong>{p.label}</strong>: {s.details[p.id]} <a href={s.sourceUrls[p.id]}>Fuente</a></p>)}
      </details>
    </article>)}</div>
  </>;
}
