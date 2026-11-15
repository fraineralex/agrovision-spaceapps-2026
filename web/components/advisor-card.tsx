/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14; SVG crop icons, radial gauge, pillar bars & animated timeline by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { AlertTriangle, CalendarDays, Info, MapPin, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { HeroRecommendation, MetricTile, RiskPill, ScoreRing, SourceChip, WaterGauge } from "@/components/field-ui";
import { FarmIcon } from "@/components/farm-icon";
import { adviseNextCrop, adviceSentence, cropNames, previousCropName, lightFor, monthNames, recommendedCrop, type AdvicePriority, type CropAdvice, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";

import { SourcesSheet } from "@/components/sources-sheet";
import { climate, type Irrigation } from "@/lib/data";
import { useReadAloud } from "@/lib/use-read-aloud";
import { profitFor } from "@/lib/profit";

const pillarInfo: { id: Pillar; label: string; icon: string }[] = [
  { id: "water", label: "Agua", icon: "water" }, { id: "climate", label: "Sequía", icon: "climate" },
  { id: "pests", label: "Plagas", icon: "pests" }, { id: "market", label: "Precio", icon: "market" },
];
const lightWord: Record<string, string> = { green: "Bien", amber: "Regular", red: "Malo", gray: "Sin dato" };
const irrigationWord: Record<Irrigation, string> = { irrigated: "con riego", rainfed: "sin riego", unconfirmed: "riego sin confirmar" };

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
      {top && a.overall !== null && <span className="badge">Recomendado</span>}
      {!a.viable && <span className="badge gray">Sin riego</span>}
      <button type="button" className="src-button icon-only" onClick={onSources} aria-label={`Datos y fuentes de ${a.name}`} title="Datos y fuentes">
        <Info aria-hidden="true" size={16} />
      </button>
    </div>
    <div className="pillar-row">{pillarInfo.map(pi => { const c = lightFor(a.scores[pi.id]); return <span key={pi.id} className={`pillar-chip ${c}`} title={`${pi.label}: ${a.words[pi.id]}`}>
      <FarmIcon name={pi.icon} size={13} /><span>{pi.label}</span></span>; })}</div>
    {(a.pestPrecautions.length > 0 || a.repeats) && <details className="visual-details crop-row-alert"><summary><AlertTriangle aria-hidden="true" size={13} /> Precauciones</summary>{a.repeats && <p className="warning">Repetir {a.name.toLowerCase()} puede mantener plagas.</p>}{a.pestPrecautions.map(note => <p key={note} className="warning"><span>{note}</span></p>)}</details>}
  </li>;
}

export function AdvisorCard(p: Props) {
  const [sources, setSources] = useState<CropAdvice | null>(null);
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const repeat = advice.find(item => item.repeats);
  const historical = top ? profitFor(top.crop, 1, p.irrigation) : null;
  const loss = historical && !("unavailable" in historical) && historical.profit.mid < 0;
  const now = new Date();
  const sowYear = now.getFullYear() + Number(p.sowMonth <= now.getMonth());
  const harvestYear = top ? sowYear + Math.floor((p.sowMonth - 1 + Math.round(top.cycleDays / 30)) / 12) : sowYear;
  const sentence = adviceSentence(top, p.previous);
  const reason = top?.scores.pests === 5 ? "IDIAF respalda rotar habichuela con maíz." : top?.words.water + " en la comparación.";
  const notes = [...(top?.warnings ?? []), ...(top?.pestPrecautions ?? [])];
  const summary = [sentence, ...notes, "Confirma el agua disponible con tu técnico."].join(" ");
  const { reading, read, stop } = useReadAloud();
  const light = lightFor(top?.overall ?? null);
  return <section className="card advisor" aria-label="Qué sembrar ahora" aria-live="polite">
    <div className="profile-line">
      <span><MapPin aria-hidden="true" size={18} /> {p.province ?? "Sin provincia"} · {irrigationWord[p.irrigation]}</span>
      <button type="button" className="ob-link" onClick={p.onEdit}>Cambiar</button>
    </div>
    <HeroRecommendation tone={"tone-" + light} actions={<>
      <button type="button" className="listen" onClick={() => read(summary)}><FarmIcon name="sound" size={18} /> Oír resumen</button>
      {top && <button type="button" className="src-button" onClick={() => setSources(top)}><Info aria-hidden="true" size={18} /> Datos y fuentes</button>}
    </>}>
      {top && top.overall !== null ? <>
        <div className="recommendation-heading">
          <div>
            <span className="recommendation-caption">Mejor puntaje</span>
            <h2>{top.name}</h2>
            {p.previous !== "unknown" && <p className="previous-crop">Después de {previousCropName(p.previous).toLowerCase()}</p>}
          </div>
          <span className="crop-illustration" aria-hidden="true"><FarmIcon name={top.crop} size={60} /></span>
          <div className="recommendation-score">
            <ScoreRing score={top.overall} label="Puntaje comparativo" />
            <span>{lightWord[light]}</span>
          </div>
        </div>
        <p className="advisor-reason">{reason}</p>
        <div className="recommendation-meta">
          <span><Wheat aria-hidden="true" size={17} /> <strong>{monthNames[top.harvestMonth - 1]} {harvestYear}</strong><small>Cosecha aprox.</small></span>
          <SourceChip href={climate.source.url}>NASA POWER</SourceChip>
        </div>
        <RiskPill>{loss ? "Posible pérdida al precio mayorista" : notes[0]?.split(". ")[0] || "Confirma el agua y suelo"}</RiskPill>
      </> : <p>{sentence}{repeat ? " Evita repetir el cultivo si hay antecedentes de plagas." : ""}</p>}
    </HeroRecommendation>
    {top && <div className="metric-tiles" role="group" aria-label="Indicadores por pilar">
      {pillarInfo.map(({ id, label, icon }) => <MetricTile key={id} label={label}
        icon={<FarmIcon name={icon} size={18} />} tone={"metric-" + id}
        value={lightWord[lightFor(top.scores[id])]} detail={top.words[id]}>
        {id === "water" && <WaterGauge value={top.scores.water} />}
      </MetricTile>)}
    </div>}
    {reading && <div className="decision-reading"><p role="status">{reading.status}</p><p>{reading.text}</p>{reading.status === "Leyendo resumen…" && <button type="button" className="src-button" onClick={stop}>Detener lectura</button>}</div>}
    {top && <details className="compare-fold"><summary>Qué revisar antes de sembrar</summary>
      <p>Revisa agua y suelo con tu técnico.</p>
      <ul className="decision-risks">
        {loss && <li><strong>Pérdida</strong> al último precio mayorista.</li>}
        {notes.map(note => <li key={note}>{note}</li>)}
        {repeat && <li>Riesgo de plagas si repites {repeat.name.toLowerCase()}.</li>}
      </ul>
      <p className="note">NASA POWER / MERRA-2 · 2016–2025 · ~50 km · San Juan. Sequía del puntaje: FAO GIEWS.</p>
    </details>}

    <details className="compare-fold"><summary><CalendarDays aria-hidden="true"/> Todos los cultivos ({p.crops.length})</summary>
      <ul className="crop-list" aria-label="Comparación de cultivos">{advice.map(a => <CropRow key={a.crop} a={a} top={a === top} onSources={() => setSources(a)} />)}{p.crops.filter(crop => !advice.some(item => item.crop === crop)).map(crop => <li key={crop}>{cropNames[crop]} · sin datos todavía</li>)}</ul>
    </details>

    {sources && <SourcesSheet advice={sources} all={advice} province={p.province} previous={p.previous} irrigation={p.irrigation} sowMonth={p.sowMonth} onClose={() => setSources(null)} />}

  </section>;
}
