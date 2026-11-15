/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — first-visit onboarding for farmers; centered natural backdrop & unified SVG icons by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import type { SoilColor, SoilTexture } from "@/lib/soil";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import dynamic from "next/dynamic";
import { FarmIcon } from "@/components/farm-icon";
import { CustomSelect } from "@/components/custom-select";
import { allCrops, cropNames, monthNames, previousCrops, previousCropName, type CropId, type PreviousCrop } from "@/lib/advisor";
import { provinces, isInCountry, provinceAt, type Location } from "@/lib/geography-core";
import { usePlaceSearch } from "@/lib/place-search";
import { Check, ChevronDown, Droplets, CloudRain, CircleHelp, MapPin, Search } from "lucide-react";
import { areaLabel, centroid, newFarmId, piecesAreaM2, type Farm, type Piece } from "@/lib/farms";
import type { Irrigation, Priority } from "@/lib/data";

export type FarmProfile = Farm;
const FarmPicker = dynamic(() => import("@/components/farm-picker").then(module => module.FarmPicker), { loading: () => <div className="picker-map map-loading" role="status">Cargando mapa…</div> });
const STEPS = 3;
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={on ? "ob-choice on" : "ob-choice"} aria-pressed={on} onClick={onClick}>{children}</button>;
}

export function Onboarding({ initial, onDone, onSkip, farmCount = 0 }: { initial: Partial<FarmProfile>; onDone: (p: FarmProfile) => void; onSkip: () => void; farmCount?: number }) {
  const text = messages[useLocale()].onboarding;
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);
  const now = new Date().getMonth() + 1;
  const [step, setStep] = useState(initial.id && initial.location ? 1 : 0);
  useEffect(() => { body.current?.scrollTo(0, 0); }, [step]);
  const [province, setProvince] = useState(initial.province ?? "");
  const [location, setLocation] = useState<Location | null>(initial.location ?? null);
  const [search, setSearch] = useState("");
  const [gps, setGps] = useState("");
  const [previous, setPrevious] = useState<PreviousCrop>(initial.previous ?? "unknown");
  const [irrigation, setIrrigation] = useState<Irrigation>(initial.irrigation ?? "unconfirmed");
  const [soilTexture, setSoilTexture] = useState<SoilTexture | undefined>(initial.soilTexture);
  const [soilColor, setSoilColor] = useState<SoilColor | undefined>(initial.soilColor);
  const [chosenCrops, setCrops] = useState<CropId[] | null>(initial.crops ?? null);
  const common: CropId[] = province === "Monte Cristi" ? ["arroz", "guineo", "maiz"] : province === "La Vega" ? ["papa", "cebolla", "repollo"] : ["habichuela_roja", "maiz", "yuca"];
  const crops = chosenCrops ?? Array.from(new Set([...allCrops.filter(crop => crop === previous), ...common]));
  const [sowMonth, setSowMonth] = useState(initial.sowMonth ?? now);
  const [priority] = useState<Priority>(initial.priority ?? "water");
  const [pieces, setPieces] = useState<Piece[]>(initial.pieces ?? []);
  const [showMap, setShowMap] = useState(Boolean(initial.pieces?.length));
  const [name, setName] = useState(initial.name ?? (farmCount ? `Finca ${farmCount + 1}` : "Mi finca"));
  const [declaredTareas, setDeclaredTareas] = useState(initial.declaredTareas ?? "");
  const [placeName, setPlaceName] = useState(initial.placeName);
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
    if (!("geolocation" in navigator)) { setGps(text.gpsUnsupported); return; }
    setGps(text.gpsSearching);
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { longitude: pos.coords.longitude, latitude: pos.coords.latitude };
      if (!isInCountry(loc)) { setGps(text.gpsOutside); return; }
      setGps(""); pick(provinceAt(loc) ?? "", loc);
    }, () => setGps(text.gpsError), { timeout: 10000 });
  };
  const { places, loading, unavailable } = usePlaceSearch(search, 8);
  const finish = () => {
    if (!location) return;
    const markedCenter = centroid(pieces);
    const farmProvince = (markedCenter && provinceAt(markedCenter)) || province;
    const area = Number(declaredTareas);
    onDone({
      id: initial.id ?? newFarmId(), name: name.trim() || "Mi finca", pieces,
      province: farmProvince, location: markedCenter ?? location,
      declaredTareas: area > 0 && area <= 100000 ? area : undefined,
      soilTexture,
      soilColor,
      previous, irrigation, crops, sowMonth, priority,
      plan: initial.plan, waterTurn: initial.waterTurn, irrigationDate: initial.irrigationDate,
      placeName: farmProvince === province ? placeName : undefined,
    });
  };

  return <dialog ref={dialog} className="onboarding" aria-label={text.dialog} onCancel={event => { event.preventDefault(); onSkip(); }}>
    <div className="ob-backdrop" aria-hidden="true">
      <div className="ob-backdrop-photo" />
      <div className="ob-backdrop-scrim" />
    </div>
    <div className={step === 2 || (step === 1 && showMap) ? `ob-card ob-card-wide${step === 1 ? " ob-card-mapping" : ""}` : step === 0 ? "ob-card ob-card-location" : "ob-card"}>
      <div className="ob-top">
        {step > 0 ? <button type="button" className="ob-link" onClick={back}>{text.back}</button> : <span className="ob-top-spacer" />}
        <div className="ob-progress-wrap">
          <span className="ob-step-count">Paso {step + 1} de {STEPS}</span>
          <span className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} aria-label={`Paso ${step + 1} de ${STEPS}`}>
            {Array.from({ length: STEPS }, (_, i) => <i key={i} className={i === step ? "on current" : i < step ? "on" : ""} />)}
          </span>
        </div>
        <button type="button" className="ob-link" onClick={onSkip}>{text.skip}</button>
      </div>

      <div className="ob-body" ref={body}>

      {step === 0 && <div className="ob-step">
        <div className="ob-hero-badge" aria-hidden="true"><FarmIcon name="soil" size={28} /></div>
        <h2>{text.where}</h2>
        <p>{text.nearby}</p>
        <button type="button" className="ob-primary" onClick={useGps}><MapPin aria-hidden="true" /> {text.gps}</button>
        {gps && <p role="status">{gps}</p>}
        <div className="ob-divider" aria-hidden="true"><span>{text.manual}</span></div>
        <label className="ob-label">{text.search}
          <div className="ob-search-box">
            <span className="ob-search-icon" aria-hidden="true"><Search size={18} /></span>
            <input type="search" value={search} placeholder={text.example} onChange={e => setSearch(e.target.value)} />
          </div>
        </label>
        {!search.trim() && <span className="ob-sublabel">{text.frequent}</span>}
        <div className={search.trim() ? "ob-grid place-choices" : "ob-grid ob-grid-provinces"}>
          {search.trim() ? places.map(p => (
            <Choice key={p.id} on={p.kind ? placeName === p.name && province === p.province : province === p.name && !placeName} onClick={() => p.kind ? pick(p.province, { longitude: p.longitude, latitude: p.latitude }, p.name) : pick(p.name)}>
              <span className="ob-icon-chip sm" aria-hidden="true"><MapPin size={15} /></span>
              <span>{p.name}{p.kind && <small>{p.kind} · {p.province}</small>}</span>
            </Choice>
          )) : provinces.filter(p => ["San Juan", "Santiago", "La Vega", "Azua", "Monte Cristi", "Valverde"].includes(p.name)).map(p => (
            <Choice key={p.name} on={province === p.name} onClick={() => pick(p.name)}>
              <span className="ob-icon-chip sm" aria-hidden="true"><MapPin size={15} /></span>
              <span>{p.name}</span>
            </Choice>
          ))}
        </div>
        {loading && <p role="status">{text.searching}</p>}
        {unavailable && <p role="status">{text.unavailable}</p>}
        {search.trim().length >= 2 && !places.length && !loading && !unavailable && <p role="status">{text.none}</p>}
      </div>}

      {step === 1 && location && <div className="ob-step ob-step-map">
        <div className={showMap ? "ob-map-head" : "ob-map-head compact"}>
          <div>
            <h2>{initial.id ? "Editar finca" : "Dale un nombre a tu finca"}</h2>
            <p className="ob-place"><MapPin aria-hidden="true" size={16} /> {[placeName, province].filter(Boolean).join(" · ")} <button type="button" className="ob-link" onClick={back}>Cambiar lugar</button></p>
          </div>
          <label className="ob-label ob-name-field">Nombre de esta finca<input value={name} maxLength={40} placeholder="Ej.: Finca del río" onChange={e => setName(e.target.value)} /></label>
        </div>
        <details className="ob-more"><summary>¿Cuántas tareas tiene? (opcional)</summary>
          <label className="ob-label">Área declarada en tareas<input type="number" min="0" max="100000" step="any" value={declaredTareas} onChange={event => setDeclaredTareas(event.target.value === "" ? "" : event.target.valueAsNumber)} /></label>
          <p className="note">Venta usa primero el área que declaras. El mapa y la ubicación usan lo marcado.</p>
        </details>
        {showMap ? <FarmPicker center={location} pieces={pieces} onChange={setPieces} /> : (
          <div className="ob-map-prompt">
            <button type="button" className="ob-map-launch" onClick={() => setShowMap(true)}>
              <span className="ob-icon-chip" aria-hidden="true"><MapPin size={18} /></span>
              <span>Marcar la finca en el mapa (opcional)</span>
            </button>
          </div>
        )}
      </div>}

      {step === 2 && <div className="ob-step ob-step-crops">
        <div className="ob-crops-head">
          <h2>¿Qué siembras tú?</h2>
          <p className="ob-hint">Elige lo último que sembraste. Lo incluimos junto a otras opciones para comparar.</p>
        </div>
        <div className="ob-step3-layout">
          <div className="ob-grid ob-grid-crops">{previousCrops.map(c => <Choice key={c} on={previous === c} onClick={() => { setPrevious(c); if (chosenCrops && allCrops.some(crop => crop === c)) setCrops(Array.from(new Set([...chosenCrops, c as CropId]))); }}><span className="ob-icon-chip sm" aria-hidden="true"><FarmIcon name={c} size={18} /></span><span>{previousCropName(c)}{c === "ajo" ? <small>sin datos todavía</small> : null}</span></Choice>)}
            <Choice on={previous === "otro"} onClick={() => setPrevious("otro")}><span className="ob-icon-chip sm" aria-hidden="true"><FarmIcon name="field" size={18} /></span><span>Otro</span></Choice>
            <Choice on={previous === "unknown"} onClick={() => setPrevious("unknown")}><span className="ob-icon-chip sm" aria-hidden="true"><FarmIcon name="close" size={16} /></span><span>Nada / no sé</span></Choice></div>
          <div className="ob-step3-side">
            <h3 className="ob-sub">¿Tienes riego?</h3>
            <div className="ob-row" role="group" aria-label="¿Tienes riego?">
              <Choice on={irrigation === "irrigated"} onClick={() => setIrrigation("irrigated")}><Droplets size={19} aria-hidden="true" /> Sí {irrigation === "irrigated" && <Check size={18} aria-hidden="true" />}</Choice>
              <Choice on={irrigation === "rainfed"} onClick={() => setIrrigation("rainfed")}><CloudRain size={19} aria-hidden="true" /> No, de lluvia {irrigation === "rainfed" && <Check size={18} aria-hidden="true" />}</Choice>
              <Choice on={irrigation === "unconfirmed"} onClick={() => setIrrigation("unconfirmed")}><CircleHelp size={19} aria-hidden="true" /> No sé {irrigation === "unconfirmed" && <Check size={18} aria-hidden="true" />}</Choice>
            </div>
            <h3 className="ob-sub">¿Cómo es tu tierra? <small>(opcional)</small></h3>
            <div className="ob-row" role="group" aria-label="¿Cómo es tu tierra?">
              <Choice on={soilTexture === "arenosa"} onClick={() => setSoilTexture("arenosa")}>Arenosa</Choice>
              <Choice on={soilTexture === "franca"} onClick={() => setSoilTexture("franca")}>Mezclada</Choice>
              <Choice on={soilTexture === "arcillosa"} onClick={() => setSoilTexture("arcillosa")}>Barro</Choice>
              <Choice on={!soilTexture} onClick={() => setSoilTexture(undefined)}>No sé</Choice>
            </div>
            <p className="ob-hint">Arenosa: suelta, se escurre entre los dedos. Barro: se pega cuando se moja y se agrieta al secarse. Mezclada: ni arena ni barro, se desmorona fácil.</p>
            <h3 className="ob-sub">¿De qué color es tu tierra? <small>(opcional)</small></h3>
            <div className="ob-row" role="group" aria-label="¿De qué color es tu tierra?">
              <Choice on={soilColor === "negra"} onClick={() => setSoilColor("negra")}>Negra</Choice>
              <Choice on={soilColor === "roja"} onClick={() => setSoilColor("roja")}>Roja</Choice>
              <Choice on={soilColor === "amarilla"} onClick={() => setSoilColor("amarilla")}>Amarilla</Choice>
              <Choice on={soilColor === "gris"} onClick={() => setSoilColor("gris")}>Gris</Choice>
              <Choice on={soilColor === "blanca"} onClick={() => setSoilColor("blanca")}>Blanca</Choice>
              <Choice on={!soilColor} onClick={() => setSoilColor(undefined)}>No sé</Choice>
            </div>
            <details className="ob-more ob-compare"><summary>Cambiar los cultivos que se comparan ({crops.length}) <ChevronDown size={19} aria-hidden="true" /></summary>
              <div className="ob-grid ob-grid-compact" tabIndex={0} role="region" aria-label="Cultivos para comparar">{allCrops.map(c => { const on = crops.includes(c); return <Choice key={c} on={on} onClick={() => setCrops(on ? crops.filter(x => x !== c) : [...crops, c])}><span className="ob-icon-chip sm" aria-hidden="true"><FarmIcon name={c} size={18} /></span><span>{cropNames[c]}{c === "ajo" ? " · sin datos todavía" : ""}{on ? " ✓" : ""}</span></Choice>; })}</div>
              <div className="ob-label ag-select-field"><span className="ag-select-label">Mes en que piensas sembrar</span><CustomSelect ariaLabel="Mes en que piensas sembrar" value={String(sowMonth)} options={monthNames.map((m, i) => ({ value: String(i + 1), label: m }))} onChange={val => setSowMonth(Number(val))} /></div>
            </details>
            {!location && <p role="status">Falta elegir dónde está tu finca (paso 1).</p>}
          </div>
        </div>
      </div>}
      </div>
      <footer className="ob-footer">
        <span className="ob-credit" aria-hidden="true">El Cercado, San Juan Valley</span>
        {step > 0 && (step === 1 ? (initial.id ? <>
          <button type="button" className="ob-primary" onClick={finish}>Guardar cambios</button>
          <button type="button" className="link-button" onClick={next}>Cambiar cultivo o riego</button>
        </> : <button type="button" className="ob-primary" onClick={next}>{pieces.length ? `Listo: ${areaLabel(piecesAreaM2(pieces))}` : showMap ? "Listo · seguir sin marcar" : "Seguir sin marcar"}</button>)
          : <button type="button" className="ob-primary" disabled={!location || !crops.length} onClick={finish}><Check aria-hidden="true" /> Listo, ver mi recomendación</button>)}
      </footer>
    </div>
  </dialog>;
}
