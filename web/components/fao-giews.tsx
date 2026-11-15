/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";
import { CloudRain, History, Sun } from "lucide-react";
import { droughtSignal, faoGiews, faoProvince } from "@/lib/fao-giews";
import { useLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import type { Locale } from "@/lib/i18n/messages";
import { droughtMessages } from "@/lib/i18n/drought-messages";
import { sourceMessages } from "@/lib/i18n/source-messages";
import styles from "./fao-giews.module.css";

const format = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
export function areaWords(pct: number, locale: Locale = "es") {
  const text = droughtMessages[locale];
  return pct < 1 ? text.areaLess : format(text.areaPct, { percent: Math.round(pct) });
}
export function rainWords(pct: number, locale: Locale = "es") {
  const text = sourceMessages[locale];
  const a = Math.abs(pct);
  const value = a < 10 ? text.rainNormal : pct >= 200 ? text.rainTriple : pct >= 100 ? text.rainDouble : pct >= 50 ? text.rainMuchMore : pct > 0 ? text.rainMore : a >= 50 ? text.rainHalf : text.rainLess;
  return value.charAt(0).toLocaleUpperCase(localeTag(locale)) + value.slice(1);
}
function longDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
}
function RingGauge({ value, max, tone }: { value: number; max: number; tone: string }) {
  const rawPct = max > 0 ? value / max : 0;
  const pct = value > 0 ? Math.max(0.06, Math.min(1, rawPct)) : 0;
  const r = 18, c = 2 * Math.PI * r;
  return <svg className="mini-ring" width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
    <circle cx="23" cy="23" r={r} fill="none" stroke="var(--track-bg, #dce5dc)" strokeWidth="5" />
    <circle className={`mini-ring-arc ${tone}`} cx="23" cy="23" r={r} fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 23 23)" />
  </svg>;
}
export function FaoScoreDetails({ province }: { province?: string }) {
  const locale = useLocale();
  const text = droughtMessages[locale];
  const data = faoProvince(province);
  if (!data) return null;
  const [before, after] = text.sourceIntro.split("{link}");
  return <details className="sources-fold">
    <summary>{format(text.sources, { province: data.name })}</summary>
    <div className="sources-box">
      <p>{before}<a href={faoGiews.source}>FAO GIEWS / ASIS · {data.name}</a>{format(after, { date: longDate(faoGiews.retrievedAt, locale) })}</p>
      {data.asi && <p><a href={data.asi.source ?? faoGiews.source}>{text.cropland}</a>: {areaWords(data.asi.value, locale).toLowerCase()} · {format(text.week, { date: longDate(data.asi.date, locale) })}.</p>}
      {data.history.map(h => <p key={h.season}><a href={h.source ?? faoGiews.source}>{format(text.historyLink, { season: h.season })}</a> ({h.start}–{h.end}): {format(text.historyCount, { above30: h.above30, seasons: h.seasons, above50: h.above50 })}</p>)}
      {data.rain && <p><a href={data.rain.source ?? faoGiews.source}>{text.estimatedRain}</a>: {format(text.rainDetail, { value: data.rain.value.toLocaleString(localeTag(locale)), normal: data.rain.normalMm?.toLocaleString(localeTag(locale)) ?? text.noData, date: longDate(data.rain.date, locale) })}</p>}
      <p>{text.colors}</p>
    </div>
  </details>;
}
export function FaoDroughtCard({ province }: { province?: string }) {
  const locale = useLocale();
  const text = droughtMessages[locale];
  const sourceText = sourceMessages[locale];
  const data = faoProvince(province);
  const signal = droughtSignal(data);
  const color = signal.color as "gray" | "red" | "amber" | "green";
  const signalLabel = { gray: sourceText.signalGray, red: sourceText.signalRed, amber: sourceText.signalAmber, green: sourceText.signalGreen }[color];
  const rain = data?.rain;
  const historical = data?.history.reduce<typeof data.history[number] | undefined>((highest, h) => !highest || h.frequency30Pct > highest.frequency30Pct ? h : highest, undefined);
  const asiVal = data?.asi?.value ?? 0;
  const anomalyPct = rain?.anomalyPct ?? null;
  const anomalyWidth = anomalyPct == null ? 0 : Math.min(100, Math.round(Math.abs(anomalyPct) / 1.5));
  return <section className="card" aria-label={text.aria}>
    <div className="section-row"><h2>{text.waterDrought} · {province ?? text.chooseProvince}</h2></div>
    <p className={styles.note}>{text.context}</p>
    <div className={styles.grid}>
      <div className={styles.item}>
        <h3><Sun size={16} aria-hidden="true" /> {text.alert}</h3>
        <div className="fao-visual-row"><RingGauge value={asiVal} max={100} tone={signal.color} /><div>
          <strong className={styles.status}><i className={`light ${signal.color}`}/>{signalLabel}</strong>
          <p className={styles.note}>{data?.asi ? areaWords(asiVal, locale) : text.noObservation}</p>
        </div></div>
        <p>{text[color]}</p>
        <p className={styles.note}>{data?.asi ? format(text.observation, { date: longDate(data.asi.date, locale) }) : text.noProvObservation} · {text.indicator}</p>
      </div>
      <div className={styles.item}>
        <h3><History size={16} aria-hidden="true" /> {text.historicalRisk}</h3>
        {historical ? <>
          <div className="fao-visual-row"><RingGauge value={historical.above30} max={historical.seasons} tone={historical.frequency30Pct >= 30 ? "red" : historical.frequency30Pct >= 15 ? "amber" : "green"} /><strong>{format(text.seasons, { count: historical.above30, total: historical.seasons })}</strong></div>
          <p>{text.historyExplanation}</p>
          <p className={styles.note}>{historical.start}–{historical.end} · {format(text.season, { season: historical.season })} · {text.fromFao}</p>
        </> : <p>{text.noHistory}</p>}
      </div>
      <div className={styles.item}>
        <h3><CloudRain size={16} aria-hidden="true" /> {text.recentRain}</h3>
        {anomalyPct != null && rain ? <>
          <strong>{rainWords(anomalyPct, locale)}</strong>
          <div className="anom-track" aria-hidden="true"><span className={`anom-fill ${anomalyPct >= 0 ? "wet" : "dry"}`} style={{ width: `${Math.max(10, anomalyWidth)}%` }} /></div>
          <p className={styles.note}>{format(text.rainExplanation, { date: longDate(rain.date, locale) })}</p>
          <p className={styles.note}>{text.rainDifference}</p>
        </> : <p>{text.noComparison}</p>}
      </div>
    </div>
    <FaoScoreDetails province={province}/>
  </section>;
}
