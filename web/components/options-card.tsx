/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CloudSun, Droplets, Bug, Coins, RotateCcw, Sprout, type LucideIcon } from "lucide-react";
import { PlantingPanel, CropIdentity, CropSourceButton, PlantingPillars } from "@/components/planting-ui";
import { Stars } from "@/components/field-ui";
import { fiveOptions, monthNames, type CropAdvice, type CropId, type OptionKey, type PreviousCrop } from "@/lib/advisor";
import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation } from "@/lib/data";

const goalIcon: Record<OptionKey, LucideIcon> = { water: Droplets, market: Coins, pests: Bug, climate: CloudSun, keep: RotateCcw, other: Sprout };
const goalLabel: Record<OptionKey, string> = { water: "Menos agua", market: "Precio histórico", pests: "Plagas", climate: "Sequía", keep: "Seguir igual", other: "Otra opción" };

export function OptionsCard({ province, irrigation, previous, sowMonth, crops, supervisor = false, children }: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; crops: CropId[]; supervisor?: boolean; children?: ReactNode }) {
  const options = useMemo(() => fiveOptions({ province, irrigation, previous, sowMonth, crops }), [province, irrigation, previous, sowMonth, crops]);
  const grouped = options.filter((option, index) => !option.advice || options.findIndex(candidate => candidate.advice?.crop === option.advice?.crop) === index);
  const all = grouped.flatMap(option => option.advice ? [option.advice] : []);
  const [sources, setSources] = useState<CropAdvice | null>(null);
  return <PlantingPanel id="opciones" icon={Sprout} title="Otras opciones" className="options siembra-unified-card" help="Compara el mejor cultivo según lo que más te importe hoy: ahorrar agua, cuidar el precio, evitar plagas, resistir sequía o seguir igual.">
    {children && <div className="options-plan">{children}</div>}
    <ol className="option-list" data-count={grouped.length}>
      {grouped.map(o => {
        const Icon = goalIcon[o.key];
        const a = o.advice;
        const titles = a ? options.filter(option => option.advice?.crop === a.crop).map(option => goalLabel[option.key]) : [goalLabel[o.key]];
        return <li key={o.key} className={`option option-row-card ${o.key === "keep" ? "keep" : ""}`}>
          <div className="option-top-bar">
            <div className="option-goal-group">
              <span className={`option-icon-badge tone-${o.key}`} aria-hidden="true">
                <Icon className="option-icon" />
              </span>
              <div className="option-goal-copy">
                <strong className="option-goal">{titles.map((title, index) => <span key={title}>{index > 0 && <span aria-hidden="true"> · </span>}{title}</span>)}</strong>
                <small className="option-goal-sub">{o.goal}</small>
              </div>
            </div>
            {a && <div className="option-crop-card">
              <CropIdentity name={a.name} crop={a.crop} action={<CropSourceButton name={a.name} onClick={() => setSources(a)}/>}/>
              <div className="option-crop-rating"><Stars score={a.overall} size={17}/>{supervisor && a.overall !== null && <strong className="rating-numeric">{a.overall.toFixed(1)}</strong>}<span>{a.harvestMonth ? `Cosecha en ${monthNames[a.harvestMonth - 1]}` : "Cultivo permanente"}</span></div>
            </div>}
          </div>
          {a ? <>
            <PlantingPillars advice={a} showScores={supervisor}/>
            {a.warnings.length > 0 && <details className="visual-details crop-alerts option-warn-bar">
              <summary><AlertTriangle aria-hidden="true" size={14} /> Qué revisar ({a.warnings.length})</summary>
              <ul>{a.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
            </details>}
          </> : <details className="visual-details option-empty-bar"><summary>Sin datos suficientes</summary><p>{o.note}</p></details>}
        </li>;
      })}
    </ol>
    {sources && <SourcesSheet advice={sources} all={all} province={province} previous={previous} irrigation={irrigation} sowMonth={sowMonth} onClose={() => setSources(null)} />}
  </PlantingPanel>;
}
