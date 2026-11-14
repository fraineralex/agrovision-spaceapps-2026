/* AI: Claude (Anthropic), 2026-11-14 — compare five options: best crop per goal plus keeping the current crop. Frainer review pending. See AI_USAGE.md. */
"use client";
import type { WeatherSignal } from "@/lib/climate-advice";
import { useMemo, useState } from "react";
import { CloudSun, Droplets, Bug, Coins, RotateCcw, Info, type LucideIcon } from "lucide-react";
import { cropEmoji, fiveOptions, lightFor, monthNames, type CropAdvice, type CropId, type OptionKey, type Pillar, type PreviousCrop } from "@/lib/advisor";
import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation } from "@/lib/data";

const goalIcon: Record<OptionKey, LucideIcon> = { water: Droplets, market: Coins, pests: Bug, climate: CloudSun, keep: RotateCcw };
const pillars: { id: Pillar; label: string; Icon: LucideIcon }[] = [{ id: "water", label: "Agua", Icon: Droplets }, { id: "climate", label: "Sequía", Icon: CloudSun }, { id: "pests", label: "Plagas", Icon: Bug }, { id: "market", label: "Precio", Icon: Coins }];
const word: Record<string, string> = { green: "Bien", amber: "Regular", red: "Malo", gray: "Sin dato" };

export function OptionsCard({ province, irrigation, previous, sowMonth, crops, weather }: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; crops: CropId[]; weather?: WeatherSignal }) {
  const options = useMemo(() => fiveOptions({ province, irrigation, previous, sowMonth, crops, weather }), [province, irrigation, previous, sowMonth, crops, weather]);
  const all = options.map(o => o.advice).filter((a): a is CropAdvice => !!a);
  const [sources, setSources] = useState<CropAdvice | null>(null);
  return <section className="card panel options" aria-labelledby="opciones-titulo">
    <h2 id="opciones-titulo" className="panel-title">Compara 5 opciones</h2>
    <p className="panel-intro">Lo mejor según lo que más te importa, y cómo te iría si sigues igual.</p>
    <ol className="option-list">
      {options.map(o => { const Icon = goalIcon[o.key]; const a = o.advice; const light = lightFor(a?.overall ?? null); return <li key={o.key} className={`option ${o.key === "keep" ? "keep" : ""}`}>
        <div className="option-head">
          <Icon aria-hidden="true" className="option-icon" />
          <span className="option-goal">{o.goal}</span>
          <span className={`option-light ${light}`}><i aria-hidden="true" />{word[light]}</span>
        </div>
        {a ? <>
          <p className="option-crop"><span aria-hidden="true">{cropEmoji[a.crop]}</span> {a.name}{a.harvestMonth ? <small> · cosecha en {monthNames[a.harvestMonth - 1]}</small> : <small> · cultivo permanente</small>}</p>
          <ul className="option-pillars" aria-label={`Cómo sale ${a.name}`}>{pillars.map(({ id, label, Icon: P }) => { const c = lightFor(a.scores[id]); return <li key={id} className={`pill ${c}`}><P aria-hidden="true" /><span className="sr-only">{label}: </span>{a.words[id]}</li>; })}</ul>
          {a.warnings[0] && <p className="option-warn">{a.warnings[0]}</p>}
          {a.viable && a.pestPrecautions.length > 0 && <ul className="option-warn" aria-label="Precauciones de plagas">
            {a.pestPrecautions.map(note => <li key={note}>{note}</li>)}
          </ul>}
          <button type="button" className="link-button" onClick={() => setSources(a)}><Info aria-hidden="true" /> ¿De dónde sale esto?</button>
        </> : <p className="option-crop muted">{o.note ?? "Sin datos para esta opción."}</p>}
      </li>; })}
    </ol>
    {sources && <SourcesSheet advice={sources} all={all} province={province} previous={previous} irrigation={irrigation} sowMonth={sowMonth} onClose={() => setSources(null)} />}
  </section>;
}
