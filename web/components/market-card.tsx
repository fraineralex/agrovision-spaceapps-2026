/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — farmer market card; animated price area chart & 12-month seasonal strip by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { CustomSelect } from "@/components/custom-select";
import { cropNames, marketFor, marketLimits, marketSources, monthNames, unitWord, type CropId } from "@/lib/advisor";

const money = (n: number) => `RD$${n.toLocaleString("es-DO", { maximumFractionDigits: n < 100 ? 0 : 0 })}`;
const periodWord = (p: string) => `${monthNames[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;
const shortMonths = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function Sparkline({ values, periods }: { values: number[]; periods: string[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), avg = values.reduce((a, b) => a + b, 0) / values.length;
  const w = 320, h = 92, padTop = 14, padBot = 14, span = max - min || 1;
  const toY = (v: number) => h - padBot - ((v - min) / span) * (h - padTop - padBot);
  const coords = values.map((v, i) => ({ x: (i / (values.length - 1)) * w, y: toY(v), v, p: periods[i] ?? "" }));
  const linePts = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPts = `0,${h - padBot} ${linePts} ${w},${h - padBot}`;
  const active = hoverIdx !== null && coords[hoverIdx] ? coords[hoverIdx] : coords[coords.length - 1];
  const avgY = toY(avg);
  const bandW = w / coords.length;
  return (
    <div className="market-chart-box" onMouseLeave={() => setHoverIdx(null)}>
      <div className="market-chart-meta">
        <span>{active.p ? `${periodWord(active.p)}: ${money(active.v)}` : "Últimos 24 meses"}</span>
        <span>Mín {money(min)} · Prom {money(Math.round(avg))} · Máx {money(max)}</span>
      </div>
      <svg className="sparkline-rich" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Precio de los últimos 24 meses: mínimo ${money(min)}, máximo ${money(max)}`}>
        <defs>
          <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f4d2c" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#1f4d2c" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1="0" y1={avgY} x2={w} y2={avgY} stroke="#6b4226" strokeOpacity="0.35" strokeDasharray="4 4" />
        <line x1={active.x} y1={padTop - 4} x2={active.x} y2={h - padBot} stroke="#185b3c" strokeOpacity="0.35" strokeWidth="1.5" />
        <polygon points={areaPts} fill="url(#priceAreaGrad)" />
        <polyline className="price-line-anim" points={linePts} fill="none" stroke="var(--success)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <circle className={hoverIdx === null ? "price-dot-pulse" : undefined} cx={active.x} cy={active.y} r="5.5" fill="var(--success)" stroke="var(--card)" strokeWidth="2" />
        {coords.map((c, idx) => (
          <rect
            key={c.p || idx}
            x={Math.max(0, c.x - bandW / 2)}
            y="0"
            width={bandW}
            height={h}
            fill="transparent"
            className="spark-hit"
            onMouseEnter={() => setHoverIdx(idx)}
            onClick={() => setHoverIdx(idx)}
          />
        ))}
      </svg>
    </div>
  );
}

