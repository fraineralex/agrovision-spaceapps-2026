/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14; SVG crop icons, radial gauge, pillar bars & animated timeline by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { AlertTriangle, CalendarDays, Info, MapPin, Sprout, TriangleAlert, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { adviseNextCrop, adviceSentence, previousCropName, lightFor, monthNames, type AdvicePriority, type CropAdvice, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";

import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation } from "@/lib/data";

const pillarInfo: { id: Pillar; label: string; icon: string }[] = [
  { id: "water", label: "Agua", icon: "water" }, { id: "climate", label: "Sequía", icon: "climate" },
  { id: "pests", label: "Plagas", icon: "pests" }, { id: "market", label: "Precio", icon: "market" },
];
const lightWord: Record<string, string> = { green: "Bien", amber: "Regular", red: "Malo", gray: "Sin dato" };
const irrigationWord: Record<Irrigation, string> = { irrigated: "con riego", rainfed: "sin riego", unconfirmed: "riego sin confirmar" };

function ScoreDial({ score, light }: { score: number; light: string }) {
  const pct = Math.max(0, Math.min(1, score / 5));
  const r = 24, c = 2 * Math.PI * r;
  return (
    <div className={`score-dial light-${light}`} role="img" aria-label={`Puntaje ${score.toFixed(1).replace(".", ",")} de 5: ${lightWord[light]}`}>
      <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true">
        <circle className="dial-track" cx="31" cy="31" r={r} />
        <circle
          className={`dial-arc ${light}`}
          cx="31"
          cy="31"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="dial-val">{score.toFixed(1).replace(".", ",")}</span>
    </div>
  );
}

function PillarBars({ a }: { a: CropAdvice }) {
  return (
    <div className="pillar-bars" aria-label="Indicadores por pilar">
      {pillarInfo.map(pi => {
        const s = a.scores[pi.id];
        const c = lightFor(s);
        const pct = s === null ? 14 : Math.max(20, Math.min(100, Math.round((s / 5) * 100)));
        return (
          <div key={pi.id} className={`pbar-item ${c} pillar-${pi.id}`} title={`${pi.label}: ${a.words[pi.id]}`}>
            <div className="pbar-head-row">
              <span className="pbar-label">
                <span className={`pbar-icon-chip tone-${pi.id}`} aria-hidden="true"><FarmIcon name={pi.icon} size={14} /></span>
                <span>{pi.label}</span>
              </span>
              <span className={`pbar-status-pill ${c}`}>{lightWord[c]}</span>
            </div>
            <div className="pbar-track" aria-hidden="true">
              <span className={`pbar-fill ${c}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="pbar-word">{a.words[pi.id]}</span>
          </div>
        );
      })}
    </div>
  );
}

type Props = {
  province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[];
  onEdit: () => void; onTop?: (crop: CropId) => void;
};

function MiniScoreRing({ score, light }: { score: number | null; light: string }) {
  const pct = score === null ? 0.15 : Math.max(0.12, Math.min(1, score / 5));
  const r = 14, c = 2 * Math.PI * r;
  return (
    <span className={`mini-score-ring light-${light}`} aria-hidden="true">
      <svg width="34" height="34" viewBox="0 0 34 34">
        <circle className="dial-track" cx="17" cy="17" r={r} strokeWidth="3.5" />
        <circle
          className={`dial-arc ${light}`}
          cx="17"
          cy="17"
          r={r}
          strokeWidth="3.5"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <small>{score !== null ? score.toFixed(1).replace(".", ",") : "—"}</small>
    </span>
  );
}

function CropRow({ a, top, onSources }: { a: CropAdvice; top: boolean; onSources: () => void }) {
  const rowLight = lightFor(a.overall);
  const pct = a.overall === null ? 12 : Math.max(15, Math.min(100, Math.round((a.overall / 5) * 100)));
  return <li className={top ? "crop-row top" : "crop-row"}>
    <div className="crop-row-head">
      <MiniScoreRing score={a.overall} light={rowLight} />
      <span className="crop-medallion sm" aria-hidden="true"><FarmIcon name={a.crop} size={18} /></span>
      <div className="crop-row-title">
        <strong>{a.name}</strong>
        <div className="crop-row-meter" aria-hidden="true">
          <span className={`crop-row-fill ${rowLight}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {top && a.overall !== null && <span className="badge">Top</span>}
      {!a.viable && <span className="badge gray">Sin riego</span>}
      <button type="button" className="src-button icon-only" onClick={onSources} aria-label={`Datos y fuentes de ${a.name}`} title="Datos y fuentes">
        <Info aria-hidden="true" size={16} />
      </button>
    </div>
    <div className="pillar-row">{pillarInfo.map(pi => { const c = lightFor(a.scores[pi.id]); return <span key={pi.id} className={`pillar-chip ${c}`} title={`${pi.label}: ${a.words[pi.id]}`}>
      <FarmIcon name={pi.icon} size={13} /><span>{pi.label}</span></span>; })}</div>
    {a.pestPrecautions.length > 0 && <details className="visual-details crop-row-alert"><summary><AlertTriangle aria-hidden="true" size={13} /> Precaución ({a.pestPrecautions.length})</summary>{a.pestPrecautions.map(note => <p key={note} className="warning"><span>{note}</span></p>)}</details>}
  </li>;
}

export function AdvisorCard(p: Props) {
  const [sources, setSources] = useState<CropAdvice | null>(null);
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = advice[0];
  const sentence = adviceSentence(top, p.previous);
  const notes = [...(top?.warnings ?? []), ...(top?.pestPrecautions ?? [])];
  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(`${sentence} ${notes.join(" ")} Revisa siempre con tu técnico.`);
      u.lang = "es-DO"; speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch { /* Speech is optional. */ }
  };
  const light = lightFor(top?.overall ?? null);
  const greenCount = advice.filter(a => lightFor(a.overall) === "green").length;
  const amberCount = advice.filter(a => lightFor(a.overall) === "amber").length;
  const otherCount = Math.max(0, advice.length - greenCount - amberCount);
  const totalCrops = Math.max(1, advice.length);

  return <section className="card advisor" aria-label="Qué sembrar ahora" aria-live="polite">
    <div className="profile-line">
      <span><MapPin aria-hidden="true" size={16} /> {p.province ?? "Sin provincia"} · {irrigationWord[p.irrigation]}</span>
      <button type="button" className="ob-link" onClick={p.onEdit}>Cambiar</button>
    </div>

    <div className={`verdict visual-verdict ${light}`}>
      {top && top.overall !== null ? <>
        <div className="verdict-hero-top">
          <div className="crop-feature">
            <span className="verdict-crop-badge" aria-hidden="true"><FarmIcon name={top.crop} size={28} /></span>
            <div className="crop-feature-copy">
              <span className="verdict-eyebrow">Opción para considerar</span>
              <p className="verdict-text">{top.name}</p>
              {p.previous !== "unknown" && <small className="verdict-prev-pill">Después de {previousCropName(p.previous).toLowerCase()}</small>}
            </div>
          </div>
          <div className="advisor-score-wrap">
            <ScoreDial score={top.overall} light={light} />
            <span className={`advisor-score light-${light}`}>{top.overall.toFixed(1).replace(".", ",")} / 5 · {lightWord[light]}</span>
          </div>
        </div>
        {top.harvestMonth > 0 && <div className="crop-timeline">
          <div><Sprout aria-hidden="true" size={17}/><span><small>Siembra evaluada</small><strong>{monthNames[p.sowMonth - 1]}</strong></span></div>
          <div><Wheat aria-hidden="true" size={17}/><span><small>Cosecha aprox.</small><strong>{monthNames[top.harvestMonth - 1]} · ~{Math.round(top.cycleDays / 30)} m</strong></span></div>
        </div>}
        <PillarBars a={top} />
      </> : <p className="verdict-text">{sentence}</p>}
      <div className="verdict-actions">
        <button type="button" className="listen" onClick={speak}><FarmIcon name="sound" size={18} /> Escuchar</button>
        {top && <button type="button" className="src-button" onClick={() => setSources(top)}><Info aria-hidden="true" size={17} /> Datos y fuentes</button>}
        {notes.length > 0 && <details className="visual-details crop-alerts"><summary><TriangleAlert aria-hidden="true" size={16}/> Qué revisar ({notes.length})</summary><ul>{notes.map(w => <li key={w}>{w}</li>)}</ul></details>}
      </div>
    </div>

    <details className="compare-fold" open>
      <summary>
        <span><CalendarDays aria-hidden="true"/> Todos los cultivos ({advice.length})</span>
        <span className="crops-dist-pills" aria-hidden="true">
          {greenCount > 0 && <i className="cd-pill green">{greenCount} Bien</i>}
          {amberCount > 0 && <i className="cd-pill amber">{amberCount} Regular</i>}
          {otherCount > 0 && <i className="cd-pill gray">{otherCount} Revisar</i>}
        </span>
      </summary>
      <div className="crops-dist-bar" aria-hidden="true">
        {greenCount > 0 && <span className="cd-seg green" style={{ width: `${(greenCount / totalCrops) * 100}%` }} />}
        {amberCount > 0 && <span className="cd-seg amber" style={{ width: `${(amberCount / totalCrops) * 100}%` }} />}
        {otherCount > 0 && <span className="cd-seg gray" style={{ width: `${(otherCount / totalCrops) * 100}%` }} />}
      </div>
      <ul className="crop-list" aria-label="Comparación de cultivos">{advice.map(a => <CropRow key={a.crop} a={a} top={a === top} onSources={() => setSources(a)} />)}</ul>
    </details>

    {sources && <SourcesSheet advice={sources} all={advice} province={p.province} previous={p.previous} irrigation={p.irrigation} sowMonth={p.sowMonth} onClose={() => setSources(null)} />}

  </section>;
}
