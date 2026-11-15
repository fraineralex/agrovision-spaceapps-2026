/* AI: Codex/OpenAI, 2026-11-14; restructured for the farmer audit by Claude (Anthropic), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FaoDroughtCard } from "@/components/fao-giews";
import { FarmIcon } from "@/components/farm-icon";
import { VoiceAssistant } from "@/components/voice-assistant";
import { usePlaceSearch } from "@/lib/place-search";
import { OfflineStatus } from "@/components/offline";
import { AdvisorCard } from "@/components/advisor-card";
import { MarketCard } from "@/components/market-card";
import { Onboarding, type FarmProfile } from "@/components/onboarding";
import { Fold } from "@/components/fold";
import { OptionsCard } from "@/components/options-card";
import { ClipboardList, Download, MapPin, Sprout } from "lucide-react";
import { FarmSwitcher } from "@/components/farm-switcher";
import { loadFarms, saveFarms, piecesAreaM2, piecesToGeoJSON, areaLabel, m2ToTareas, type Farm } from "@/lib/farms";
import { useRain } from "@/components/rain-card";
import { ProfitCard } from "@/components/profit-card";
import { FieldWeek, PlantingPlan, WorkbenchNav } from "@/components/farm-workbench";
import { SaleBudget } from "@/components/sale-budget";
import { ShareButton, type ShareSummary } from "@/components/share-button";
import { adviceSentence, oversupplyFor } from "@/lib/advisor";
import { climate, scoreDefinitions, type Priority, type Irrigation } from "@/lib/data";
import { nationalCenter, provinces, provinceAt, isInCountry, type Location } from "@/lib/geography";
import { getFarmerComparison, pillarColor } from "@/lib/farmer-comparison";
import { adviseNextCrop, cropNames, defaultCrops, monthNames, toTareas, type CropId, type PreviousCrop } from "@/lib/advisor";
import { droughtSignal, faoProvince } from "@/lib/fao-giews";
import type { ClimateContext } from "@/lib/location-climate";
import type { VoiceSelection } from "@/lib/voice-context";
import { fieldMeta, type FieldInfo } from "@/lib/map/fields";
import parcels from "@/public/data/demo-parcels.json";
import { findParcel, parcelEvidence, signalLabels } from "@/lib/map/parcels";
// Main answer weighs water, drought, pests and price equally; the 5-option card shows each goal separately.
const BALANCED = "balanced";
const MapPanel = dynamic(() => import("@/components/map").then(module => module.MapPanel), { loading: () => <p role="status">Cargando mapa…</p> });
const rainWord = (mmDay: number) => mmDay * 30 < 50 ? "Poca lluvia" : mmDay * 30 < 120 ? "Lluvia moderada" : "Mucha lluvia";
const modeKey = "agrovision:view-mode";
type ViewMode = "farmer" | "supervisor";

function downloadFarmBoundary(farm: Farm) {
  const data = piecesToGeoJSON(farm.pieces);
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/geo+json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `parcela-${farm.id}.geojson`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openReport(id: string) {
  const report = document.getElementById(id);
  if (report instanceof HTMLDetailsElement) report.open = true;
}

export default function Home() {
  const [mode, setMode] = useState<ViewMode>("farmer");
  const supervisor = mode === "supervisor";
  const changeMode = (value: ViewMode) => {
    setMode(value);
    try { localStorage.setItem(modeKey, value); } catch { /* Mode still works without storage. */ }
  };
  const [month,setMonth] = useState(new Date().getMonth() + 1);
  const [selectedParcel,setSelectedParcel] = useState("location");
  const [location,setLocation] = useState<Location>(nationalCenter);
  const [chosen,setChosen] = useState(false);
  const [priority,setPriority] = useState<Priority>("water");
  const [irrigation,setIrrigation] = useState<Irrigation>("unconfirmed");
  const [previous,setPrevious] = useState<PreviousCrop>("unknown");
  const [field,setField] = useState<FieldInfo | null>(null);
  const [context,setContext] = useState<{key:string;data:ClimateContext} | null>(null);
  const [climateStatus,setClimateStatus] = useState("");
  const [provinceSearch,setProvinceSearch] = useState("");
  const [gpsStatus,setGpsStatus] = useState("");
  const [mapOpen,setMapOpen] = useState(false);
  const [mapPlace,setMapPlace] = useState("");
  const [crops,setCrops] = useState<CropId[]>(defaultCrops);
  const [onboarding,setOnboarding] = useState(false);
  const applyProfile = useCallback((pr:FarmProfile) => {
    setLocation(pr.location);setMapPlace(pr.placeName ?? "");setSelectedParcel("location");setField(null);setChosen(true);setPrevious(pr.previous);setIrrigation(pr.irrigation);setCrops(pr.crops);setMonth(pr.plan?.sowMonth ?? pr.sowMonth);setPriority(pr.priority);
  },[]);
  const [farms,setFarms] = useState<Farm[]>([]);
  const [activeId,setActiveId] = useState<string|null>(null);
  const [editing,setEditing] = useState<Farm|null>(null);
  const activeFarm = farms.find(f => f.id === activeId) ?? farms[0] ?? null;
  // First visit: ask the farmer about the farm. Later visits reuse the saved farms (this device only).
  useEffect(() => {
    const { farms: saved, active } = loadFarms();
    const timer = setTimeout(() => {
      try { if (localStorage.getItem(modeKey) === "supervisor") setMode("supervisor"); } catch { /* Default to farmer mode. */ }
      if (saved.length) { setFarms(saved); const a = saved.find(f => f.id === active) ?? saved[0]; setActiveId(a.id); applyProfile(a); }
    }, 0);
    return () => clearTimeout(timer);
  },[applyProfile]);
  const selectFarm = (id:string) => { const f = farms.find(x => x.id === id); if (!f) return; setActiveId(id); applyProfile(f); saveFarms(farms, id); window.scrollTo({top:0}); };
  const deleteFarm = (id:string) => { const rest = farms.filter(f => f.id !== id); setFarms(rest); const next = rest[0] ?? null; setActiveId(next?.id ?? null); if (next) applyProfile(next); else { setChosen(false); setPrevious("unknown"); setIrrigation("unconfirmed"); setOnboarding(true); } saveFarms(rest, next?.id ?? null); };
  const updateFarm = (patch: Partial<Pick<Farm, "plan" | "irrigationDate" | "waterTurn">>) => {
    if (!activeFarm) return false;
    const list = farms.map(farm => farm.id === activeFarm.id ? { ...farm, ...patch } : farm);
    if (!saveFarms(list, activeFarm.id)) return false;
    setFarms(list);
    return true;
  };
  const finishOnboarding = (farm:Farm) => {
    const list = farms.some(f => f.id === farm.id) ? farms.map(f => f.id === farm.id ? farm : f) : [...farms, farm];
    setFarms(list); setActiveId(farm.id); applyProfile(farm); setOnboarding(false); setEditing(null); saveFarms(list, farm.id); window.scrollTo({top:0});
  };
  const searchRef = useRef<HTMLInputElement>(null);
  // Text typed before hydration on slow phones must not be lost.
  useEffect(() => { const typed = searchRef.current?.value; if (typed) setProvinceSearch(typed); }, []);
  const locationKey = `${location.longitude.toFixed(3)},${location.latitude.toFixed(3)}`;
  const onLocation = useCallback((point:Location) => {setLocation(point);setMapPlace("");setSelectedParcel("location");setField(null);setChosen(true);},[]);
  const onSelect = useCallback((id:string) => {
    const detected = findParcel(id);
    const demo = parcels.features.find(p => p.id === id)?.geometry.coordinates[0][0];
    if (detected) onLocation({longitude:detected.properties.center[0],latitude:detected.properties.center[1]});
    else if (demo) onLocation({longitude:demo[0]+.005,latitude:demo[1]+.004});
    else return;
    setSelectedParcel(id);
  },[onLocation]);
  const onField = useCallback((f:FieldInfo) => {onLocation({longitude:f.center[0],latitude:f.center[1]});setField(f);},[onLocation]);
  const useGps = () => {
    if (!("geolocation" in navigator)) { setGpsStatus("Tu teléfono no permite ubicación."); return; }
    setGpsStatus("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(pos => { const point = { longitude: pos.coords.longitude, latitude: pos.coords.latitude }; if (isInCountry(point)) { onLocation(point); setGpsStatus(""); } else setGpsStatus("Tu ubicación no está en República Dominicana."); }, () => setGpsStatus("No se pudo obtener tu ubicación. Elige tu provincia."), { timeout: 10000 });
  };
  useEffect(() => {
    if (selectedParcel !== "location" || !chosen) return;
    const controller = new AbortController();
    const load = async () => {
      setClimateStatus("Consultando clima…");
      try {
        let data:ClimateContext;
        try { const saved = localStorage.getItem(`power:${locationKey}`); if (!saved) throw new Error(); data = JSON.parse(saved); }
        catch { const bundled = await fetch(`/data/power/${locationKey}.json`,{signal:controller.signal}); if (bundled.ok) data = await bundled.json(); else { const response = await fetch(`/api/climate?longitude=${location.longitude}&latitude=${location.latitude}`,{signal:controller.signal}); if (!response.ok) throw new Error(); data = await response.json(); } }
        if (controller.signal.aborted) return;
        setContext({key:locationKey,data});setClimateStatus("");try {localStorage.setItem(`power:${locationKey}`,JSON.stringify(data));} catch { /* Storage is optional. */ }
      } catch {if (!controller.signal.aborted) setClimateStatus("Clima no disponible aquí. Prueba una provincia o vuelve a conectar.");}
    };
    void load();return () => controller.abort();
  },[locationKey,location.longitude,location.latitude,selectedParcel,chosen]);

  const selectedClimate = selectedParcel !== "location" ? climate.monthlyClimatology.find(m => m.month === month) : context?.key === locationKey ? context.data.monthly.find(m => m.month === month) : null;
  const detectedParcel = findParcel(selectedParcel);
  const province = chosen ? provinceAt(location) : undefined;
  const farmProvince = activeFarm?.province || province;
  const sanJuan = selectedParcel !== "location" || province === "San Juan";
  const selectedContext = context?.key === locationKey ? context.data : null;
  const ordered = useMemo(() => getFarmerComparison(sanJuan,selectedContext,priority),[sanJuan,selectedContext,priority]);
  const ranked = useMemo(() => adviseNextCrop({ province: farmProvince, irrigation, previous, sowMonth: month, priority: BALANCED, crops }), [farmProvince, irrigation, previous, month, crops]);
  const topAdvice = ranked[0];
  const topCrop = topAdvice?.crop ?? "habichuela_roja";
  const farmAreaM2 = activeFarm ? piecesAreaM2(activeFarm.pieces) : 0;
  const farmTareas = farmAreaM2 ? m2ToTareas(farmAreaM2) : null;
  const rain = useRain(chosen ? (activeFarm?.location ?? location) : null);
  const glut = topAdvice && topAdvice.harvestMonth ? oversupplyFor(topCrop, topAdvice.harvestMonth) : null;
  const rainSentence = rain.cached ? undefined : rain.alert?.sentence;
  const shareSummary: ShareSummary = { farm: activeFarm?.name ?? "Mi finca", place: farmProvince ?? "República Dominicana", area: farmAreaM2 ? areaLabel(farmAreaM2) : "", advice: activeFarm?.plan ? `Mi plan: ${cropNames[activeFarm.plan.crop]} en ${monthNames[activeFarm.plan.sowMonth - 1]}.` : adviceSentence(topAdvice, previous), rain: rainSentence, oversupply: activeFarm?.plan ? undefined : glut?.sentence };
  const saleCrop = activeFarm?.plan?.crop ?? topCrop;
  const selection: VoiceSelection = {parcelId: activeFarm ? "location" : (selectedParcel.startsWith("sj-unit-") ? "location" : selectedParcel) as VoiceSelection["parcelId"],location: activeFarm?.location ?? location,priority:BALANCED,month,irrigation,previousCrop:previous,crops:crops.join(","),farmArea:farmAreaM2?areaLabel(farmAreaM2):undefined,rainAlert:rainSentence,oversupply:glut?.sentence};
  const source = selectedParcel !== "location" ? { url:climate.source.url,period:"2016–2025",scale:"Regional · ~50 km · San Juan",quality:"Sin validación local",method:"Reanálisis histórico" } : context?.key === locationKey ? context.data.source : null;
  const { places, loading: placesLoading, unavailable: placesUnavailable } = usePlaceSearch(provinceSearch, 6);
  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    {onboarding && <Onboarding key={editing?.id ?? "new"} initial={editing ?? {}} farmCount={farms.length} onDone={finishOnboarding} onSkip={() => { setOnboarding(false); setEditing(null); }}/>}
    <header className="topbar" role="banner"><div className="brand"><span className="brand-mark"><FarmIcon name="soil"/></span>AgroVision</div><OfflineStatus/></header>
    <main id="contenido" className="workspace" tabIndex={-1}>
      <div className="heading-row"><h1>{supervisor ? "Supervisión de fincas" : "Mi finca"}</h1>
        <div className="mode-switch" role="group" aria-label="Modo de uso">
          <button type="button" aria-pressed={!supervisor} onClick={() => changeMode("farmer")}><Sprout aria-hidden="true"/> Agricultor</button>
          <button type="button" aria-pressed={supervisor} onClick={() => changeMode("supervisor")}><ClipboardList aria-hidden="true"/> Supervisor</button>
        </div>
      </div>

      {farms.length > 0 && <FarmSwitcher farms={farms} activeId={activeFarm?.id ?? null} onSelect={selectFarm} onAdd={() => { setEditing(null); setOnboarding(true); }} onEdit={f => { setEditing(f); setOnboarding(true); }} onDelete={deleteFarm}/>}
      <WorkbenchNav/>
      {supervisor && <nav className="supervisor-tools" aria-label="Herramientas de supervisión">
        <a href="#tu-finca-en-el-mapa">Parcelas</a><a href="#diagnostico" onClick={() => openReport("diagnostico")}>Clima y mercado</a><a href="#rotaciones" onClick={() => openReport("rotaciones")}>Rotaciones</a>
      </nav>}
      <FieldWeek key={activeFarm?.id ?? "new"} farm={activeFarm} province={province} rain={rain} onIrrigationDate={irrigationDate => updateFarm({ irrigationDate, waterTurn: undefined })} onAdd={() => setOnboarding(true)} onLocation={onLocation}/>
      <div className="home-grid">
      <div className="col-main">
      <Fold id="siembra" icon="🌱" title="Plan de siembra">
        {activeFarm && <PlantingPlan key={activeFarm.id} farm={activeFarm} sowMonth={month} onMonth={setMonth} onSave={plan => updateFarm({ plan })}/>}
        {chosen ? <AdvisorCard province={farmProvince} irrigation={irrigation} previous={previous} sowMonth={month} priority={BALANCED} crops={crops} onEdit={() => { setEditing(activeFarm); setOnboarding(true); }}/>
          : <button className="workbench-button" type="button" onClick={() => setOnboarding(true)}>Empieza con tu provincia</button>}
      </Fold>
      {chosen && supervisor && <OptionsCard province={farmProvince} irrigation={irrigation} previous={previous} sowMonth={month} crops={crops}/>}
      {chosen && <ShareButton summary={shareSummary}/>}
      </div>
      <div className="col-side">
      <Fold id="cuanto-me-deja" icon="💵" title="¿A cuánto debo vender?">
        <SaleBudget key={activeFarm?.id ?? "new"}/>
        {supervisor && <details className="workbench-details"><summary>Consultar costos y precios de referencia</summary>
          <ProfitCard key={`${saleCrop}/${activeFarm?.id}`} crops={crops.includes(saleCrop) ? crops : [saleCrop, ...crops]} initialCrop={saleCrop} tareas={farmTareas}/>
        </details>}
      </Fold>
      <Fold icon="🗺️" title="Tu finca en el mapa" teaser={field ? `Tu parcela: unas ${toTareas(field.areaHa)} tareas` : "Mira tu zona por satélite y toca tu finca"}>
      <section className="card location-card" aria-label="Elige tu zona"><div className="section-row"><h2>Explora el mapa</h2><span className="place" role="status">{[mapPlace, province].filter(Boolean).join(" · ") || "Sin elegir"}</span></div>
        {activeFarm && <p className="note">Explora otras zonas aquí. Para cambiar la ubicación guardada, edita tu finca.</p>}
        <div className="location-controls">
          <button type="button" className="gps-button" onClick={useGps}><MapPin aria-hidden="true"/> Usar mi ubicación</button>
          <label>Busca un lugar en RD<input ref={searchRef} type="search" placeholder="Ej.: Pedro Brand" value={provinceSearch} onChange={e => setProvinceSearch(e.target.value)}/></label>
          {places.length > 0 && <div className="search-results" role="group" aria-label="Lugares encontrados">{places.map(p => <button type="button" key={p.id} onClick={() => {onLocation({longitude:p.longitude,latitude:p.latitude});setMapPlace(p.kind ? p.name : "");setProvinceSearch("");setMapOpen(true);searchRef.current?.focus();}}>{p.name}{p.kind && <small>{p.kind} · {p.province}</small>}</button>)}</div>}
          {placesLoading && <p role="status">Buscando lugares…</p>}
          {placesUnavailable && <p role="status">Catálogo temporalmente no disponible. Puedes escoger una provincia.</p>}
          {provinceSearch.trim().length >= 2 && !places.length && !placesLoading && !placesUnavailable && <p role="status">No encontramos ese lugar.</p>}
          <label>O escoge de la lista<select aria-label="Provincia" value={province ?? ""} onChange={e => {const p = provinces.find(p => p.name === e.target.value);if (p) onLocation({longitude:p.longitude,latitude:p.latitude});}}><option value="" disabled>Selecciona</option>{provinces.map(p => <option key={p.name}>{p.name}</option>)}</select></label>
          {gpsStatus && <p role="status">{gpsStatus}</p>}
        </div>
        {mapOpen ? <MapPanel selected={selectedParcel} onSelect={onSelect} location={location} onLocation={onLocation} onField={onField} advanced={supervisor}/> : <button type="button" className="workbench-button" onClick={() => setMapOpen(true)}>Abrir mapa satelital</button>}
        {supervisor && activeFarm && <div className="parcel-export">
          <button type="button" className="link-button" disabled={!activeFarm.pieces.length} onClick={() => downloadFarmBoundary(activeFarm)}><Download aria-hidden="true"/> Descargar parcela (GeoJSON)</button>
          <p className="note">{activeFarm.pieces.length ? "Límites aproximados guardados en esta finca." : "Marca la finca en el mapa desde Editar para descargar el contorno."}</p>
        </div>}
        {(field || detectedParcel) && <article className="card parcel-card" aria-label="Tu parcela" aria-live="polite">
          <h3>Tu parcela{field ? `: unas ${toTareas(field.areaHa)} tareas` : detectedParcel ? `: unas ${toTareas(detectedParcel.properties.areaHa)} tareas` : ""}</h3>
          {detectedParcel && <p className="parcel-green"><i className={`light ${detectedParcel.properties.signal === "high" ? "green" : detectedParcel.properties.signal === "mid" ? "amber" : detectedParcel.properties.signal === "low" ? "red" : "gray"}`}/> {signalLabels[detectedParcel.properties.signal]} ({detectedParcel.properties.latestObservedMonth})</p>}
          {supervisor && <details className="evidence-details"><summary>Ver detalles de la parcela</summary>
            {field && <p>Borde aproximado: {field.areaHa.toFixed(2)} ha ({toTareas(field.areaHa)} tareas; 1 tarea = 628,86 m²). {fieldMeta.method} {fieldMeta.limitations} {fieldMeta.attribution}</p>}
            {detectedParcel && <>
              <p>Verdor (NDVI) {detectedParcel.properties.latestNdvi?.toFixed(2) ?? "sin datos"} · {detectedParcel.properties.latestObservedMonth}. Unidad de análisis satelital de {detectedParcel.properties.areaHa} ha.</p>
              <p>Copernicus Sentinel-2 L2A / Element 84 · enero 2024–noviembre 2026 · píxel de 10 m. {parcelEvidence.signalRule} {parcelEvidence.limitation}</p>
              <div className="ndvi-bars">{detectedParcel.properties.ndviSeries.slice(-12).map(row => <div key={row.month}><span>{row.month}</span><meter min={-1} max={1} value={row.value ?? -1} aria-label={`Verdor ${row.month}`}/><strong>{row.value?.toFixed(2) ?? "Sin dato"}</strong></div>)}</div>
              <p><a href={parcelEvidence.provenance[0].url}>Fuente Sentinel-2</a> · Contiene datos Copernicus modificados (2024–2026).</p>
            </>}
          </details>}
        </article>}
      </section>
      </Fold>
      {supervisor && <details id="diagnostico" className="card visual-extras"><summary>Mercado y clima regional</summary>
      <Fold icon="💰" title="Precio y mercado"><MarketCard key={saleCrop} initialCrop={saleCrop}/></Fold>

      {province && <Fold icon="☀️" title="Sequía y lluvia" teaser={`${province}: ${droughtSignal(faoProvince(province)).label}`}><FaoDroughtCard province={province}/></Fold>}

      {chosen && <Fold icon="🌡️" title={`Clima normal de ${monthNames[month - 1]}`} teaser={selectedClimate?.temperatureC != null ? `${Math.round(selectedClimate.temperatureC)} °C de media` : "Promedio de 10 años (NASA POWER)"}><section className="card climate-card" aria-label="Clima de tu zona"><div className="section-row"><h2>Clima normal de {monthNames[month - 1]}</h2></div>
        {selectedClimate ? <><div className="climate-strip">
          <div className="climate-cell"><FarmIcon name="climate"/><div className="climate-val">{selectedClimate.temperatureC != null ? Math.round(selectedClimate.temperatureC) : "—"} °C</div><div>Temperatura media</div></div>
          <div className="climate-cell"><FarmIcon name="water"/><div className="climate-val">{selectedClimate.precipitationMmDay != null ? rainWord(selectedClimate.precipitationMmDay) : "—"}</div><div>{selectedClimate.precipitationMmDay != null ? `unos ${Math.round(selectedClimate.precipitationMmDay * 30)} mm en el mes` : "Lluvia"}</div></div>
        </div>
        <p className="note">Promedio de 10 años (2016–2025) de un cuadro de unos 50 km. Si ese cuadro incluye lomas, en el llano puede llover menos y hacer más calor.</p>
        <p className="note"><a href={source?.url}>NASA POWER</a> · {source?.period} · {source?.scale}. {source?.method}. {source?.quality}. Media histórica del mes, no pronóstico ni medición de finca. Humedad relativa: {selectedClimate.relativeHumidityPct != null ? Math.round(selectedClimate.relativeHumidityPct) : "—"}%. La lluvia por satélite/reanálisis en el trópico tiene errores; no se usa para la recomendación (la sequía viene de FAO GIEWS).</p></> : <p role="status">{climateStatus || "Sin datos para este punto"}</p>}
      </section></Fold>}
      </details>}
      </div>
      </div>

      <VoiceAssistant selection={selection}/>

      {supervisor && <details id="rotaciones" className="card landscape-details"><summary>Rotaciones de ejemplo y modelo de riego (San Juan)</summary>
        <p>Secuencias ilustrativas con riego neto modelado (NASA POWER + FAO-56) para el Valle de San Juan; en otras provincias, indicador genérico. Iconos: agua, clima, plagas, mercado.</p>
        <div className="scenario-grid">{ordered.map(s => <article key={s.id} className="card scenario-card" data-scenario={s.id}>
          <h3>{s.label}</h3>
          <div className="farmer-pillars" aria-label="Agua y suelo, clima, plagas y mercado">{scoreDefinitions.map(p => {
            const score=s.scores[p.id];
            const label=score===null?"Sin datos suficientes":score>=3.34?"Favorable":score>=1.67?"Revisar":"Menos favorable";
            return <span key={p.id} className={`farmer-pillar ${pillarColor(score)}`} role="img" aria-label={`${p.label}: ${label}`} title={`${p.label}: ${label}`}><FarmIcon name={p.id} size={28}/></span>;
          })}</div>
          {s.pestPrecautions.length > 0 && <div><strong>Precauciones de plagas</strong><ul>{s.pestPrecautions.map(note => <li key={note}>{note}</li>)}</ul></div>}
          <details className="evidence-details"><summary>Ver detalles</summary>
            <p>Fechas ilustrativas: {s.dates}.</p>
            {scoreDefinitions.map(p=><p key={p.id}><strong>{p.label}</strong>: {s.details[p.id]} <a href={s.sourceUrls[p.id]}>Fuente</a></p>)}
          </details>
        </article>)}</div>
      </details>}

      <footer className="provenance about">
        <p><strong>¿Quién hace AgroVision?</strong> Estudiantes de Ingeniería en TIC de UNIBE (Santo Domingo), equipo AgroVision, para el NASA Space Apps Challenge 2026. No vendemos insumos ni semillas.</p>
        <p><strong>Datos:</strong> NASA POWER, NASA GIBS (MODIS, IMERG), Copernicus Sentinel-2, FAO GIEWS, FAO-56, Ministerio de Agricultura (precios, siembras y costos), IDIAF. Es una guía, no sustituye a tu técnico o extensionista.</p>
        <a href="/data/manifest.json">Fuentes y versión de datos</a>
        <a href="https://www.geonames.org/export/">Lugares de RD · GeoNames (CC BY)</a>
      </footer>
    </main>
  </>;
}
