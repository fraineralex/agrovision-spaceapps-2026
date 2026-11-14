/* AI: Claude (Anthropic), 2026-11-14 — farmer market card. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useState } from "react";
import { cropEmoji, cropNames, marketFor, marketLimits, marketSources, monthNames, unitWord, type CropId } from "@/lib/advisor";

const money = (n: number) => `RD$${n.toLocaleString("es-DO", { maximumFractionDigits: n < 100 ? 0 : 0 })}`;
const periodWord = (p: string) => `${monthNames[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), w = 260, h = 56;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 4 - ((v - min) / (max - min || 1)) * (h - 8)}`).join(" ");
  return <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Precio de los últimos 24 meses">
    <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
  </svg>;
}

export function MarketCard({ initialCrop }: { initialCrop: CropId }) {
  const [chosen, setChosen] = useState<CropId | null>(null);
  const crop = chosen ?? initialCrop;
  const m = marketFor(crop);
  const latest = m?.latest;
  const change = latest && m?.yearAgo ? Math.round((latest.price / m.yearAgo.price - 1) * 100) : null;
  const outlook = m?.outlook?.find(o => o.horizonMonths === 3);
  const cost = m?.cost2019;
  return <section className="card market" aria-label="Precio y mercado">
    <div className="section-row"><h3>Precio del cultivo</h3>
      <select aria-label="Cultivo" value={crop} onChange={e => setChosen(e.target.value as CropId)}>{(Object.keys(cropNames) as CropId[]).map(c => <option key={c} value={c}>{cropEmoji[c]} {cropNames[c]}</option>)}</select></div>
    {latest ? <>
      <div className="price-now"><span className="price-big">{money(latest.price)}</span><span>{unitWord(m.unit)} · {periodWord(latest.period)}</span></div>
      {change !== null && <p className={`trend ${change > 0 ? "up" : change < 0 ? "down" : ""}`}>{change > 0 ? "▲" : change < 0 ? "▼" : "▶"} {Math.abs(change)}% {change > 0 ? "más caro" : change < 0 ? "más barato" : "igual"} que hace un año</p>}
      <Sparkline values={(m.recent ?? []).map(r => r.price)} />
      <ul className="market-facts">
        {m.bestSellMonths && m.bestSellMonths.length > 0 && <li><strong>Meses con precios históricos más altos:</strong> {m.bestSellMonths.map(x => monthNames[x - 1]).join(" y ")}</li>}
        {m.worstSellMonths && m.worstSellMonths.length > 0 && <li><strong>Precio más bajo:</strong> {m.worstSellMonths.map(x => monthNames[x - 1]).join(" y ")}</li>}
        {outlook && <li><strong>En {monthNames[Number(outlook.period.slice(5, 7)) - 1]} podría estar entre</strong> {money(outlook.low)} y {money(outlook.high)} {unitWord(m.unit)}</li>}
      </ul>
    </> : <p>No hay precios mayoristas recientes de {cropNames[crop].toLowerCase()} en la fuente oficial.</p>}
    {m?.sowing?.status === "alta" && <p className="warning">⚠ Muchos están sembrando {cropNames[crop].toLowerCase()}: en el país se sembró {Math.round(((m.sowing.ratio ?? 1) - 1) * 100)}% más que lo normal en los últimos 12 meses. Si todos cosechan a la vez, el precio puede bajar.</p>}
    {m?.sowing?.status === "baja" && <p className="note-good">Se está sembrando menos {cropNames[crop].toLowerCase()} que lo normal en el país.</p>}
    <div className="sources-box"><h3>¿De dónde salen estos datos?</h3>
      {latest && <p>Precio mayorista promedio del mes en Santo Domingo. <a href={marketSources.prices}>Ministerio de Agricultura, {marketSources.pricesPeriod}</a>.</p>}
      {outlook && <p>El rango muestra cuánto ha variado el precio en esta época en años anteriores. No es una garantía.</p>}
      {m?.sowing && m.sowing.tareasLast12 && <p>Siembra nacional: {m.sowing.tareasLast12.toLocaleString("es-DO")} tareas en los 12 meses hasta {periodWord(m.sowing.windowEnd!)}, frente a {m.sowing.medianPrev12?.toLocaleString("es-DO")} (mediana de años anteriores). <a href={marketSources.sowing}>Consolidado de siembra, Ministerio de Agricultura</a>.</p>}
      {cost && <p>Costo de producir una tarea en 2019 ({cost.area}): {money(cost.costPerTarea)}; cosecha típica {cost.yield} {cost.yieldUnit} por tarea. <a href={`${cost.source}#page=${cost.pdfPage}`}>Costos de Producción 2019, pág. {cost.pdfPage}</a>. No se calcula ganancia: los costos son de 2019 y el precio es mayorista, no lo que te pagan en finca.</p>}
      <ul>{marketLimits.map(l => <li key={l}>{l}</li>)}</ul>
    </div>
  </section>;
}
