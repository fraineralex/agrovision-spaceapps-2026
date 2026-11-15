/* AI: Claude (Anthropic), 2026-11-14 — first-visit onboarding for farmers. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { allCrops, cropEmoji, cropNames, defaultCrops, monthNames, previousCrops, previousCropName, type CropId, type PreviousCrop } from "@/lib/advisor";
import { provinces, isInCountry, provinceAt, type Location } from "@/lib/geography";
import { usePlaceSearch } from "@/lib/place-search";
import { Check, MapPin } from "lucide-react";
import { areaLabel, centroid, newFarmId, piecesAreaM2, type Farm, type Piece } from "@/lib/farms";
import type { Irrigation, Priority } from "@/lib/data";

export type FarmProfile = Farm;
const FarmPicker = dynamic(() => import("@/components/farm-picker").then(module => module.FarmPicker), { loading: () => <p role="status">Cargando mapa…</p> });
const STEPS = 3;
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={on ? "ob-choice on" : "ob-choice"} aria-pressed={on} onClick={onClick}>{children}</button>;
}

export function Onboarding({ initial, onDone, onSkip, farmCount = 0 }: { initial: Partial<FarmProfile>; onDone: (p: FarmProfile) => void; onSkip: () => void; farmCount?: number }) {
  const now = new Date().getMonth() + 1;
  const [step, setStep] = useState(initial.id && initial.location ? 1 : 0);
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
  const [showMap, setShowMap] = useState(Boolean(initial.pieces?.length));
  const [name, setName] = useState(initial.name ?? (farmCount ? `Finca ${farmCount + 1}` : "Mi finca"));
  const [placeName, setPlaceName] = useState(initial.placeName);
  const [machinery, setMachinery] = useState(initial.machinery ?? "");
  const [pesticides, setPesticides] = useState(initial.pesticides ?? "");
  const next = () => setStep(s => Math.min(STEPS - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));
  const pick = (name: string, loc?: Location, place?: string) => {
    const p = provinces.find(x => x.name === name);
    if (name !== province || loc) { setPieces([]); setShowMap(false); }
    setProvince(name);
    if (name !== province || loc) setPlaceName(place);
    setLocation(loc ?? (name === province && location ? location : p ? { longitude: p.longitude, latitude: p.latitude } : null));
    setSearch("");
    next();
  };
  const useGps = () => {
    if (!("geolocation" in navigator)) { setGps("Tu teléfono no permite ubicación. Escribe tu provincia."); return; }
    setGps("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { longitude: pos.coords.longitude, latitude: pos.coords.latitude };
      if (!isInCountry(loc)) { setGps("Tu ubicación no está en República Dominicana. Escribe tu provincia."); return; }
      setGps(""); pick(provinceAt(loc) ?? "", loc);
    }, () => setGps("No se pudo obtener tu ubicación. Escribe tu provincia."), { timeout: 10000 });
  };
  const { places, loading, unavailable } = usePlaceSearch(search, 8);
  const finish = () => location && onDone({ id: initial.id ?? newFarmId(), name: name.trim() || "Mi finca", pieces, province, location: centroid(pieces) ?? location, previous, irrigation, crops: crops.length ? crops : defaultCrops, sowMonth, priority, plan: initial.plan, waterTurn: initial.waterTurn, irrigationDate: initial.irrigationDate, placeName, machinery: machinery.trim() || undefined, pesticides: pesticides.trim() || undefined });

  return <div className="onboarding" role="dialog" aria-modal="true" aria-label="Cuéntanos de tu finca">
    <div className="ob-card">
      <div className="ob-top">
        {step > 0 ? <button type="button" className="ob-link" onClick={back}>← Atrás</button> : <span />}
        <span className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} aria-label={`Paso ${step + 1} de ${STEPS}`}>{Array.from({ length: STEPS }, (_, i) => <i key={i} className={i <= step ? "on" : ""} />)}</span>
        <button type="button" className="ob-link" onClick={onSkip}>Saltar</button>
      </div>

      {step === 0 && <div className="ob-step">
        <h2>¿Dónde está tu finca?</h2>
        <p>Elige un lugar cercano. Puedes marcar tu finca en el mapa después.</p>
        <button type="button" className="ob-primary" onClick={useGps}><MapPin aria-hidden="true" /> Usar mi ubicación</button>
        {gps && <p role="status">{gps}</p>}
        <label className="ob-label">Busca un lugar en RD<input type="search" value={search} placeholder="Ej.: Pedro Brand" onChange={e => setSearch(e.target.value)} /></label>
        <div className="ob-grid">{search.trim() ? places.map(p => <Choice key={p.id} on={province === p.name || placeName === p.name} onClick={() => p.kind ? pick(p.province, { longitude: p.longitude, latitude: p.latitude }, p.name) : pick(p.name)}>{p.name}{p.kind && <small>{p.kind} · {p.province}</small>}</Choice>)
          : provinces.filter(p => ["San Juan", "Santiago", "La Vega", "Azua", "Monte Cristi", "Valverde"].includes(p.name)).map(p => <Choice key={p.name} on={province === p.name} onClick={() => pick(p.name)}>{p.name}</Choice>)}</div>
        {loading && <p role="status">Buscando lugares…</p>}
        {unavailable && <p role="status">No se pudo cargar el catálogo. Puedes buscar por provincia o usar el mapa.</p>}
        {search.trim().length >= 2 && !places.length && !loading && !unavailable && <p role="status">No encontramos ese lugar.</p>}
      </div>}

      {step === 1 && location && <div className="ob-step">
        <h2>Dale un nombre a tu finca</h2>
        <label className="ob-label">Nombre de esta finca<input value={name} maxLength={40} placeholder="Ej.: Finca del río" onChange={e => setName(e.target.value)} /></label>
        {placeName && <p className="note">{placeName} · {province}</p>}
        <details className="ob-more"><summary>Maquinaria y pesticidas (opcional)</summary>
          <label className="ob-label">Maquinaria disponible<textarea rows={2} value={machinery} maxLength={500} placeholder="Ej.: tractor alquilado, bomba propia" onChange={e => setMachinery(e.target.value)}/></label>
          <label className="ob-label">Pesticidas registrados en la finca<textarea rows={2} value={pesticides} maxLength={500} placeholder="Anota los nombres de los productos que usas" onChange={e => setPesticides(e.target.value)}/></label>
          <p className="note">Tus apuntes quedan en este navegador.</p>
        </details>
        {showMap ? <FarmPicker center={location} pieces={pieces} onChange={setPieces} /> : <button type="button" className="link-button" onClick={() => setShowMap(true)}>Marcar la finca en el mapa (opcional)</button>}
        <button type="button" className="ob-primary" onClick={next}>{pieces.length ? `Listo: ${areaLabel(piecesAreaM2(pieces))}` : "Seguir sin marcar"}</button>
        {initial.id && <button type="button" className="link-button" onClick={finish}>Guardar cambios</button>}
      </div>}

      {step === 2 && <div className="ob-step">
        <h2>¿Qué siembras ahora o sembraste la última vez?</h2>
        <div className="ob-grid">{previousCrops.map(c => <Choice key={c} on={previous === c} onClick={() => setPrevious(c)}><span className="ob-emoji" aria-hidden="true">{cropEmoji[c]}</span>{previousCropName(c)}</Choice>)}
          <Choice on={previous === "otro"} onClick={() => setPrevious("otro")}>Otro</Choice>
          <Choice on={previous === "unknown"} onClick={() => setPrevious("unknown")}>Nada / no sé</Choice></div>
        <h3 className="ob-sub">¿Tienes riego?</h3>
        <div className="ob-row" role="group" aria-label="¿Tienes riego?">
          <Choice on={irrigation === "irrigated"} onClick={() => setIrrigation("irrigated")}>Sí</Choice>
          <Choice on={irrigation === "rainfed"} onClick={() => setIrrigation("rainfed")}>No, de lluvia</Choice>
          <Choice on={irrigation === "unconfirmed"} onClick={() => setIrrigation("unconfirmed")}>No sé</Choice>

        </div>
        <details className="ob-more"><summary>Cambiar los cultivos que se comparan ({crops.length})</summary>
          <div className="ob-grid">{allCrops.map(c => { const on = crops.includes(c); return <Choice key={c} on={on} onClick={() => setCrops(on ? crops.filter(x => x !== c) : [...crops, c])}><span className="ob-emoji" aria-hidden="true">{cropEmoji[c]}</span>{cropNames[c]}{on ? " ✓" : ""}</Choice>; })}</div>
          <label className="ob-label">Mes en que piensas sembrar<select value={sowMonth} onChange={e => setSowMonth(Number(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
        </details>
        <button type="button" className="ob-primary" disabled={!location} onClick={finish}><Check aria-hidden="true" /> Listo, ver mi recomendación</button>
        {!location && <p role="status">Falta elegir dónde está tu finca (paso 1).</p>}
      </div>}
    </div>
  </div>;
}
