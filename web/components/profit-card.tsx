/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";
import type { Irrigation } from "@/lib/data";
import { Fragment, useState, type ReactNode } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { CustomSelect } from "@/components/custom-select";
import { marketSources, type CropId } from "@/lib/advisor";
import { CPI, profitFor, rd } from "@/lib/profit";
import { useLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import { cropLabel } from "@/lib/i18n/advice";
import { profitMessages } from "@/lib/i18n/profit-messages";
import { sourceMessages } from "@/lib/i18n/source-messages";

const format = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
const rich = (template: string, values: Record<string, ReactNode>) => template.split(/(\{\w+\})/g).map((part, index) => /^\{\w+\}$/.test(part) ? <Fragment key={index}>{values[part.slice(1, -1)]}</Fragment> : part);
const reasonKeys = ["noCost", "irrigationUnknown", "rainfedMissing", "systemUnknown", "riceMismatch", "unitMismatch", "priceMissing", "noteWholesale", "noteInflation", "noteYield", "noteQuintal"] as const;

export function ProfitCard({ crops, initialCrop, tareas: farmTareas, irrigation }: { crops: CropId[]; initialCrop: CropId; tareas: number | null; irrigation: Irrigation }) {
  const locale = useLocale();
  const text = profitMessages[locale];
  const source = sourceMessages[locale];
  const tag = localeTag(locale);
  const localizeReason = (value: string) => { const key = reasonKeys.find(item => profitMessages.es[item] === value); return key ? text[key] : value; };
  const areas: Record<string, string> = { "Regional Suroeste (San Juan), riego por gravedad": source.areaSouthwest, "Nacional, riego": source.areaNationalIrrigated, "Nacional": source.areaNational, "Cebolla roja, riego por gravedad": source.areaOnion };
  const areaName = (value: string) => areas[value] ?? value;
  const [crop, setCrop] = useState<CropId>(initialCrop);
  const [tareas, setTareas] = useState(farmTareas ? String(Number(farmTareas.toFixed(2))) : "");
  const t = Math.max(0, Math.min(100000, Number(tareas.replace(",", ".")) || 0));
  const p = profitFor(crop, t, irrigation);
  const maxMoney = "unavailable" in p ? 1 : Math.max(1, p.costRD, p.income.high);
  const oneDecimal = (value: number) => value.toLocaleString(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return <div className="profit">
    <div className="profit-inputs">
      <div className="ag-select-field"><span className="ag-select-label">{text.crop}</span><div className="select-with-icon"><FarmIcon name={crop} size={20} /><CustomSelect ariaLabel={text.crop} value={crop} options={crops.map(c => ({ value: c, label: cropLabel(c,locale) }))} onChange={val => setCrop(val as CropId)} /></div></div>
      <label>{text.tareas}<input inputMode="decimal" value={tareas} onChange={e => setTareas(e.target.value)} aria-label={text.tareas} /></label>
    </div>
    {t <= 0 ? <p className="note">{text.enterArea}</p> : "unavailable" in p ? <p className="warning">{format(text.cannotCalculate, { crop: cropLabel(crop, locale).toLowerCase(), reason: localizeReason(p.unavailable) })}</p> : <>
      <h3>{text.scenario}</h3>
      <p className="note">{format(text.areaCost, { area: areaName(p.costSource.area), tareas: t.toLocaleString(tag) })}</p>
      <div className="profit-range" role="group" aria-label={text.remaining}>
        {(["low", "mid", "high"] as const).map(k => <div key={k} className={`profit-col ${p.profit[k] < 0 ? "loss" : "gain"}`}>
          <small>{text[k]}</small><strong>{rd(Math.round(p.profit[k] / 100) * 100, locale)}</strong><span>{p.profit[k] < 0 ? text.loss : text.estimated}</span>
        </div>)}
      </div>
      <div className="profit-chart" aria-label={text.visual}>
        <div className="pchart-row"><div className="pchart-head"><span>{text.cost}</span><strong>{rd(p.costRD, locale)}</strong></div><div className="pchart-track"><span className="pchart-bar cost" style={{ width: `${Math.round((p.costRD / maxMoney) * 100)}%` }} /></div></div>
        <div className="pchart-row"><div className="pchart-head"><span>{text.sale}</span><strong>{rd(p.income.mid, locale)}</strong></div><div className="pchart-track"><span className={`pchart-bar ${p.income.mid >= p.costRD ? "rev-good" : "rev-low"}`} style={{ width: `${Math.round((p.income.mid / maxMoney) * 100)}%` }} /><span className="pchart-marker" style={{ left: `${Math.round((p.costRD / maxMoney) * 100)}%` }} title={text.breakEven} aria-hidden="true" /></div></div>
      </div>
      <ul className="profit-lines">
        <li>{rich(text.spend, { amount: <strong>{rd(p.costRD, locale)}</strong>, tareas: t.toLocaleString(tag) })}</li>
        <li>{rich(text.quantity, { amount: <strong>{Math.round(p.yieldLb).toLocaleString(tag)}</strong> })}</li>
        <li>{rich(text.wholesale, { low: <strong>{rd(p.income.low, locale)}</strong>, high: <strong>{rd(p.income.high, locale)}</strong> })}</li>
      </ul>
      <details className="sources-fold">
        <summary>{text.sourceTitle}</summary>
        <p className="note">{text.approximate} {p.notes.map(localizeReason).join(" ")}</p>
        <div className="sources-box">
          <p><strong>{text.costLabel}</strong> {rich(text.costSource, { cost: `RD$${p.costSource.cost2019PerTarea.toLocaleString(tag)}`, area: areaName(p.costSource.area), report: <a href={`${p.costSource.url}#page=${p.costSource.page}`}>{format(text.costReport, { page: p.costSource.page })}</a>, cpi: <a href={CPI.url}>{text.cpi}</a> })}</p>
          <p><strong>{text.priceLabel}</strong> {rich(text.priceSource, { source: <a href={marketSources.prices}>{text.ministry}</a>, low: oneDecimal(p.pricePerLb.low), mid: oneDecimal(p.pricePerLb.mid), high: oneDecimal(p.pricePerLb.high) })}</p>
        </div>
      </details>
    </>}
  </div>;
}
