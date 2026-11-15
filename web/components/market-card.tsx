/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — farmer market card; animated price area chart & 12-month seasonal strip by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { AlertTriangle } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import { cropLabel, monthLabel } from "@/lib/i18n/advice";
import { marketMessages } from "@/lib/i18n/market-messages";
import { sourceMessages } from "@/lib/i18n/source-messages";
import { FarmIcon } from "@/components/farm-icon";
import { CustomSelect } from "@/components/custom-select";
import { cropNames, marketFor, marketLimits, marketSources, type CropId } from "@/lib/advisor";

const format = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
const rich = (template: string, values: Record<string, ReactNode>) => template.split(/(\{\w+\})/g).map((part, index) => /^\{\w+\}$/.test(part) ? <Fragment key={index}>{values[part.slice(1, -1)]}</Fragment> : part);

function Sparkline({ values, periods }: { values: number[]; periods: string[] }) {
  const locale = useLocale();
  const text = marketMessages[locale];
  const money = (n: number) => `RD$${n.toLocaleString(localeTag(locale), { maximumFractionDigits: 0 })}`;
  const periodWord = (p: string) => `${monthLabel(Number(p.slice(5, 7)), locale)} ${p.slice(0, 4)}`;
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
        <span>{active.p ? `${periodWord(active.p)}: ${money(active.v)}` : text.last24}</span>
        <span>{text.min} {money(min)} · {text.avg} {money(Math.round(avg))} · {text.max} {money(max)}</span>
      </div>
      <svg className="sparkline-rich" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={format(text.chart, { min: money(min), max: money(max) })}>
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
  const locale = useLocale();
  const text = marketMessages[locale];
  const sourceText = sourceMessages[locale];
  const tag = localeTag(locale);
  const money = (n: number) => `RD$${n.toLocaleString(tag, { maximumFractionDigits: 0 })}`;
  const periodWord = (p: string) => `${monthLabel(Number(p.slice(5, 7)), locale)} ${p.slice(0, 4)}`;
  const areas: Record<string, string> = { "Regional Suroeste (San Juan), riego por gravedad": sourceText.areaSouthwest, "Nacional, riego": sourceText.areaNationalIrrigated, "Nacional": sourceText.areaNational, "Cebolla roja, riego por gravedad": sourceText.areaOnion };
  const units: Record<string, string> = { "quintales": sourceText.quintals, "QQ de 100 lb": sourceText.qq100, "QQ de 110 lb": sourceText.qq110, "QQ": sourceText.qq, "fanegas de 100 kg": sourceText.fanegas };
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
  return <section className="card market" aria-label={text.aria}>
    <div className="section-row"><h3>{text.title}</h3>
      <div className="select-with-icon"><FarmIcon name={crop} size={20} /><CustomSelect ariaLabel={text.crop} value={crop} options={(Object.keys(cropNames) as CropId[]).map(c => ({value:c,label:cropLabel(c,locale)}))} onChange={val => setChosen(val as CropId)} /></div></div>
    {latest ? <>
      <div className="price-now"><span className="price-big">{money(latest.price)}</span><span>{m.unit === "DOP/lb" ? sourceText.perPound : m.unit === "DOP/quintal" ? sourceText.perQuintal : m.unit === "DOP/kg" ? sourceText.perKg : sourceText.perUnit} · {periodWord(latest.period)}</span></div>
      {change !== null && <p className={`trend ${change > 0 ? "up" : change < 0 ? "down" : ""}`}>{change > 0 ? "▲" : change < 0 ? "▼" : "▶"} {change === 0 ? text.unchanged : format(text.trend, { percent: Math.abs(change), direction: change > 0 ? text.higher : text.lower })}</p>}
      {m.priceQuality && <p className="note">{format(text.quality, { count: m.priceQuality.excluded.length })} {locale === "es" ? m.priceQuality.rule : text.qualityRule}</p>}
      <Sparkline values={(m.recent ?? []).map(r => r.price)} periods={(m.recent ?? []).map(r => r.period)} />
      {Boolean(m.recent?.length) && <details className="visual-details"><summary>{text.table}</summary><table><caption>{format(text.tableCaption, { unit: m.unit ?? "" })}</caption><thead><tr><th scope="col">{text.month}</th><th scope="col">{text.averagePrice}</th></tr></thead><tbody>{m.recent?.map(row => <tr key={row.period}><th scope="row">{row.period}</th><td>{row.price.toLocaleString(tag)}</td></tr>)}</tbody></table></details>}
      {(bestSet.size > 0 || worstSet.size > 0) && (
        <div className="season-cal" aria-label={text.calendar}>
          <div className="season-cal-head">
            <span>{text.seasonality}</span>
            <span className="season-legend"><i className="leg-best" /> {text.bestSale} <i className="leg-worst" /> {text.lowPrice}</span>
          </div>
          <ol className="season-months">
            {Array.from({ length: 12 }, (_, idx) => {
              const lbl = monthLabel(idx + 1, locale).slice(0, 1).toLocaleUpperCase(tag);
              const mm = idx + 1;
              const cls = bestSet.has(mm) ? "best" : worstSet.has(mm) ? "worst" : "mid";
              const isPicked = activeMonth === mm;
              const idxVal = m?.seasonalIndex?.[String(mm)] ?? 100;
              const barPct = Math.max(25, Math.min(100, Math.round(((idxVal - 65) / 60) * 100)));
              return <li key={mm} className={cls}>
                <button type="button" className={isPicked ? "sm-btn on" : "sm-btn"} aria-pressed={isPicked} title={`${monthLabel(idx + 1,locale)}: ${cls === "best" ? text.bestHistory : cls === "worst" ? text.worstHistory : text.middlePrice}`} onClick={() => setPickedMonth(mm)}>
                  <span className="sm-bar-wrap" aria-hidden="true"><span className="sm-bar-fill" style={{ height: `${barPct}%` }} /></span>
                  <span>{lbl}</span>
                </button>
              </li>;
            })}
          </ol>
          {activeMonth && <p className="season-picked">
            <strong style={{ textTransform: "capitalize" }}>{monthLabel(activeMonth, locale)}:</strong>{" "}
            {bestSet.has(activeMonth) ? text.bestDescription : worstSet.has(activeMonth) ? text.worstDescription : text.middleDescription}
            {typeof activeIdx === "number" ? ` (${format(text.index, { index: Math.round(activeIdx) })})` : ""}
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
        {m.bestSellMonths && m.bestSellMonths.length > 0 && <li><strong>{text.highestMonths}</strong> {new Intl.ListFormat(tag).format(m.bestSellMonths.map(x => monthLabel(x, locale)))}</li>}
        {m.worstSellMonths && m.worstSellMonths.length > 0 && <li><strong>{text.lowestMonths}</strong> {new Intl.ListFormat(tag).format(m.worstSellMonths.map(x => monthLabel(x, locale)))}</li>}
        {outlook && <li><strong>{format(text.outlook, { month: monthLabel(Number(outlook.period.slice(5, 7)), locale) })}</strong> {money(outlook.low)} {text.and} {money(outlook.high)} {m.unit === "DOP/lb" ? sourceText.perPound : m.unit === "DOP/quintal" ? sourceText.perQuintal : m.unit === "DOP/kg" ? sourceText.perKg : sourceText.perUnit}</li>}
      </ul>
    </> : <p>{format(text.noPrices, { crop: cropLabel(crop, locale).toLowerCase() })}</p>}
    {m?.sowing?.status === "alta" && <p className="warning"><AlertTriangle aria-hidden="true" size={18} /><span>{format(text.oversupply, { crop: cropLabel(crop, locale).toLowerCase(), percent: Math.round(((m.sowing.ratio ?? 1) - 1) * 100) })}</span></p>}
    {m?.sowing?.status === "baja" && <p className="note-good">{format(text.lowSowing, { crop: cropLabel(crop, locale).toLowerCase() })}</p>}
    <details className="sources-fold">
      <summary>{format(text.sourceTitle, { period: marketSources.pricesPeriod })}</summary>
      <div className="sources-box">
        {latest && <p>{rich(text.priceSource, { source: <a href={marketSources.prices}>{format(text.ministryPeriod, { period: marketSources.pricesPeriod })}</a> })}</p>}
        {outlook && <p>{text.outlookSource}</p>}
        {m?.sowing && m.sowing.tareasLast12 && <p>{rich(text.sowingSource, { current: m.sowing.tareasLast12.toLocaleString(tag), end: periodWord(m.sowing.windowEnd!), median: m.sowing.medianPrev12?.toLocaleString(tag) ?? "—", source: <a href={marketSources.sowing}>{text.sowingLink}</a> })}</p>}
        {cost && <p>{rich(text.costSource, { area: areas[cost.area] ?? cost.area, cost: money(cost.costPerTarea), yield: cost.yield.toLocaleString(tag), unit: units[cost.yieldUnit] ?? cost.yieldUnit, source: <a href={`${cost.source}#page=${cost.pdfPage}`}>{format(text.costLink, { page: cost.pdfPage })}</a> })}</p>}
        <ul>{marketLimits.map((item, index) => <li key={item}>{locale === "es" ? item : text.limits[index] ?? item}</li>)}</ul>
      </div>
    </details>
  </section>;
}
