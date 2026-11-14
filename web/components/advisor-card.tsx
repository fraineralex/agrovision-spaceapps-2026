/* AI: Claude (Anthropic), 2026-11-14 — farmer recommendation card; unified botanical SVG icons, radial gauge, pillar bars & cycle timeline by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { AlertTriangle, Info, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { adviseNextCrop, adviceSentence, previousCropName, FAO56_URL, lightFor, marketFor, monthNames, type CropAdvice, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";

import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation, Priority } from "@/lib/data";

const pillarInfo: { id: Pillar; label: string; icon: string }[] = [
  { id: "water", label: "Agua", icon: "water" }, { id: "climate", label: "Sequía", icon: "climate" },
  { id: "pests", label: "Plagas", icon: "pests" }, { id: "market", label: "Precio", icon: "market" },
];
const lightWord: Record<string, string> = { green: "Bien", amber: "Regular", red: "Cuidado", gray: "Sin dato" };
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
        const pct = s === null ? 0 : Math.max(18, Math.min(100, Math.round((s / 5) * 100)));
        return (
          <div key={pi.id} className={`pbar-item ${c}`} title={`${pi.label}: ${a.words[pi.id]}`}>
            <div className="pbar-top">
              <span className="pbar-label"><FarmIcon name={pi.icon} size={14} /> {pi.label}</span>
              <span className="pbar-word">{a.words[pi.id]}</span>
            </div>
            <div className="pbar-track" aria-hidden="true">
              <span className={`pbar-fill ${c}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Props = {
  province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: Priority; crops: CropId[];
  onEdit: () => void; onTop?: (crop: CropId) => void;
};

function CropRow({ a, top, onSources }: { a: CropAdvice; top: boolean; onSources: () => void }) {
  return <li className={top ? "crop-row top" : "crop-row"}>
    <div className="crop-row-head">
      <span className="crop-medallion" aria-hidden="true"><FarmIcon name={a.crop} size={20} /></span>
      <strong>{a.name}</strong>{top && a.overall !== null && <span className="badge">Recomendado</span>}{!a.viable && <span className="badge gray">No sin riego</span>}
    </div>
    <div className="pillar-row">{pillarInfo.map(pi => { const c = lightFor(a.scores[pi.id]); return <span key={pi.id} className={`pillar-chip ${c}`} title={`${pi.label}: ${a.words[pi.id]}`}>
      <FarmIcon name={pi.icon} size={18} /><span>{a.words[pi.id]}</span></span>; })}</div>
    {a.pestPrecautions.map(note => <p key={note} className="warning"><AlertTriangle aria-hidden="true" size={16} /><span>{note}</span></p>)}
    <button type="button" className="src-button small" onClick={onSources}><Info aria-hidden="true" size={18} /> ¿De dónde sale esto?</button>
  </li>;
}

export function AdvisorCard(p: Props) {
  const [sources, setSources] = useState<CropAdvice | null>(null);
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = advice[0];
  const sentence = adviceSentence(top, p.previous);
  const peak = top ? marketFor(top.crop)?.sowing?.peakSowingMonths ?? [] : [];
  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(`${sentence} ${[...(top?.warnings ?? []), ...(top?.pestPrecautions ?? [])].join(" ")} Revisa siempre con tu técnico.`);
      u.lang = "es-DO"; speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch { /* Speech is optional. */ }
  };
  const light = lightFor(top?.overall ?? null);
  return <section className="card advisor" aria-label="Qué sembrar ahora" aria-live="polite">
    <div className="profile-line">
      <span><MapPin aria-hidden="true" size={18} /> {p.province ?? "Sin provincia"} · {p.previous === "unknown" ? "sin cultivo anterior" : p.previous === "otro" ? "antes: otro cultivo" : `antes: ${previousCropName(p.previous).toLowerCase()}`} · {irrigationWord[p.irrigation]} · siembra en {monthNames[p.sowMonth - 1]}</span>
      <button type="button" className="ob-link" onClick={p.onEdit}>Cambiar</button>
    </div>
    <div className="advisor-head">
      <h2>Tu recomendación</h2>
      {top && top.overall !== null && (
        <div className="advisor-score-wrap">
          <ScoreDial score={top.overall} light={light} />
          <span className={`advisor-score light-${light}`}>{top.overall.toFixed(1).replace(".", ",")} / 5 · {lightWord[light]}</span>
        </div>
      )}
    </div>

    <div className={`verdict ${light}`}>
      <div className="verdict-visual" aria-hidden="true">
        <span className={`recommendation-light light ${light}`} role="img" aria-label={lightWord[light]} />
        {top && top.overall !== null && <span className="verdict-crop-badge"><FarmIcon name={top.crop} size={26} /></span>}
      </div>
      <div>
        <p className="verdict-text">{sentence}</p>
        {top && top.overall !== null && <PillarBars a={top} />}
        {top && top.overall !== null && top.harvestMonth > 0 && (
          <div className="cycle-strip">
            <span className="cycle-node start"><FarmIcon name="calendar" size={15} /> Siembra: {monthNames[p.sowMonth - 1]}</span>
            <span className="cycle-line" aria-hidden="true"><i className="cycle-pulse" /></span>
            <span className="cycle-node end">Cosecha: {monthNames[top.harvestMonth - 1]} (~{Math.round(top.cycleDays / 30)} m)</span>
          </div>
        )}
        {peak.length > 0 && top && <p className="verdict-sub">En el país, {top.name.toLowerCase()} se siembra más en {peak.map(m => monthNames[m - 1]).join(", ")}.</p>}
        {[...(top?.warnings ?? []), ...(top?.pestPrecautions ?? [])].map(w => <p key={w} className="warning"><AlertTriangle aria-hidden="true" size={18} /><span>{w}</span></p>)}
        <div className="verdict-actions"><button type="button" className="listen" onClick={speak}><FarmIcon name="sound" size={20} /> Escuchar</button>
          {top && <button type="button" className="src-button" onClick={() => setSources(top)}><Info aria-hidden="true" size={19} /> ¿De dónde sale esto?</button>}</div>
      </div>
    </div>

    <details className="compare-fold" open><summary>Comparar con tus otros cultivos ({advice.length})</summary>
      <ul className="crop-list" aria-label="Comparación de cultivos">{advice.map(a => <CropRow key={a.crop} a={a} top={a === top} onSources={() => setSources(a)} />)}</ul>
    </details>

    {sources && <SourcesSheet advice={sources} all={advice} province={p.province} previous={p.previous} irrigation={p.irrigation} sowMonth={p.sowMonth} onClose={() => setSources(null)} />}
    <p className="sources-line">Fuentes: <a href={FAO56_URL}>FAO (agua de los cultivos)</a>, <a href="https://www.fao.org/giews/earthobservation/country/index.jsp?lang=es&code=DOM">FAO GIEWS (sequía)</a>, <a href="https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf">IDIAF (plagas)</a> y Ministerio de Agricultura (precios y siembras). Es una guía: confírmalo con tu técnico.</p>

  </section>;
}
