/* AI: Claude (Anthropic), 2026-11-14 — first-visit onboarding for farmers; centered natural backdrop & unified SVG icons by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useState } from "react";
import { FarmIcon } from "@/components/farm-icon";
import { allCrops, cropNames, defaultCrops, monthNames, previousCrops, previousCropName, type CropId, type PreviousCrop } from "@/lib/advisor";
import { provinces, isInCountry, provinceAt, type Location } from "@/lib/geography";
import { FarmPicker } from "@/components/farm-picker";
import { Check, MapPin, Search } from "lucide-react";
import { areaLabel, centroid, newFarmId, piecesAreaM2, type Farm, type Piece } from "@/lib/farms";
import type { Irrigation, Priority } from "@/lib/data";

export type FarmProfile = Farm;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STEPS = 3;
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={on ? "ob-choice on" : "ob-choice"} aria-pressed={on} onClick={onClick}>{children}</button>;
}

export function Onboarding({ initial, onDone, onSkip, farmCount = 0 }: { initial: Partial<FarmProfile>; onDone: (p: FarmProfile) => void; onSkip: () => void; farmCount?: number }) {
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
  const [priority] = useState<Priority>(initial.priority ?? "water");
  const [pieces, setPieces] = useState<Piece[]>(initial.pieces ?? []);
  const [name, setName] = useState(initial.name ?? (farmCount ? `Finca ${farmCount + 1}` : "Mi finca"));
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
  const finish = () => location && onDone({ id: initial.id ?? newFarmId(), name: name.trim() || "Mi finca", pieces, province, location: centroid(pieces) ?? location, previous, irrigation, crops: crops.length ? crops : defaultCrops, sowMonth, priority });

  return <div className="onboarding" role="dialog" aria-modal="true" aria-label="Cuéntanos de tu finca">
    <div className="ob-backdrop" aria-hidden="true">
      <div className="ob-backdrop-photo" />
      <div className="ob-backdrop-scrim" />
    </div>
    <div className={step >= 1 ? "ob-card ob-card-wide" : "ob-card"}>
      <div className="ob-top">
        {step > 0 ? <button type="button" className="ob-link" onClick={back}>← Atrás</button> : <span className="ob-top-spacer" />}
        <div className="ob-progress-wrap">
          <span className="ob-step-count">Paso {step + 1} de {STEPS}</span>
          <span className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} aria-label={`Paso ${step + 1} de ${STEPS}`}>
            {Array.from({ length: STEPS }, (_, i) => <i key={i} className={i === step ? "on current" : i < step ? "on" : ""} />)}
          </span>
        </div>
        <button type="button" className="ob-link" onClick={onSkip}>Saltar</button>
      </div>

      <div className="ob-body">

      {step === 0 && <div className="ob-step">
        <div className="ob-hero-badge" aria-hidden="true"><FarmIcon name="soil" size={28} /></div>
        <h2>¿Dónde está tu finca?</h2>
        <p>Son 3 pasos cortos. Usamos datos de la NASA, la FAO y el Ministerio de Agricultura para decirte qué te conviene sembrar.</p>
        <button type="button" className="ob-primary" onClick={useGps}><MapPin aria-hidden="true" /> Usar mi ubicación</button>
        {gps && <p role="status">{gps}</p>}
        <div className="ob-divider" aria-hidden="true"><span>o busca manualmente</span></div>
        <label className="ob-label">O escribe tu provincia
          <div className="ob-search-box">
            <span className="ob-search-icon" aria-hidden="true"><Search size={18} /></span>
            <input type="search" value={search} placeholder="Ej.: San Juan" onChange={e => setSearch(e.target.value)} />
          </div>
        </label>
        {!search.trim() && <span className="ob-sublabel">Zonas agrícolas frecuentes</span>}
        <div className="ob-grid ob-grid-provinces">{(matches.length ? matches : provinces.filter(p => ["San Juan", "Santiago", "La Vega", "Azua", "Monte Cristi", "Valverde"].includes(p.name))).map(p =>
          <Choice key={p.name} on={province === p.name} onClick={() => pick(p.name)}>
            <span className="ob-icon-chip sm" aria-hidden="true"><MapPin size={15} /></span>
            <span>{p.name}</span>
          </Choice>)}</div>
        {search.trim() && !matches.length && <p role="status">No encontramos esa provincia. Revisa el nombre.</p>}
      </div>}

      {step === 1 && location && <div className="ob-step ob-step-map">
        <div className="ob-map-head">
          <div>
            <h2>Marca tu finca en el mapa</h2>
            <p className="ob-hint">Opcional: marca tus tareas para calcular costos y cosecha con mayor precisión.</p>
          </div>
          <label className="ob-label ob-name-field">Nombre de esta finca<input value={name} maxLength={40} placeholder="Ej.: Finca del río" onChange={e => setName(e.target.value)} /></label>
        </div>
        <FarmPicker center={location} pieces={pieces} onChange={setPieces} />
        <button type="button" className="ob-primary" onClick={next}>{pieces.length ? `Listo: ${areaLabel(piecesAreaM2(pieces))}` : "Saltar este paso"}</button>
      </div>}

      {step === 2 && <div className="ob-step ob-step-crops">
        <div className="ob-crops-head">
          <h2>¿Qué siembras ahora o sembraste la última vez?</h2>
          <p className="ob-hint">Así evitamos repetir cultivos que comparten plagas o gastan demasiada agua.</p>
        </div>
        <div className="ob-step3-layout">
          <div className="ob-grid ob-grid-crops">{previousCrops.map(c => <Choice key={c} on={previous === c} onClick={() => setPrevious(c)}><span className="ob-icon-chip sm" aria-hidden="true"><FarmIcon name={c} size={18} /></span><span>{previousCropName(c)}</span></Choice>)}
            <Choice on={previous === "otro"} onClick={() => setPrevious("otro")}><span className="ob-icon-chip sm" aria-hidden="true"><FarmIcon name="field" size={18} /></span><span>Otro</span></Choice>
            <Choice on={previous === "unknown"} onClick={() => setPrevious("unknown")}><span className="ob-icon-chip sm" aria-hidden="true"><FarmIcon name="close" size={16} /></span><span>Nada / no sé</span></Choice></div>
          <div className="ob-step3-side">
            <h3 className="ob-sub">¿Tienes riego?</h3>
            <div className="ob-row" role="group" aria-label="¿Tienes riego?">
              <Choice on={irrigation === "irrigated"} onClick={() => setIrrigation("irrigated")}>Sí</Choice>
              <Choice on={irrigation === "rainfed"} onClick={() => setIrrigation("rainfed")}>No, de lluvia</Choice>
              <Choice on={irrigation === "unconfirmed"} onClick={() => setIrrigation("unconfirmed")}>No sé</Choice>
            </div>
            <details className="ob-more"><summary>Cambiar los cultivos que se comparan ({crops.length})</summary>
              <div className="ob-grid ob-grid-compact">{allCrops.map(c => { const on = crops.includes(c); return <Choice key={c} on={on} onClick={() => setCrops(on ? crops.filter(x => x !== c) : [...crops, c])}><span className="ob-icon-chip sm" aria-hidden="true"><FarmIcon name={c} size={18} /></span><span>{cropNames[c]}{on ? " ✓" : ""}</span></Choice>; })}</div>
              <label className="ob-label">Mes en que piensas sembrar<select value={sowMonth} onChange={e => setSowMonth(Number(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
            </details>
            <button type="button" className="ob-primary" disabled={!location} onClick={finish}><Check aria-hidden="true" /> Listo, ver mi recomendación</button>
            {!location && <p role="status">Falta elegir dónde está tu finca (paso 1).</p>}
          </div>
        </div>
      </div>}
      </div>
    </div>
    <span className="ob-credit" aria-hidden="true">El Cercado, Valle de San Juan · Paisaje rural (CC0)</span>
  </div>;
}
