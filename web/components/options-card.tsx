/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo, useState } from "react";
import { CloudSun, Droplets, Bug, Coins, RotateCcw, Info, Sprout, type LucideIcon } from "lucide-react";
import { FarmIcon } from "@/components/farm-icon";
import { HelpTip } from "@/components/help-tip";
import { Stars } from "@/components/field-ui";
import { fiveOptions, lightFor, monthNames, pillarTitle, type CropAdvice, type CropId, type OptionKey, type Pillar, type PreviousCrop } from "@/lib/advisor";
import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation } from "@/lib/data";

const goalIcon: Record<OptionKey, LucideIcon> = { water: Droplets, market: Coins, pests: Bug, climate: CloudSun, keep: RotateCcw, other: Sprout };
const pillars: { id: Pillar; label: string; Icon: LucideIcon }[] = [{ id: "water", label: "Agua", Icon: Droplets }, { id: "climate", label: "Sequía", Icon: CloudSun }, { id: "pests", label: "Plagas", Icon: Bug }, { id: "market", label: "Precio", Icon: Coins }];
const word: Record<string, string> = { green: "Conviene", amber: "Puede servir", red: "No conviene", gray: "Falta información" };
const goalLabel: Record<OptionKey, string> = { water: "Menos agua", market: "Precio histórico", pests: "Plagas", climate: "Sequía", other: "Otra opción", keep: "Seguir igual" };

export function OptionsCard({ province, irrigation, previous, sowMonth, crops }: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; crops: CropId[] }) {
  const options = useMemo(() => fiveOptions({ province, irrigation, previous, sowMonth, crops }), [province, irrigation, previous, sowMonth, crops]);
  const grouped = options.filter((option, index) => !option.advice || options.findIndex(candidate => candidate.advice?.crop === option.advice?.crop) === index);
  const all = grouped.flatMap(option => option.advice ? [option.advice] : []);
  const [sources, setSources] = useState<CropAdvice | null>(null);
  return <section className="card panel options siembra-unified-card" aria-labelledby="opciones-titulo">
    <div className="panel-head-row">
      <h2 id="opciones-titulo" className="panel-title">Otras opciones</h2>
      <HelpTip label="Otras opciones" text="Compara el mejor cultivo según lo que más te importe hoy: ahorrar agua, cuidar el precio, evitar plagas, resistir sequía o seguir igual." />
    </div>
    <p className="options-subtitle">Escenarios por objetivo prioritario</p>
    <ol className="option-list">
      {grouped.map(o => { const Icon = goalIcon[o.key]; const a = o.advice; const light = a && o.key === "keep" && a.soil.level === "bad" ? "amber" : lightFor((a && (o.key === "keep" || o.key === "other" ? a.overall : a.scores[o.key])) ?? null); return <li key={o.key} className={`option ${o.key === "keep" ? "keep" : ""}`}>
        <div className="option-head">
          <span className={`option-icon-badge tone-${o.key}`} aria-hidden="true">
            <Icon className="option-icon" />
          </span>
          <span className="option-goal" title={o.goal}>{a ? options.filter(option => option.advice?.crop === a.crop).map(option => goalLabel[option.key]).join(" · ") : goalLabel[o.key]}</span>
          {a && <span className={`option-light ${light}`}><i aria-hidden="true" />{o.key === "keep" && a.soil.level === "bad" ? "Cansa la tierra" : o.key === "keep" || o.key === "other" ? word[light] : pillarTitle(o.key as Pillar, a.scores[o.key as Pillar])}</span>}
        </div>
        {a ? <>
          <div className="option-crop-row">
            <p className="option-crop">
              <span className="crop-medallion sm" aria-hidden="true"><FarmIcon name={a.crop} size={18} /></span>
              <span className="option-crop-copy">
                <strong>{a.name}</strong>
                {a.harvestMonth ? <small>Cosecha en {monthNames[a.harvestMonth - 1]}</small> : <small>Cultivo permanente</small>}
              </span>
            </p>
            {a.overall !== null && <Stars score={a.overall} size={15} />}
          </div>
          <ul className="option-pillars" aria-label={`Cómo sale ${a.name}`}>
            {pillars.map(({ id, label, Icon: P }) => {
              const c = lightFor(a.scores[id]);
              return (
                <li key={id} className={`pill ${c}`} title={a.words[id]}>
                  <span className="pill-label"><P aria-hidden="true" />{label}</span>
                  <small className="pill-val">{pillarTitle(id, a.scores[id])}</small>
                </li>
              );
            })}
          </ul>
          <div className="option-foot">
            {a.warnings.length > 0 && <details className="visual-details crop-alerts"><summary>Qué revisar ({a.warnings.length})</summary><ul>{a.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></details>}
            <button type="button" className="link-button" onClick={() => setSources(a)}><Info aria-hidden="true" /> ¿Por qué?</button>
          </div>
        </> : <details className="visual-details"><summary>Sin datos suficientes</summary><p>{o.note}</p></details>}
      </li>; })}
    </ol>
    {sources && <SourcesSheet advice={sources} all={all} province={province} previous={previous} irrigation={irrigation} sowMonth={sowMonth} onClose={() => setSources(null)} />}
  </section>;
}
