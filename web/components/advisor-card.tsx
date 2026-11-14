/* AI: Claude (Anthropic), 2026-11-14 — farmer recommendation card. Frainer review pending. See AI_USAGE.md. */
"use client";
import { Info, MapPin } from "lucide-react";
import { climateSources, weatherPrecautions, type WeatherSignal } from "@/lib/climate-advice";
import { useMemo, useState } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { adviseNextCrop, adviceSentence, cropEmoji, previousCropName, FAO56_URL, lightFor, marketFor, monthNames, type CropAdvice, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";

import { SourcesSheet } from "@/components/sources-sheet";
import type { Irrigation, Priority } from "@/lib/data";

const pillarInfo: { id: Pillar; label: string; icon: string }[] = [
  { id: "water", label: "Agua", icon: "water" }, { id: "climate", label: "Sequía", icon: "climate" },
  { id: "pests", label: "Plagas", icon: "pests" }, { id: "market", label: "Precio", icon: "market" },
];
const lightWord: Record<string, string> = { green: "Bien", amber: "Regular", red: "Cuidado", gray: "Sin dato" };
const irrigationWord: Record<Irrigation, string> = { irrigated: "con riego", rainfed: "sin riego", unconfirmed: "riego sin confirmar" };

type Props = {
  province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: Priority; crops: CropId[];
  weather?: WeatherSignal;
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
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops, weather: p.weather }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops, p.weather]);
  const top = advice[0];
  const climateNotes = weatherPrecautions(p.weather);
  const sentence = adviceSentence(top, p.previous);
  const peak = top ? marketFor(top.crop)?.sowing?.peakSowingMonths ?? [] : [];
  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(`${sentence} ${[...climateNotes, ...(top?.warnings ?? []), ...(top?.pestPrecautions ?? [])].join(" ")} Revisa siempre con tu técnico.`);
      u.lang = "es-DO"; speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch { /* Speech is optional. */ }
  };
  const light = lightFor(top?.overall ?? null);
  return <section className="card advisor" aria-label="Qué sembrar ahora" aria-live="polite">
    <div className="profile-line">
      <span><MapPin aria-hidden="true" size={18} /> {p.province ?? "Sin provincia"} · {p.previous === "unknown" ? "sin cultivo anterior" : p.previous === "otro" ? "antes: otro cultivo" : `antes: ${previousCropName(p.previous).toLowerCase()}`} · {irrigationWord[p.irrigation]} · siembra en {monthNames[p.sowMonth - 1]}</span>

      <button type="button" className="ob-link" onClick={p.onEdit}>Cambiar</button>
    </div>
    <h2>Tu recomendación</h2>

    <div className="note">
      {p.sowMonth >= 6 && p.sowMonth <= 11 && <p>La siembra cae en la temporada ciclónica del Atlántico. Consulta el boletín de INDOMET al acercarse la fecha.</p>}
      {p.weather ? <p>Pronóstico de siembra hasta el {p.weather.through}. {p.weather.cyclone === null && "Seguimiento de ciclones no disponible. "}{p.weather.dustPeak === null && "Pronóstico de polvo no disponible."}</p> : <p>La comparación usa el historial y el último dato provincial disponible. El pronóstico se aplica al mes en curso cuando hay datos de la finca.</p>}
      {climateNotes.map(note => <p key={note}>{note}</p>)}
      <details><summary>Fuentes meteorológicas</summary><ul>{climateSources.map(([label, url]) => <li key={url}><a href={url}>{label}</a></li>)}</ul></details>
    </div>
    <div className={`verdict ${light}`}>
      <span className={`recommendation-light light ${light}`} role="img" aria-label={lightWord[light]} />
      <div>
        <p className="verdict-text">{top && top.overall !== null && <span aria-hidden="true">{cropEmoji[top.crop]} </span>}{sentence}</p>
        {top && top.overall !== null && top.harvestMonth > 0 && <p className="verdict-sub">Siembra en {monthNames[p.sowMonth - 1]} · cosecha en {monthNames[top.harvestMonth - 1]} (unos {Math.round(top.cycleDays / 30)} meses)</p>}
        {peak.length > 0 && top && <p className="verdict-sub">En el país, {top.name.toLowerCase()} se siembra más en {peak.map(m => monthNames[m - 1]).join(", ")}.</p>}
        {[...(top?.warnings ?? []), ...(top?.pestPrecautions ?? [])].map(w => <p key={w} className="warning">⚠ {w}</p>)}
        <div className="verdict-actions"><button type="button" className="listen" onClick={speak}><FarmIcon name="sound" size={22} /> Escuchar</button>
          {top && <button type="button" className="src-button" onClick={() => setSources(top)}><Info aria-hidden="true" size={20} /> ¿De dónde sale esto?</button>}</div>
      </div>
    </div>

    <details className="compare-fold" open><summary>Comparar con tus otros cultivos ({advice.length})</summary>
      <ul className="crop-list" aria-label="Comparación de cultivos">{advice.map(a => <CropRow key={a.crop} a={a} top={a === top} onSources={() => setSources(a)} />)}</ul>
    </details>

    {sources && <SourcesSheet advice={sources} all={advice} province={p.province} previous={p.previous} irrigation={p.irrigation} sowMonth={p.sowMonth} onClose={() => setSources(null)} />}
    <p className="sources-line">Fuentes: <a href={FAO56_URL}>FAO (agua de los cultivos)</a>, <a href="https://www.fao.org/giews/earthobservation/country/index.jsp?lang=es&code=DOM">FAO GIEWS (sequía)</a>, <a href="https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf">IDIAF (plagas)</a> y Ministerio de Agricultura (precios y siembras). Es una guía: confírmalo con tu técnico.</p>

  </section>;
}
