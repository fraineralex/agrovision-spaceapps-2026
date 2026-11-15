/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CloudSun, Droplets, Bug, Coins, RotateCcw, Info, Sprout, type LucideIcon } from "lucide-react";
import { FarmIcon } from "@/components/farm-icon";
import { Stars } from "@/components/field-ui";
import { Fold } from "@/components/fold";
import { fiveOptions, lightFor, monthNames, type CropAdvice, type CropId, type OptionKey, type PreviousCrop } from "@/lib/advisor";
import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation } from "@/lib/data";

const goalIcon: Record<OptionKey, LucideIcon> = { water: Droplets, market: Coins, pests: Bug, climate: CloudSun, keep: RotateCcw, other: Sprout };
const pillars: { id: "water" | "climate" | "pests" | "market"; label: string }[] = [
  { id: "water", label: "Agua" },
  { id: "climate", label: "Sequía" },
  { id: "pests", label: "Plagas" },
  { id: "market", label: "Precio" },
];
const word: Record<string, string> = { green: "Bien", amber: "Regular", red: "Malo", gray: "Sin dato" };
const goalLabel: Record<OptionKey, string> = { water: "Menos agua", market: "Precio histórico", pests: "Plagas", climate: "Sequía", keep: "Seguir igual", other: "Otra opción" };

export function OptionsCard({ province, irrigation, previous, sowMonth, crops, children }: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; crops: CropId[]; children?: ReactNode }) {
  const options = useMemo(() => fiveOptions({ province, irrigation, previous, sowMonth, crops }), [province, irrigation, previous, sowMonth, crops]);
  const grouped = options.filter((option, index) => !option.advice || options.findIndex(candidate => candidate.advice?.crop === option.advice?.crop) === index);
  const all = grouped.flatMap(option => option.advice ? [option.advice] : []);
  const [sources, setSources] = useState<CropAdvice | null>(null);
  return <Fold id="opciones" icon="🌱" title="Otras opciones" className="options siembra-unified-card" help="Compara el mejor cultivo según lo que más te importe hoy: ahorrar agua, cuidar el precio, evitar plagas, resistir sequía o seguir igual.">
    <p className="options-subtitle">Escenarios por objetivo prioritario</p>
    <ol className="option-list">
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
              <span className="crop-medallion sm" aria-hidden="true"><FarmIcon name={a.crop} size={18} /></span>
              <span className="option-crop-copy">
                <strong>{a.name}</strong>
                {a.harvestMonth ? <small>Cosecha en {monthNames[a.harvestMonth - 1]}</small> : <small>Cultivo permanente</small>}
              </span>
              {a.overall !== null && <Stars score={a.overall} size={15} />}
              <button type="button" className="src-button icon-only" onClick={() => setSources(a)} aria-label={`Datos y fuentes de ${a.name}`} title="Datos y fuentes">
                <Info aria-hidden="true" size={16} />
              </button>
            </div>}
          </div>
          {a ? <>
            <ul className="option-pillars" aria-label={`Cómo sale ${a.name}`}>
              {pillars.map(({ id, label }) => {
                const c = lightFor(a.scores[id]);
                return (
                  <li key={id} className={`pill ${c}`} title={a.words[id]}>
                    <span className="pill-label"><FarmIcon name={id} size={14} />{label}</span>
                    <small className="pill-val">{word[c]}</small>
                  </li>
                );
              })}
            </ul>
            {a.warnings.length > 0 && <details className="visual-details crop-alerts option-warn-bar">
              <summary><AlertTriangle aria-hidden="true" size={14} /> Qué revisar ({a.warnings.length})</summary>
              <ul>{a.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
            </details>}
          </> : <details className="visual-details option-empty-bar"><summary>Sin datos suficientes</summary><p>{o.note}</p></details>}
        </li>;
      })}
    </ol>
    {children && <div className="options-plan">{children}</div>}
    {sources && <SourcesSheet advice={sources} all={all} province={province} previous={previous} irrigation={irrigation} sowMonth={sowMonth} onClose={() => setSources(null)} />}
  </Fold>;
}
