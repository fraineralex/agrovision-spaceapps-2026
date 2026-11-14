/* AI: Claude (Anthropic), 2026-11-14 — farmer recommendation card. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { adviseNextCrop, adviceSentence, cropNames, lightFor, marketFor, monthNames, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";
import { faoScoreRule } from "@/lib/fao-giews";
import type { Irrigation, Priority } from "@/lib/data";

const pillarInfo: { id: Pillar; label: string; icon: string }[] = [
  { id: "water", label: "Agua", icon: "water" }, { id: "climate", label: "Sequía", icon: "climate" },
  { id: "pests", label: "Plagas", icon: "pests" }, { id: "market", label: "Precio", icon: "market" },
];
const lightWord: Record<string, string> = { green: "Bien", amber: "Regular", red: "Cuidado", gray: "Sin dato" };

type Props = {
  province?: string; irrigation: Irrigation; setIrrigation: (v: Irrigation) => void;
  previous: PreviousCrop; setPrevious: (v: PreviousCrop) => void;
  sowMonth: number; setSowMonth: (m: number) => void; priority: Priority; setPriority: (p: Priority) => void;
  onTop?: (crop: CropId) => void;
};

function Chips<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <fieldset className="chips"><legend>{label}</legend>{options.map(([v, text]) =>
    <button type="button" key={v} aria-pressed={value === v} className={value === v ? "chip on" : "chip"} onClick={() => onChange(v)}>{text}</button>)}</fieldset>;
}

export function AdvisorCard(p: Props) {
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority]);
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
    <h2>2 · Tu recomendación</h2>
    <Chips<PreviousCrop> label="¿Qué sembraste la última vez?" value={p.previous} onChange={p.setPrevious}
      options={[["arroz", "Arroz"], ["habichuela_roja", "Habichuela"], ["maiz", "Maíz"], ["otro", "Otro"], ["unknown", "No sé"]]} />
    <Chips<Irrigation> label="¿Tienes riego?" value={p.irrigation} onChange={p.setIrrigation}
      options={[["irrigated", "Sí, tengo riego"], ["rainfed", "No, de lluvia"], ["unconfirmed", "No sé"]]} />
    <label className="big-select">¿Cuándo piensas sembrar?
      <select value={p.sowMonth} onChange={e => p.setSowMonth(Number(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>

    <div className={`verdict ${light}`}>
      <span className={`recommendation-light light ${light}`} role="img" aria-label={lightWord[light]} />
      <div>
        <small>{p.province ?? "Todo el país (elige tu provincia arriba)"}</small>
        <p className="verdict-text">{sentence}</p>
        {top && top.overall !== null && <p className="verdict-sub">Siembra en {monthNames[p.sowMonth - 1]} · cosecha en {monthNames[top.harvestMonth - 1]} (unos {Math.round(top.cycleDays / 30)} meses)</p>}
        {peak.length > 0 && top && <p className="verdict-sub">En el país, la {top.name.toLowerCase()} se siembra más en {peak.map(m => monthNames[m - 1]).join(", ")}.</p>}
        {top?.warnings.map(w => <p key={w} className="warning">⚠ {w}</p>)}
        <button type="button" className="listen" onClick={speak}><FarmIcon name="sound" size={22} /> Escuchar</button>
      </div>
    </div>

    <ul className="crop-list" aria-label="Comparación de cultivos">
      {advice.map(a => <li key={a.crop} className={a === top ? "crop-row top" : "crop-row"}>
        <div className="crop-row-head"><FarmIcon name={a.crop === "habichuela_roja" ? "beans" : a.crop === "maiz" ? "maize" : a.crop === "arroz" ? "rice" : "sweet-potato"} size={30} />
          <strong>{a.name}</strong>{a === top && a.overall !== null && <span className="badge">Recomendado</span>}{!a.viable && <span className="badge gray">No sin riego</span>}</div>
        <div className="pillar-row">{pillarInfo.map(pi => { const c = lightFor(a.scores[pi.id]); return <span key={pi.id} className={`pillar-chip ${c}`} title={`${pi.label}: ${a.words[pi.id]}`}>
          <FarmIcon name={pi.icon} size={20} /><span>{a.words[pi.id]}</span></span>; })}</div>
      </li>)}
    </ul>
    <label className="big-select">¿Qué te importa más?
      <select value={p.priority} onChange={e => p.setPriority(e.target.value as Priority)}>
        <option value="water">Gastar menos agua</option><option value="market">Mejor precio</option><option value="pests">Menos plagas</option><option value="climate">Aguantar la sequía</option></select></label>

    <details className="evidence-details"><summary>Ver detalles: cómo se calcula</summary>
      <p><strong>Agua:</strong> comparación entre estos 4 cultivos con la curva de cultivo FAO-56 (1998), tablas 11–12, de {cropNames.habichuela_roja} {advice.find(a => a.crop === "habichuela_roja")?.kcDays} a {cropNames.arroz} {advice.find(a => a.crop === "arroz")?.kcDays} Kc·día. El arroz inundado gasta más de lo que muestra este cálculo (no incluye lámina de agua ni pérdidas del canal). No mide litros. <a href="https://www.fao.org/4/x0490e/x0490e0b.htm">Fuente</a></p>
      <p><strong>Sequía:</strong> {faoScoreRule} <a href="https://www.fao.org/giews/earthobservation/country/index.jsp?lang=es&code=DOM">FAO GIEWS</a></p>
      <p><strong>Plagas:</strong> solo se usa la regla citada: habichuela seguida de maíz (cultivo no hospedero) ayuda contra antracnosis, bacteriosis común e insectos de la habichuela; repetir el mismo cultivo no rompe el ciclo. Oviedo, IDIAF, Compendio de habichuela, 2013, pp. 88, 94, 102. <a href="https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf">Fuente</a>. Sin regla verificada para otras combinaciones.</p>
      <p><strong>Precio:</strong> índice estacional del mes de cosecha (precios mayoristas del Ministerio de Agricultura, Santo Domingo, ago 2017–oct 2026; mediana de años completos). Puntos = 2,5 + (índice − 100)/5, menos 1 si la siembra nacional de los últimos 12 meses supera en 15% la de años anteriores. Reglas propias de AgroVision, no validadas.</p>
      <p><strong>Resultado:</strong> promedio de los pilares con dato (lo que más te importa cuenta doble). Los colores son: verde ≥ 3,34; ámbar ≥ 1,67; rojo menor; gris sin dato. No es predicción de cosecha ni de ganancia. Revisa con tu técnico o extensionista.</p>
    </details>
  </section>;
}
