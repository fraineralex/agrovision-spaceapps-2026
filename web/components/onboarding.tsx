/* AI: Claude (Anthropic), 2026-11-14 — first-visit onboarding for farmers. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useState } from "react";
import { allCrops, cropEmoji, cropNames, defaultCrops, monthNames, type CropId, type PreviousCrop } from "@/lib/advisor";
import { provinces, isInCountry, provinceAt, type Location } from "@/lib/geography";
import type { Irrigation, Priority } from "@/lib/data";

export type FarmProfile = { province: string; location: Location; previous: PreviousCrop; irrigation: Irrigation; crops: CropId[]; sowMonth: number; priority: Priority };
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STEPS = 7;
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={on ? "ob-choice on" : "ob-choice"} aria-pressed={on} onClick={onClick}>{children}</button>;
}

export function Onboarding({ initial, onDone, onSkip }: { initial: Partial<FarmProfile>; onDone: (p: FarmProfile) => void; onSkip: () => void }) {
  const now = new Date().getMonth() + 1;
  const [step, setStep] = useState(0);
  const [province, setProvince] = useState(initial.province ?? "");
  const [location, setLocation] = useState<Location | null>(initial.location ?? null);
  const [search, setSearch] = useState("");
  const [gps, setGps] = useState("");
  const [previous, setPrevious] = useState<PreviousCrop>(initial.previous ?? "unknown");
  const [irrigation, setIrrigation] = useState<Irrigation>(initial.irrigation ?? "unconfirmed");
  const [crops, setCrops] = useState<CropId[]>(initial.crops ?? defaultCrops);
  const [sowMonth, setSowMonth] = useState(initial.sowMonth ?? now);
  const [priority, setPriority] = useState<Priority>(initial.priority ?? "water");
  const next = () => setStep(s => Math.min(STEPS - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));
  const pick = (name: string, loc?: Location) => { const p = provinces.find(x => x.name === name); setProvince(name); setLocation(loc ?? (p ? { longitude: p.longitude, latitude: p.latitude } : null)); setSearch(""); setTimeout(next, 150); };
  const useGps = () => {
    if (!("geolocation" in navigator)) { setGps("Tu teléfono no permite ubicación. Escribe tu provincia."); return; }
    setGps("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { longitude: pos.coords.longitude, latitude: pos.coords.latitude };
      if (!isInCountry(loc)) { setGps("Tu ubicación no está en República Dominicana. Escribe tu provincia."); return; }
      setGps(""); pick(provinceAt(loc) ?? "", loc);
    }, () => setGps("No se pudo obtener tu ubicación. Escribe tu provincia."), { timeout: 10000 });
  };
  const matches = search.trim() ? provinces.filter(p => fold(p.name).includes(fold(search.trim()))).slice(0, 8) : provinces.slice(0, 0);
  const finish = () => location && onDone({ province, location, previous, irrigation, crops: crops.length ? crops : defaultCrops, sowMonth, priority });

  return <div className="onboarding" role="dialog" aria-modal="true" aria-label="Cuéntanos de tu finca">
    <div className="ob-card">
      <div className="ob-top">
        {step > 0 ? <button type="button" className="ob-link" onClick={back}>← Atrás</button> : <span />}
        <span className="ob-progress" aria-label={`Paso ${step + 1} de ${STEPS}`}>{Array.from({ length: STEPS }, (_, i) => <i key={i} className={i <= step ? "on" : ""} />)}</span>
        <button type="button" className="ob-link" onClick={onSkip}>Saltar</button>
      </div>

      {step === 0 && <div className="ob-step">
        <div className="ob-hero">🌱</div>
        <h2>¡Hola! Te ayudo a decidir qué sembrar</h2>
        <p>Te haré 6 preguntas cortas sobre tu finca. Usamos datos de satélites de la NASA, la FAO y precios del Ministerio de Agricultura.</p>
        <button type="button" className="ob-primary" onClick={next}>Empezar</button>
      </div>}

      {step === 1 && <div className="ob-step">
        <h2>📍 ¿Dónde está tu finca?</h2>
        <button type="button" className="ob-primary" onClick={useGps}>Usar mi ubicación</button>
        {gps && <p role="status">{gps}</p>}
        <label className="ob-label">O escribe tu provincia<input type="search" value={search} placeholder="Ej.: San Juan" onChange={e => setSearch(e.target.value)} /></label>
        <div className="ob-grid">{(matches.length ? matches : provinces.filter(p => ["San Juan", "Santiago", "La Vega", "Azua", "Monte Cristi", "Valverde"].includes(p.name))).map(p =>
          <Choice key={p.name} on={province === p.name} onClick={() => pick(p.name)}>{p.name}</Choice>)}</div>
        {search.trim() && !matches.length && <p role="status">No encontramos esa provincia. Revisa el nombre.</p>}
      </div>}

      {step === 2 && <div className="ob-step">
        <h2>¿Qué sembraste la última vez?</h2>
        <div className="ob-grid">{allCrops.map(c => <Choice key={c} on={previous === c} onClick={() => { setPrevious(c); setTimeout(next, 150); }}><span className="ob-emoji">{cropEmoji[c]}</span>{cropNames[c]}</Choice>)}
          <Choice on={previous === "otro"} onClick={() => { setPrevious("otro"); setTimeout(next, 150); }}>Otro</Choice>
          <Choice on={previous === "unknown"} onClick={() => { setPrevious("unknown"); setTimeout(next, 150); }}>Nada / no sé</Choice></div>
      </div>}

      {step === 3 && <div className="ob-step">
        <h2>💧 ¿Tienes riego?</h2>
        <div className="ob-col">
          <Choice on={irrigation === "irrigated"} onClick={() => { setIrrigation("irrigated"); setTimeout(next, 150); }}>Sí, tengo riego (canal, pozo o goteo)</Choice>
          <Choice on={irrigation === "rainfed"} onClick={() => { setIrrigation("rainfed"); setTimeout(next, 150); }}>No, dependo de la lluvia</Choice>
          <Choice on={irrigation === "unconfirmed"} onClick={() => { setIrrigation("unconfirmed"); setTimeout(next, 150); }}>A veces / no sé</Choice>
        </div>
      </div>}

      {step === 4 && <div className="ob-step">
        <h2>¿Qué cultivos podrías sembrar?</h2>
        <p>Marca todos los que sabes sembrar o se dan en tu zona.</p>
        <div className="ob-grid">{allCrops.map(c => { const on = crops.includes(c); return <Choice key={c} on={on} onClick={() => setCrops(on ? crops.filter(x => x !== c) : [...crops, c])}><span className="ob-emoji">{cropEmoji[c]}</span>{cropNames[c]}{on ? " ✓" : ""}</Choice>; })}</div>
        <button type="button" className="ob-primary" disabled={!crops.length} onClick={next}>Seguir ({crops.length})</button>
      </div>}

      {step === 5 && <div className="ob-step">
        <h2>📅 ¿Cuándo piensas sembrar?</h2>
        <div className="ob-grid">{[0, 1, 2, 3].map(k => { const m = (now - 1 + k) % 12 + 1; return <Choice key={m} on={sowMonth === m} onClick={() => { setSowMonth(m); setTimeout(next, 150); }}>{k === 0 ? "Este mes" : k === 1 ? "El mes que viene" : ""} {k > 1 ? monthNames[m - 1] : `(${monthNames[m - 1]})`}</Choice>; })}</div>
        <label className="ob-label">Otro mes<select value={sowMonth} onChange={e => setSowMonth(Number(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
        <button type="button" className="ob-primary" onClick={next}>Seguir</button>
      </div>}

      {step === 6 && <div className="ob-step">
        <h2>¿Qué te importa más?</h2>
        <div className="ob-col">
          <Choice on={priority === "water"} onClick={() => setPriority("water")}>💧 Gastar menos agua</Choice>
          <Choice on={priority === "market"} onClick={() => setPriority("market")}>💰 Vender a mejor precio</Choice>
          <Choice on={priority === "pests"} onClick={() => setPriority("pests")}>🐛 Tener menos plagas</Choice>
          <Choice on={priority === "climate"} onClick={() => setPriority("climate")}>☀️ Aguantar la sequía</Choice>
        </div>
        <button type="button" className="ob-primary" disabled={!location} onClick={finish}>Ver mi recomendación</button>
        {!location && <p role="status">Falta elegir dónde está tu finca (paso 2).</p>}
      </div>}
    </div>
  </div>;
}
