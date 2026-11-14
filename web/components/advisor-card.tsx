/* AI: Claude (Anthropic), 2026-11-14 — farmer recommendation card. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo, useState } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { adviseNextCrop, adviceSentence, cropEmoji, previousCropName, FAO56_URL, lightFor, marketFor, monthNames, type CropAdvice, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";
import { faoScoreRule } from "@/lib/fao-giews";
import { PestCatalog } from "./pest-catalog";
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
  onEdit: () => void; onTop?: (crop: CropId) => void;
};

function CropRow({ a, top, onSources }: { a: CropAdvice; top: boolean; onSources: () => void }) {
  return <li className={top ? "crop-row top" : "crop-row"}>
    <div className="crop-row-head"><span className="crop-emoji" aria-hidden="true">{cropEmoji[a.crop]}</span>
      <strong>{a.name}</strong>{top && a.overall !== null && <span className="badge">Recomendado</span>}{!a.viable && <span className="badge gray">No sin riego</span>}</div>
    <div className="pillar-row">{pillarInfo.map(pi => { const c = lightFor(a.scores[pi.id]); return <span key={pi.id} className={`pillar-chip ${c}`} title={`${pi.label}: ${a.words[pi.id]}`}>
      <FarmIcon name={pi.icon} size={20} /><span>{a.words[pi.id]}</span></span>; })}</div>
    <button type="button" className="src-button small" onClick={onSources}>🔎 ¿De dónde sale esto?</button>
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
      const u = new SpeechSynthesisUtterance(`${sentence} ${top?.warnings.join(" ") ?? ""} Revisa siempre con tu técnico.`);
      u.lang = "es-DO"; speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch { /* Speech is optional. */ }
  };
  const light = lightFor(top?.overall ?? null);
  return <section className="card advisor" aria-label="Qué sembrar ahora" aria-live="polite">
    <div className="profile-line">
      <span>📍 {p.province ?? "Sin provincia"} · {p.previous === "unknown" ? "sin cultivo anterior" : p.previous === "otro" ? "antes: otro cultivo" : `antes: ${previousCropName(p.previous).toLowerCase()}`} · {irrigationWord[p.irrigation]} · siembra en {monthNames[p.sowMonth - 1]}</span>
      <button type="button" className="ob-link" onClick={p.onEdit}>Cambiar</button>
    </div>
    <h2>1 · Tu recomendación</h2>

    <div className={`verdict ${light}`}>
      <span className={`recommendation-light light ${light}`} role="img" aria-label={lightWord[light]} />
      <div>
        <p className="verdict-text">{top && top.overall !== null && <span aria-hidden="true">{cropEmoji[top.crop]} </span>}{sentence}</p>
        {top && top.overall !== null && top.harvestMonth > 0 && <p className="verdict-sub">Siembra en {monthNames[p.sowMonth - 1]} · cosecha en {monthNames[top.harvestMonth - 1]} (unos {Math.round(top.cycleDays / 30)} meses)</p>}
        {peak.length > 0 && top && <p className="verdict-sub">En el país, {top.name.toLowerCase()} se siembra más en {peak.map(m => monthNames[m - 1]).join(", ")}.</p>}
        {top?.warnings.map(w => <p key={w} className="warning">⚠ {w}</p>)}
        <div className="verdict-actions"><button type="button" className="listen" onClick={speak}><FarmIcon name="sound" size={22} /> Escuchar</button>
          {top && <button type="button" className="src-button" onClick={() => setSources(top)}>🔎 ¿De dónde sale esto?</button>}</div>
      </div>
    </div>

    <details className="compare-fold"><summary>📊 Comparar con tus otros cultivos ({advice.length})</summary>
      <ul className="crop-list" aria-label="Comparación de cultivos">{advice.map(a => <CropRow key={a.crop} a={a} top={a === top} onSources={() => setSources(a)} />)}</ul>
    </details>

    <PestCatalog />
    {sources && <SourcesSheet advice={sources} all={advice} province={p.province} previous={p.previous} irrigation={p.irrigation} sowMonth={p.sowMonth} onClose={() => setSources(null)} />}
    <details className="evidence-details"><summary>Ver detalles: cómo se calcula</summary>
      <p><strong>Agua:</strong> agua que pide el cultivo en un ciclo completo según la curva FAO-56 (1998), tablas 11 y 12 (para café, cacao y aguacate, que son permanentes, un año con el promedio de los valores de la tabla 12), comparada en una escala fija entre todos los cultivos de la lista. Los cultivos largos ocupan la tierra más tiempo. No mide litros. El arroz inundado gasta más de lo que muestra el cálculo (no incluye lámina de agua ni pérdidas del canal). Filas FAO usadas: {advice.map(a => `${a.name}: ${a.faoRow}, ${a.kcDays} Kc·día`).join("; ")}. <a href={FAO56_URL}>Fuente</a></p>
      <p><strong>Sequía:</strong> {faoScoreRule} <a href="https://www.fao.org/giews/earthobservation/country/index.jsp?lang=es&code=DOM">FAO GIEWS</a></p>
      <p><strong>Plagas.</strong> Una coincidencia de hospedero respaldada por fuentes locales, o repetir el cultivo, resta 0,5 puntos al resultado (1 punto si priorizas plagas). La rotación habichuela a maíz conserva el aporte de la regla del IDIAF. Una coincidencia basada en una referencia externa queda como aviso.</p>
      <p><strong>Precio:</strong> índice estacional del mes de cosecha (precios mayoristas del Ministerio de Agricultura, Santo Domingo, ago 2017–oct 2026; mediana de años completos). Puntos = 2,5 + (índice − 100)/5, menos 1 si la siembra nacional de los últimos 12 meses supera en 15% la de años anteriores. Reglas propias de AgroVision, no validadas.</p>
      <p><strong>Resultado:</strong> promedio ponderado de los pilares con dato, con el descuento de plagas cuando corresponde. Lo que más te importa cuenta doble. Verde ≥ 3,34; ámbar ≥ 1,67; rojo menor; gris sin dato. Solo se comparan los cultivos que marcaste. No es predicción de cosecha ni de ganancia. Revisa con tu técnico o extensionista.</p>
    </details>
  </section>;
}