export function MarketCard({ initialCrop }: { initialCrop: CropId }) {
  const [chosen, setChosen] = useState<CropId | null>(null);
  const [pickedMonth, setPickedMonth] = useState<number | null>(null);
  const crop = chosen ?? initialCrop;
  const m = marketFor(crop);
  const latest = m?.latest;
  const change = latest && m?.yearAgo ? Math.round((latest.price / m.yearAgo.price - 1) * 100) : null;
  const outlook = m?.outlook?.find(o => o.horizonMonths === 3);
  const cost = m?.cost2019;
  const bestSet = new Set(m?.bestSellMonths ?? []);
  const worstSet = new Set(m?.worstSellMonths ?? []);
  const activeMonth = pickedMonth ?? m?.bestSellMonths?.[0] ?? null;
  const activeIdx = activeMonth ? m?.seasonalIndex?.[String(activeMonth)] ?? null : null;
  return <section className="card market" aria-label="Precio y mercado">
    <div className="section-row"><h3>Precio del cultivo</h3>
      <div className="select-with-icon"><FarmIcon name={crop} size={20} /><CustomSelect ariaLabel="Cultivo" value={crop} options={(Object.keys(cropNames) as CropId[]).map(c => ({ value: c, label: cropNames[c] }))} onChange={val => setChosen(val as CropId)} /></div></div>
    {latest ? <>
      <div className="market-hero-strip">
        <div className="price-now"><span className="price-big">{money(latest.price)}</span><span>{unitWord(m.unit)} · {periodWord(latest.period)}</span></div>
        {change !== null && <p className={`trend ${change > 0 ? "up" : change < 0 ? "down" : ""}`}>{change > 0 ? "▲" : change < 0 ? "▼" : "▶"} {Math.abs(change)}% {change > 0 ? "más caro" : change < 0 ? "más barato" : "igual"} que hace un año</p>}
      </div>
      {m.priceQuality && <p className="note">Calidad limitada: se excluyeron {m.priceQuality.excluded.length} registros extremos. {m.priceQuality.rule}</p>}
      <Sparkline values={(m.recent ?? []).map(r => r.price)} periods={(m.recent ?? []).map(r => r.period)} />
      {Boolean(m.recent?.length) && <details className="visual-details"><summary>Ver precios mensuales en tabla</summary><table><caption>Precios mayoristas en Santo Domingo ({m.unit})</caption><thead><tr><th scope="col">Mes</th><th scope="col">Precio promedio</th></tr></thead><tbody>{m.recent?.map(row => <tr key={row.period}><th scope="row">{row.period}</th><td>{row.price.toLocaleString("es-DO")}</td></tr>)}</tbody></table></details>}
      {(bestSet.size > 0 || worstSet.size > 0) && (
        <div className="season-cal" aria-label="Calendario estacional de venta (12 meses)">
          <div className="season-cal-head">
            <span>Estacionalidad (Ene–Dic)</span>
            <span className="season-legend"><i className="leg-best" /> Mejor venta <i className="leg-worst" /> Precio bajo</span>
          </div>
          <ol className="season-months">
            {shortMonths.map((lbl, idx) => {
              const mm = idx + 1;
              const cls = bestSet.has(mm) ? "best" : worstSet.has(mm) ? "worst" : "mid";
              const isPicked = activeMonth === mm;
              const idxVal = m?.seasonalIndex?.[String(mm)] ?? 100;
              const barPct = Math.max(25, Math.min(100, Math.round(((idxVal - 65) / 60) * 100)));
              return <li key={mm} className={cls}>
                <button type="button" className={isPicked ? "sm-btn on" : "sm-btn"} aria-pressed={isPicked} title={`${monthNames[idx]}: ${cls === "best" ? "mejor época histórica" : cls === "worst" ? "precio histórico más bajo" : "precio intermedio"}`} onClick={() => setPickedMonth(mm)}>
                  <span className="sm-bar-wrap" aria-hidden="true"><span className="sm-bar-fill" style={{ height: `${barPct}%` }} /></span>
                  <span>{lbl}</span>
                </button>
              </li>;
            })}
          </ol>
          {activeMonth && <p className="season-picked">
            <strong style={{ textTransform: "capitalize" }}>{monthNames[activeMonth - 1]}:</strong>{" "}
            {bestSet.has(activeMonth) ? "época histórica de precios más altos" : worstSet.has(activeMonth) ? "época histórica de precios más bajos" : "comportamiento intermedio"}
            {typeof activeIdx === "number" ? ` (índice ${Math.round(activeIdx)} vs 100 promedio)` : ""}
          </p>}
        </div>
      )}
      {m?.sowing?.tareasLast12 && m?.sowing?.medianPrev12 && (() => {
        const maxT = Math.max(m.sowing.tareasLast12, m.sowing.medianPrev12, 1);
        const curPct = Math.max(8, Math.round((m.sowing.tareasLast12 / maxT) * 100));
        const medPct = Math.max(8, Math.round((m.sowing.medianPrev12 / maxT) * 100));
        return (
          <div className="sowing-pressure-card">
            <div className="sp-head">
              <strong>Presión de siembra nacional (12 meses)</strong>
              <span>{m.sowing.tareasLast12.toLocaleString("es-DO")} vs. {m.sowing.medianPrev12.toLocaleString("es-DO")} tareas normales</span>
            </div>
            <div className="sp-meters">
              <div className="sp-meter-row">
                <small>Actual</small>
                <span className="sp-track" aria-hidden="true"><span className="sp-fill current" style={{ width: `${curPct}%` }} /></span>
              </div>
              <div className="sp-meter-row">
                <small>Mediana</small>
                <span className="sp-track" aria-hidden="true"><span className="sp-fill median" style={{ width: `${medPct}%` }} /></span>
              </div>
            </div>
          </div>
        );
      })()}
      <ul className="market-facts">
        {m.bestSellMonths && m.bestSellMonths.length > 0 && <li><strong>Meses con precios históricos más altos:</strong> {m.bestSellMonths.map(x => monthNames[x - 1]).join(" y ")}</li>}
        {m.worstSellMonths && m.worstSellMonths.length > 0 && <li><strong>Precio más bajo:</strong> {m.worstSellMonths.map(x => monthNames[x - 1]).join(" y ")}</li>}
        {outlook && <li><strong>En {monthNames[Number(outlook.period.slice(5, 7)) - 1]} el histórico estuvo entre</strong> {money(outlook.low)} y {money(outlook.high)} {unitWord(m.unit)}</li>}
      </ul>
    </> : <p>No hay precios mayoristas recientes de {cropNames[crop].toLowerCase()} en la fuente oficial.</p>}
    {m?.sowing?.status === "alta" && <p className="warning"><AlertTriangle aria-hidden="true" size={18} /><span>Muchos están sembrando {cropNames[crop].toLowerCase()}: +{Math.round(((m.sowing.ratio ?? 1) - 1) * 100)}% sobre lo normal (últimos 12 meses). Posible sobreoferta al cosechar.</span></p>}
    {m?.sowing?.status === "baja" && <p className="note-good">Siembra nacional menor que lo normal para {cropNames[crop].toLowerCase()}.</p>}
    <details className="sources-fold">
      <summary>¿De dónde salen estos datos? ({marketSources.pricesPeriod} · MA)</summary>
      <div className="sources-box">
        {latest && <p>Precio mayorista promedio del mes en Santo Domingo. <a href={marketSources.prices}>Ministerio de Agricultura, {marketSources.pricesPeriod}</a>.</p>}
        {outlook && <p>El rango muestra cuánto ha variado el precio en esta época en años anteriores. No es una garantía.</p>}
        {m?.sowing && m.sowing.tareasLast12 && <p>Siembra nacional: {m.sowing.tareasLast12.toLocaleString("es-DO")} tareas en los 12 meses hasta {periodWord(m.sowing.windowEnd!)}, frente a {m.sowing.medianPrev12?.toLocaleString("es-DO")} (mediana de años anteriores). <a href={marketSources.sowing}>Consolidado de siembra, Ministerio de Agricultura</a>.</p>}
        {cost && <p>Costo de producir una tarea en 2019 ({cost.area}): {money(cost.costPerTarea)}; cosecha típica {cost.yield} {cost.yieldUnit} por tarea. <a href={`${cost.source}#page=${cost.pdfPage}`}>Costos de Producción 2019, pág. {cost.pdfPage}</a>.</p>}
        <ul>{marketLimits.map(l => <li key={l}>{l}</li>)}</ul>
      </div>
    </details>
  </section>;
}
