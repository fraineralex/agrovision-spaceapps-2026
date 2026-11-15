/* AI: Claude (Anthropic) & Codex (OpenAI), 2026-11-14; UI/i18n polish: Antigravity, 2026-11-15. */
"use client";
import { useMemo, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/client";
import { optionsMessages } from "@/lib/i18n/options-messages";
import { cropLabel, localizedWarnings, monthLabel } from "@/lib/i18n/advice";
import { AlertTriangle, CloudSun, Droplets, Bug, Coins, RotateCcw, Sprout, type LucideIcon } from "lucide-react";
import { PlantingPanel, CropIdentity, CropSourceButton, PlantingPillars } from "@/components/planting-ui";
import { Stars } from "@/components/field-ui";
import { allCrops, fiveOptions, type CropAdvice, type CropId, type OptionKey, type PreviousCrop } from "@/lib/advisor";
import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation } from "@/lib/data";

const goalIcon: Record<OptionKey, LucideIcon> = { water: Droplets, market: Coins, pests: Bug, climate: CloudSun, keep: RotateCcw, other: Sprout };

export function OptionsCard({ province, irrigation, previous, sowMonth, crops, supervisor = false, children }: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; crops: CropId[]; supervisor?: boolean; children?: ReactNode }) {
  const locale = useLocale();
  const text = optionsMessages[locale];
  const goalTitle = (key: OptionKey) => key === "other" ? text.other : key === "keep" ? (allCrops.includes(previous as CropId) ? text.keepCrop.replace("{crop}", cropLabel(previous, locale).toLowerCase()) : text.keepUnknown) : text[`${key}Goal`];
  const options = useMemo(() => fiveOptions({ province, irrigation, previous, sowMonth, crops }), [province, irrigation, previous, sowMonth, crops]);
  const grouped = options.filter((option, index) => !option.advice || options.findIndex(candidate => candidate.advice?.crop === option.advice?.crop) === index);
  const all = grouped.flatMap(option => option.advice ? [option.advice] : []);
  const [sources, setSources] = useState<CropAdvice | null>(null);
  return <PlantingPanel id="opciones" icon={Sprout} title={text.heading} className="options siembra-unified-card" help={text.help}>
    {children && <div className="options-plan">{children}</div>}
    <ol className="option-list" data-count={grouped.length}>
      {grouped.map(o => {
        const Icon = goalIcon[o.key];
        const a = o.advice;
        const titles = a ? options.filter(option => option.advice?.crop === a.crop).map(option => text[option.key]) : [text[o.key]];
        const name = a ? cropLabel(a.crop, locale) : "";
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
              <CropIdentity name={name} crop={a.crop} action={<CropSourceButton name={name} onClick={() => setSources(a)}/>}/>
              <div className="option-crop-rating"><Stars score={a.overall} size={17}/>{supervisor && a.overall !== null && <strong className="rating-numeric">{a.overall.toFixed(1)}</strong>}<span>{a.harvestMonth ? text.harvest.replace("{month}", monthLabel(a.harvestMonth, locale)) : text.permanent}</span></div>
            </div>}
          </div>
          {a ? <>
            <PlantingPillars advice={a} showScores={supervisor}/>
            {a.warnings.length > 0 && <details className="visual-details crop-alerts option-warn-bar">
              <summary><AlertTriangle aria-hidden="true" size={14} /> {text.review.replace("{count}", String(a.warnings.length))}</summary>
              <ul>{localizedWarnings(a, locale).map(warning => <li key={warning}>{warning}</li>)}</ul>
            </details>}
          </> : <details className="visual-details option-empty-bar"><summary>{text.noData}</summary><p>{o.key === "pests" ? text.pestEvidence : o.key === "keep" ? (previous === "unknown" || previous === "otro" ? text.previousUnknown : text.cropUnavailable) : text.criterionData}</p></details>}
        </li>;
      })}
    </ol>
    {sources && <SourcesSheet advice={sources} all={all} province={province} previous={previous} irrigation={irrigation} sowMonth={sowMonth} onClose={() => setSources(null)} />}
  </PlantingPanel>;
}
