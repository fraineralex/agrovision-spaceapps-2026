/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14; SVG crop icons, radial gauge, pillar bars & animated timeline by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { AlertTriangle, CalendarDays, Info, MapPin, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { HeroRecommendation, MetricTile, RiskPill, SourceChip, Stars, WaterGauge } from "@/components/field-ui";
import { FarmIcon } from "@/components/farm-icon";
import { CustomSelect } from "@/components/custom-select";
import { adviseNextCrop, adviceSentence, cropNames, previousCropName, lightFor, monthNames, recommendedCrop, type AdvicePriority, type CropAdvice, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";

import { SourcesSheet } from "@/components/sources-sheet";
import { climate, type Irrigation } from "@/lib/data";
import { useReadAloud } from "@/lib/use-read-aloud";
import { profitFor } from "@/lib/profit";

const pillarInfo: { id: Pillar; label: string; icon: string }[] = [
  { id: "water", label: "Agua", icon: "water" }, { id: "climate", label: "Sequía", icon: "climate" },
  { id: "pests", label: "Plagas", icon: "pests" }, { id: "market", label: "Precio", icon: "market" },
];
const lightWord: Record<string, string> = { green: "Conviene", amber: "Puede servir", red: "No conviene", gray: "Falta información" };
const irrigationWord: Record<Irrigation, string> = { irrigated: "con riego", rainfed: "sin riego", unconfirmed: "riego sin confirmar" };

type Props = {
  province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[];
  onEdit: () => void; onTop?: (crop: CropId) => void; onSowMonth?: (month: number) => void;
};

function CropRow({ a, top, onSources }: { a: CropAdvice; top: boolean; onSources: () => void }) {
  const rowLight = lightFor(a.overall);
  const pct = a.overall === null ? 12 : Math.max(15, Math.min(100, Math.round((a.overall / 5) * 100)));
  const alertCount = a.pestPrecautions.length + (a.repeats ? 1 : 0);
  return <li className={top ? "crop-row top" : "crop-row"}>
    <div className="crop-row-head">
      <span className="crop-medallion sm" aria-hidden="true"><FarmIcon name={a.crop} size={18} /></span>
      <div className="crop-row-title">
        <strong>{a.name}</strong>
      </div>
      {top && a.overall !== null && <span className="badge top-badge">Top</span>}
      {!a.viable && <span className="badge gray">Sin riego</span>}
      <button type="button" className="src-button icon-only" onClick={onSources} aria-label={`Por qué ${a.name}: explicación y fuentes`} title="Explicación y fuentes">
        <Info aria-hidden="true" size={16} />
      </button>
    </div>
    <div className="crop-row-rating"><Stars score={a.overall} size={19} /><div className="crop-row-meter" aria-hidden="true"><span className={`crop-row-fill ${rowLight}`} style={{ width: `${pct}%` }} /></div></div>
    <div className="pillar-row">{pillarInfo.map(pi => { const c = lightFor(a.scores[pi.id]); return <span key={pi.id} className={`pillar-chip ${c}`} title={`${pi.label}: ${a.words[pi.id]}`}>
      <FarmIcon name={pi.icon} size={13} /><span>{pi.label}</span></span>; })}</div>
    {alertCount > 0 && <details className="visual-details crop-row-alert"><summary><AlertTriangle aria-hidden="true" size={13} /> Precaución ({alertCount})</summary>{a.repeats && <p className="warning">Repetir {a.name.toLowerCase()} puede mantener plagas.</p>}{a.pestPrecautions.map(note => <p key={note} className="warning"><span>{note}</span></p>)}</details>}
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
  const reason = top?.soil.level === "good" ? `Para tu tierra: ${top.soil.title.toLowerCase()}.` : top?.scores.pests === 5 ? "El IDIAF recomienda maíz tras habichuela." : (top?.scores.water ?? 0) >= 3.34 ? "Pide menos agua que tus otros cultivos." : "El que mejor sale en tu lista.";
  const notes = [...(top?.warnings ?? []), ...(top?.pestPrecautions ?? [])];
  const summary = [sentence, ...notes, "Confirma el agua disponible con tu técnico."].join(" ");
  const { reading, read, stop } = useReadAloud();
  const light = lightFor(top?.overall ?? null);
  const greenCount = advice.filter(a => lightFor(a.overall) === "green").length;
  const amberCount = advice.filter(a => lightFor(a.overall) === "amber").length;
  const redCount = advice.filter(a => lightFor(a.overall) === "red").length;
  return <section className="card advisor planting-overview" aria-label="Qué sembrar ahora" aria-live="polite">
    <div className="profile-line">
      <span className="profile-loc"><MapPin aria-hidden="true" size={18} /> {p.province ?? "Sin provincia"} · {irrigationWord[p.irrigation]}</span>
      <div className="profile-actions">
        {p.onSowMonth && (
          <div className="inline-month-pick">
            <span>Mes</span>
            <CustomSelect ariaLabel="Mes evaluado" value={String(p.sowMonth)} options={monthNames.map((m, idx) => ({ value: String(idx + 1), label: m }))} onChange={val => p.onSowMonth?.(Number(val))} />

          </div>

        )}
        <button type="button" className="ob-link" onClick={p.onEdit}>Cambiar</button>
      </div>
    </div>
    <HeroRecommendation tone={"tone-" + light} actions={<>
      <button type="button" className="listen" onClick={() => void read(summary)}><FarmIcon name="sound" size={18} /> Oír resumen</button>
      {top && <button type="button" className="src-button" onClick={() => setSources(top)}><Info aria-hidden="true" size={18} /> ¿Por qué este cultivo?</button>}
    </>}>
      {top && top.overall !== null ? <>
        <div className="recommendation-heading">
          <div>
            <span className="recommendation-caption">Te conviene sembrar</span>
            <h2>{top.name}</h2>
            {p.previous !== "unknown" && <p className="previous-crop">Después de {previousCropName(p.previous).toLowerCase()}</p>}
          </div>
          <span className="crop-illustration" aria-hidden="true"><FarmIcon name={top.crop} size={60} /></span>
          <div className="recommendation-score">
            <Stars score={top.overall} />
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
    {top && <div className="metric-tiles" role="group" aria-label={`Por qué ${top.name}: agua, sequía, plagas y precio`}>
      {pillarInfo.map(({ id, label, icon }) => <MetricTile key={id} label={label}
        icon={<FarmIcon name={icon} size={18} />} tone={"metric-" + id + " tile-" + lightFor(top.scores[id])}
        value={lightWord[lightFor(top.scores[id])]} detail={top.words[id]}>
        {id === "water" && <WaterGauge value={top.scores.water} />}
      </MetricTile>)}
    </div>}
    {reading && <div className="decision-reading"><p role="status">{reading.status}</p><p>{reading.text}</p>{reading.generated && <p>AI-generated voice</p>}{(reading.phase === "loading" || reading.phase === "playing") && <button type="button" className="src-button" onClick={stop}>Detener lectura</button>}</div>}

    <section className="compare-fold crop-comparison" aria-labelledby="crop-comparison-title">
      <div className="crop-comparison-head">
        <h2 id="crop-comparison-title" className="compare-summary-title"><CalendarDays aria-hidden="true" /> Todos los cultivos ({p.crops.length})</h2>
        <span className="crops-dist-pills">
          {greenCount > 0 && <em className="dist-pill green">{greenCount} Bien</em>}
          {amberCount > 0 && <em className="dist-pill amber">{amberCount} Regular</em>}
          {redCount > 0 && <em className="dist-pill red">{redCount} Malo</em>}
        </span>
      </div>
      <div className="crops-dist-bar" aria-hidden="true">
        {greenCount > 0 && <span className="dist-seg green" style={{ flex: greenCount }} />}
        {amberCount > 0 && <span className="dist-seg amber" style={{ flex: amberCount }} />}
        {redCount > 0 && <span className="dist-seg red" style={{ flex: redCount }} />}
      </div>
      <ul className="crop-list" aria-label="Comparación de cultivos">{advice.map(a => <CropRow key={a.crop} a={a} top={a === top} onSources={() => setSources(a)} />)}{p.crops.filter(crop => !advice.some(item => item.crop === crop)).map(crop => <li key={crop}>{cropNames[crop]} · sin datos todavía</li>)}</ul>
    </section>

    {sources && <SourcesSheet advice={sources} all={advice} province={p.province} previous={p.previous} irrigation={p.irrigation} sowMonth={p.sowMonth} onClose={() => setSources(null)} />}

  </section>;
}

export function PlantingReview(p: Pick<Props, "province" | "irrigation" | "previous" | "sowMonth" | "priority" | "crops">) {
  const advice = useMemo(() => adviseNextCrop(p), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  if (!top) return null;
  const repeat = advice.find(item => item.repeats);
  const historical = profitFor(top.crop, 1, p.irrigation);
  const loss = historical && !("unavailable" in historical) && historical.profit.mid < 0;
  const notes = [...top.warnings, ...top.pestPrecautions];
  return <details className="compare-fold planting-review"><summary><AlertTriangle aria-hidden="true" /> Qué revisar antes de sembrar</summary>
    <p>Antes de decidir, revisa el agua y el suelo con tu técnico y ten en cuenta estas alertas:</p>
    <ul className="decision-risks">
      {loss && <li>Posible pérdida al último precio mayorista.</li>}
      {notes.map(note => <li key={note}>{note}</li>)}
      {repeat && <li>Riesgo de plagas si repites {repeat.name.toLowerCase()}.</li>}
    </ul>
    <p className="note">NASA POWER / MERRA-2 · 2016–2025 · ~50 km · San Juan. Sequía: FAO GIEWS.</p>
  </details>;
}
