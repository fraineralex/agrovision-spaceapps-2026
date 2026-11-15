/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";
import { Bug, Coins, Droplets, FileText, Leaf, Sun } from "lucide-react";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { FAO56_URL, marketFor, marketSources, starsFor, type CropAdvice, type PreviousCrop } from "@/lib/advisor";
import { LanguageSelector } from "@/components/language-selector";
import { soilSources } from "@/lib/soil";
import { Stars } from "@/components/field-ui";
import { droughtSignal, faoProvince, faoGiews } from "@/lib/fao-giews";
import type { Irrigation } from "@/lib/data";
import { pestSources, pestsFor } from "@/lib/pests";
import { useLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import { sourceMessages, pestSourceLabels } from "@/lib/i18n/source-messages";
import { cropLabel, localizedPestPrecautions, localizedPillarWord, localizedWhyThisCrop, monthLabel } from "@/lib/i18n/advice";

const IDIAF_URL = "https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf";
type Values = Record<string, string | number>;
const fmt = (template: string, values: Values) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
function rich(template: string, values: Record<string, ReactNode>) {
  return template.split(/(\{\w+\})/g).map((part, index) => /^\{\w+\}$/.test(part) ? <Fragment key={index}>{values[part.slice(1, -1)]}</Fragment> : part);
}
function Block({ icon, title, verdict, children, links }: { icon: ReactNode; title: string; verdict: string; children: ReactNode; links: [string, string][] }) {
  return <section className="src-block">
    <h3><span aria-hidden="true" className="src-icon">{icon}</span> {title}: <em>{verdict}</em></h3>
    {children}
    <div className="src-links">{links.map(([label, url]) => <a key={url + label} href={url} target="_blank" rel="noreferrer"><FileText aria-hidden="true" size={18} /> {label}</a>)}</div>
  </section>;
}

export function SourcesSheet({ advice, all, province, previous, irrigation, sowMonth, onClose }: { advice: CropAdvice; all: CropAdvice[]; province?: string; previous: PreviousCrop; irrigation: Irrigation; sowMonth: number; onClose: () => void }) {
  const locale = useLocale();
  const text = sourceMessages[locale];
  const tag = localeTag(locale);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    close.current?.focus();
    return () => { element?.close(); if (trigger instanceof HTMLElement) trigger.focus(); };
  }, []);
  const keepFocus = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const items = event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), select:not(:disabled), a[href]");
    const edge = event.shiftKey ? items[0] : items[items.length - 1];
    if (document.activeElement !== edge) return;
    event.preventDefault();
    (event.shiftKey ? items[items.length - 1] : items[0])?.focus();
  };
  const money = (n: number) => `RD$${Math.round(n).toLocaleString(tag)}`;
  const when = (period: string) => new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)) - 1, 1)));
  const date = (value: string) => new Intl.DateTimeFormat(tag, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  const m = marketFor(advice.crop);
  const fao = faoProvince(province);
  const signal = droughtSignal(fao);
  const signalLabel = { gray: text.signalGray, red: text.signalRed, amber: text.signalAmber, green: text.signalGreen }[signal.color] ?? text.signalGray;
  const perennial = advice.harvestMonth === 0;
  const sorted = [...all].sort((a, b) => a.kcDays - b.kcDays);
  const rank = sorted.findIndex(a => a.crop === advice.crop) + 1;
  const idx = perennial ? null : m?.seasonalIndex?.[String(advice.harvestMonth)] ?? null;
  const hist = fao?.history.reduce<NonNullable<typeof fao>["history"][number] | undefined>((h, x) => !h || x.frequency30Pct > h.frequency30Pct ? x : h, undefined);
  const name = cropLabel(advice.crop, locale);
  const prevName = previous === "unknown" || previous === "otro" ? null : cropLabel(previous, locale).toLowerCase();
  const pestEntry = pestsFor(advice.crop);
  const shared = advice.sharedPests;
  const sourceIds = new Set([...(pestEntry?.sources ?? []), ...(shared.length ? pestsFor(previous)?.sources ?? [] : [])]);
  const pestLinks: [string, string][] = Array.from(sourceIds, id => [pestSourceLabels[locale][id] ?? pestSources[id][0], pestSources[id][1]]);
  if (advice.scores.pests === 5) pestLinks.push([text.idiafSource, IDIAF_URL]);
  const rainAmount = (pct: number) => Math.abs(pct) < 10 ? text.rainNormal : pct >= 200 ? text.rainTriple : pct >= 100 ? text.rainDouble : pct >= 50 ? text.rainMuchMore : pct > 0 ? text.rainMore : Math.abs(pct) >= 50 ? text.rainHalf : text.rainLess;
  const unit = m?.unit === "DOP/lb" ? text.perPound : m?.unit === "DOP/quintal" ? text.perQuintal : m?.unit === "DOP/kg" ? text.perKg : text.perUnit;
  const areas: Record<string, string> = { "Regional Suroeste (San Juan), riego por gravedad": text.areaSouthwest, "Nacional, riego": text.areaNationalIrrigated, "Nacional": text.areaNational, "Cebolla roja, riego por gravedad": text.areaOnion };
  const units: Record<string, string> = { "quintales": text.quintals, "QQ de 100 lb": text.qq100, "QQ de 110 lb": text.qq110, "QQ": text.qq, "fanegas de 100 kg": text.fanegas };
  const previousText = prevName ? fmt(text.after, { crop: prevName }) : "";
  return <dialog ref={dialog} onKeyDown={keepFocus} className="src-overlay" aria-label={fmt(text.dialog, { crop: name })} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="src-sheet" onClick={e => e.stopPropagation()}>
      <div className="src-head"><h2>{fmt(text.why, { crop: name.toLowerCase() })}</h2><div className="src-head-actions"><LanguageSelector /><button type="button" className="ob-link" ref={close} onClick={onClose}>{text.close}</button></div></div>
      <section className="src-why" aria-label={fmt(text.whyLabel, { crop: name })}>
        <div className="src-why-head"><Stars score={advice.overall} /><strong>{advice.overall === null ? text.missing : fmt(text.stars, { count: starsFor(advice.overall) })}</strong></div>
        {localizedWhyThisCrop(advice, all, previous, locale).map(line => <p key={line}>{line}</p>)}
        <p className="src-limit">{text.guide}</p>
      </section>
      <h3 className="src-detail-title">{text.detail}</h3>
      <p className="src-intro">{rich(text.intro, { crop: <strong>{name.toLowerCase()}</strong>, province: <strong>{province ?? text.nationwide}</strong>, month: <strong>{monthLabel(sowMonth, locale)}</strong>, previous: previousText })}</p>
      <Block icon={<Leaf />} title="Suelo" verdict={advice.soil.title} links={advice.soil.sources.map(k => [soilSources[k].label, soilSources[k].url] as [string, string])}>
        <p>{advice.soil.text}</p>
        <p>Rotar es sobre todo para cuidar la tierra: cada cultivo busca los nutrientes en una capa distinta, las leguminosas dejan nitrógeno y las raíces y el rastrojo variados forman materia orgánica.</p>
        <p className="src-limit">Es una regla general de la FAO, no una medición de tu finca. Para saber cómo está tu tierra hace falta un análisis de suelo. Esta parte no cambia las estrellas.</p>
      </Block>
      <Block icon={<Droplets />} title={text.water} verdict={localizedPillarWord(advice, "water", locale)} links={[[text.faoTables, FAO56_URL]]}>
        <p>{fmt(text.waterMethod, { crop: name.toLowerCase(), row: advice.faoRow })}</p>
        <p>{rich(text.waterRank, { count: all.length, crop: name.toLowerCase(), rank: <strong>{rank}</strong>, cycle: perennial ? text.year : fmt(text.cycle, { months: Math.round(advice.cycleDays / 30) }) })}</p>
        {advice.crop === "arroz" && <p>{text.rice}</p>}
        {!advice.viable && <p>{text.noIrrigation}</p>}
        <p className="src-limit">{text.waterLimit}</p>
      </Block>
      <Block icon={<Sun />} title={text.drought} verdict={localizedPillarWord(advice, "climate", locale)} links={fao ? [[text.faoCountry, faoGiews.source], ...(fao.asi?.source ? [[text.asiData, fao.asi.source] as [string, string]] : [])] : [["FAO GIEWS", faoGiews.source]]}>
        {fao ? <>
          <p>{fmt(text.droughtIntro, { province: province ?? "" })} {fao.asi ? rich(text.droughtRecent, { date: <strong>{date(fao.asi.date)}</strong>, percent: fao.asi.value < 1 ? text.lessOne : `${Math.round(fao.asi.value)}%` }) : text.noRecent} {rich(text.droughtResult, { signal: <strong>{signalLabel}</strong> })}</p>
          {hist && <p>{rich(text.history, { seasons: hist.seasons, start: hist.start, end: hist.end, count: <strong>{hist.above30}</strong> })}</p>}
          {fao.rain?.anomalyPct != null && <p>{fmt(text.rainAnomaly, { date: date(fao.rain.date), amount: rainAmount(fao.rain.anomalyPct) })}</p>}
          <p>{text.droughtEffect}</p>
        </> : <p>{text.chooseProvince}</p>}
        <p className="src-limit">{text.droughtLimit}</p>
      </Block>
      <Block icon={<Bug />} title={text.pests} verdict={localizedPillarWord(advice, "pests", locale)} links={pestLinks}>
        {localizedPestPrecautions(previous, advice.crop, locale).map(note => <p key={note}>{note}</p>)}
        {shared.length > 0 && <p>{fmt(text.overlaps, { previous: prevName ?? "" })}</p>}
        {advice.scores.pests === 5 && <p>{text.idiafRotation}</p>}
        {advice.scores.pests === 1 && <p>{text.pestPenalty}</p>}
        {advice.scores.pests === null && <p>{text.pestUnknown}</p>}
        <p className="src-limit">{text.pestLimit}</p>
      </Block>
      <Block icon={<Coins />} title={text.price} verdict={localizedPillarWord(advice, "market", locale)} links={[...(m?.latest ? [[fmt(text.wholesaleSource, { period: marketSources.pricesPeriod }), marketSources.prices] as [string, string]] : []), ...(m?.sowing?.tareasLast12 ? [[text.sowingSource, marketSources.sowing] as [string, string]] : []), ...(m?.cost2019 ? [[fmt(text.costSource, { page: m.cost2019.pdfPage }), `${m.cost2019.source}#page=${m.cost2019.pdfPage}`] as [string, string]] : [])]}>
        {perennial ? <p>{fmt(text.permanent, { crop: name })}</p> : m?.latest ? <>
          <p>{rich(text.wholesaleIntro, { period: <strong>{when(m.latest.period)}</strong>, crop: name.toLowerCase(), price: <strong>{money(m.latest.price)}</strong>, unit })}</p>
          {idx != null && <p>{rich(text.seasonal, { sow: monthLabel(sowMonth, locale), harvest: <strong>{monthLabel(advice.harvestMonth, locale)}</strong>, years: m.seasonalYearsUsed?.join(", ") ?? text.several, percentage: Math.abs(Math.round(idx - 100)), direction: idx >= 100 ? text.above : text.below })}</p>}
        </> : <p>{fmt(text.noWholesale, { crop: name.toLowerCase() })}</p>}
        {m?.sowing?.tareasLast12 && m.sowing.medianPrev12 ? <p>{fmt(text.nationalSowing, { current: m.sowing.tareasLast12.toLocaleString(tag), end: when(m.sowing.windowEnd!), median: m.sowing.medianPrev12.toLocaleString(tag) })} {m.sowing.status === "alta" ? text.high : m.sowing.status === "baja" ? text.low : text.normal}</p> : null}
        {m?.cost2019 && <p>{fmt(text.productionCost, { area: areas[m.cost2019.area] ?? m.cost2019.area, cost: money(m.cost2019.costPerTarea), yield: m.cost2019.yield.toLocaleString(tag), unit: units[m.cost2019.yieldUnit] ?? m.cost2019.yieldUnit })}</p>}
        <p className="src-limit">{text.priceLimit}</p>
      </Block>
      <section className="src-block">
        <h3>{text.important}</h3>
        <p>{fmt(text.colors, { irrigation: irrigation === "irrigated" ? text.yes : irrigation === "rainfed" ? text.no : text.unknown })}</p>
        <p className="src-limit">{text.validation}</p>
      </section>
    </div>
  </dialog>;
}
