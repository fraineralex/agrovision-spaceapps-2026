/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { optionsMessages } from "@/lib/i18n/options-messages";
import { cropLabel, localizedPillarTitle, localizedPillarWord, localizedWarnings, monthLabel } from "@/lib/i18n/advice";
import { AlertTriangle, CloudSun, Droplets, Bug, Coins, RotateCcw, Info, Sprout, type LucideIcon } from "lucide-react";
import { FarmIcon } from "@/components/farm-icon";
import { Stars } from "@/components/field-ui";
import { Fold } from "@/components/fold";
import { allCrops, fiveOptions, type CropAdvice, type CropId, type OptionKey, type PreviousCrop } from "@/lib/advisor";
import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation } from "@/lib/data";

const goalIcon: Record<OptionKey, LucideIcon> = { water: Droplets, market: Coins, pests: Bug, climate: CloudSun, keep: RotateCcw, other: Sprout };
const pillars: { id: "water" | "climate" | "pests" | "market"; label: string }[] = [
  { id: "water", label: "Agua" },
  { id: "climate", label: "Sequía" },
  { id: "pests", label: "Plagas" },
  { id: "market", label: "Precio" },
];
export function OptionsCard({ province, irrigation, previous, sowMonth, crops, children }: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; crops: CropId[]; children?: ReactNode }) {
  const locale = useLocale();
  const text = optionsMessages[locale];
  const advisor = messages[locale].advisor;
  const goalTitle = (key: OptionKey) => key === "other" ? text.other : key === "keep" ? (allCrops.includes(previous as CropId) ? text.keepCrop.replace("{crop}", cropLabel(previous, locale).toLowerCase()) : text.keepUnknown) : text[`${key}Goal`];
  const options = useMemo(() => fiveOptions({ province, irrigation, previous, sowMonth, crops }), [province, irrigation, previous, sowMonth, crops]);
  const grouped = options.filter((option, index) => !option.advice || options.findIndex(candidate => candidate.advice?.crop === option.advice?.crop) === index);
  const all = grouped.flatMap(option => option.advice ? [option.advice] : []);
  const [sources, setSources] = useState<CropAdvice | null>(null);
  return <Fold id="opciones" icon="🌱" title={text.heading} className="options siembra-unified-card" help={text.help}>
    <p className="options-subtitle">{locale === "es" ? "Escenarios por objetivo prioritario" : "Scenarios by priority"}</p>
    <ol className="option-list">
      {grouped.map(o => {
        const Icon = goalIcon[o.key];
        const a = o.advice;
        const titles = a ? options.filter(option => option.advice?.crop === a.crop).map(option => text[option.key]) : [text[o.key]];
        return <li key={o.key} className={`option option-row-card ${o.key === "keep" ? "keep" : ""}`}>
          <div className="option-top-bar">
            <div className="option-goal-group">
              <span className={`option-icon-badge tone-${o.key}`} aria-hidden="true">
                <Icon className="option-icon" />
              </span>
              <div className="option-goal-copy">
                <strong className="option-goal">{titles.map((title, index) => <span key={title}>{index > 0 && <span aria-hidden="true"> · </span>}{title}</span>)}</strong>
                <small className="option-goal-sub">{goalTitle(o.key)}</small>
              </div>
            </div>
            {a && <div className="option-crop-card">
              <span className="crop-medallion sm" aria-hidden="true"><FarmIcon name={a.crop} size={18} /></span>
              <span className="option-crop-copy">
                <strong>{cropLabel(a.crop, locale)}</strong>
                {a.harvestMonth ? <small>{text.harvest.replace("{month}", monthLabel(a.harvestMonth, locale))}</small> : <small>{text.permanent}</small>}
              </span>
              {a.overall !== null && <Stars score={a.overall} size={15} />}
              <button type="button" className="src-button icon-only" onClick={() => setSources(a)} aria-label={messages[locale].advisor.whyCrop.replace("{crop}",cropLabel(a.crop,locale))} title={messages[locale].advisor.explanation}>
                <Info aria-hidden="true" size={16} />
              </button>
            </div>}
          </div>
          {a ? <>
            <ul className="option-pillars" aria-label={text.compare.replace("{crop}",cropLabel(a.crop,locale))}>
              {pillars.map(({ id }) => {
                const c = a.lights[id];
                return (
                  <li key={id} className={`pill ${c}`} title={localizedPillarWord(a,id,locale)}>
                    <span className="pill-label"><FarmIcon name={id} size={14} />{advisor[id]}</span>
                    <small className="pill-val">{localizedPillarTitle(id,a.scores[id],locale)}</small>
                  </li>
                );
              })}
            </ul>
            {a.warnings.length > 0 && <details className="visual-details crop-alerts option-warn-bar">
              <summary><AlertTriangle aria-hidden="true" size={14} /> {text.review.replace("{count}",String(a.warnings.length))}</summary>
              <ul>{localizedWarnings(a,locale).map(warning => <li key={warning}>{warning}</li>)}</ul>
            </details>}
          </> : <details className="visual-details option-empty-bar"><summary>{text.noData}</summary><p>{o.key === "pests" ? text.pestEvidence : o.key === "keep" ? (previous === "unknown" || previous === "otro" ? text.previousUnknown : text.cropUnavailable) : text.criterionData}</p></details>}
        </li>;
      })}
    </ol>
    {children && <div className="options-plan">{children}</div>}
    {sources && <SourcesSheet advice={sources} all={all} province={province} previous={previous} irrigation={irrigation} sowMonth={sowMonth} onClose={() => setSources(null)} />}
  </Fold>;
}
