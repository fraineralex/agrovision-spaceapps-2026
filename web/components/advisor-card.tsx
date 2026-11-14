/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { CalendarDays, Info, MapPin, Sprout, TriangleAlert, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { adviseNextCrop, adviceSentence, cropEmoji, previousCropName, lightFor, monthNames, type AdvicePriority, type CropAdvice, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";

import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation } from "@/lib/data";

const pillarInfo: { id: Pillar; label: string; icon: string }[] = [
  { id: "water", label: "Agua", icon: "water" }, { id: "climate", label: "Sequía", icon: "climate" },
  { id: "pests", label: "Plagas", icon: "pests" }, { id: "market", label: "Precio", icon: "market" },
];
const irrigationWord: Record<Irrigation, string> = { irrigated: "con riego", rainfed: "sin riego", unconfirmed: "riego sin confirmar" };

type Props = {
  province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[];
  onEdit: () => void; onTop?: (crop: CropId) => void;
};

function CropRow({ a, top, onSources }: { a: CropAdvice; top: boolean; onSources: () => void }) {
  return <li className={top ? "crop-row top" : "crop-row"}>
    <div className="crop-row-head"><span className="crop-emoji" aria-hidden="true">{cropEmoji[a.crop]}</span>
      <strong>{a.name}</strong>{top && a.overall !== null && <span className="badge">Recomendado</span>}{!a.viable && <span className="badge gray">No sin riego</span>}</div>
    <div className="pillar-row">{pillarInfo.map(pi => { const c = lightFor(a.scores[pi.id]); return <span key={pi.id} className={`pillar-chip ${c}`} title={`${pi.label}: ${a.words[pi.id]}`}>
      <FarmIcon name={pi.icon} size={20} /><span>{a.words[pi.id]}</span></span>; })}</div>
    {a.pestPrecautions.map(note => <p key={note} className="warning">{note}</p>)}
    <button type="button" className="src-button small" onClick={onSources}><Info aria-hidden="true" size={20} /> ¿De dónde sale esto?</button>

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
  return <section className="card advisor" aria-label="Qué sembrar ahora" aria-live="polite">
    <div className="profile-line">
      <span><MapPin aria-hidden="true" size={18} /> {p.province ?? "Sin provincia"} · {irrigationWord[p.irrigation]}</span>

      <button type="button" className="ob-link" onClick={p.onEdit}>Cambiar</button>
    </div>
    <h3>Opción para considerar</h3>

    <div className={`verdict visual-verdict ${light}`}>
      {top && top.overall !== null ? <>
        <div className="crop-feature"><span aria-hidden="true">{cropEmoji[top.crop] || "🌱"}</span><div><p className="verdict-text">{top.name}</p>
          {p.previous !== "unknown" && <small>Después de {previousCropName(p.previous).toLowerCase()}</small>}</div></div>
        {top.harvestMonth > 0 && <div className="crop-timeline"><div><Sprout aria-hidden="true"/><span><small>Siembra evaluada</small><strong>{monthNames[p.sowMonth - 1]}</strong></span></div>
          <div><Wheat aria-hidden="true"/><span><small>Cosecha aprox.</small><strong>{monthNames[top.harvestMonth - 1]}</strong></span></div></div>}
      </> : <p className="verdict-text">{sentence}</p>}
      <div className="verdict-actions"><button type="button" className="listen" onClick={speak}><FarmIcon name="sound" size={22} /> Escuchar</button>
        {top && <button type="button" className="src-button" onClick={() => setSources(top)}><Info aria-hidden="true" size={20} /> Datos y fuentes</button>}</div>
      {notes.length > 0 && <details className="visual-details crop-alerts"><summary><TriangleAlert aria-hidden="true"/> Qué revisar ({notes.length})</summary><ul>{notes.map(w => <li key={w}>{w}</li>)}</ul></details>}
    </div>

    <details className="compare-fold"><summary><CalendarDays aria-hidden="true"/> Todos los cultivos ({advice.length})</summary>
      <ul className="crop-list" aria-label="Comparación de cultivos">{advice.map(a => <CropRow key={a.crop} a={a} top={a === top} onSources={() => setSources(a)} />)}</ul>
    </details>

    {sources && <SourcesSheet advice={sources} all={advice} province={p.province} previous={p.previous} irrigation={p.irrigation} sowMonth={p.sowMonth} onClose={() => setSources(null)} />}

  </section>;
}
