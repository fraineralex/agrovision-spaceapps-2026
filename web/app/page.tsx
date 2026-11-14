/* AI: Codex/OpenAI, 2026-11-14; restructured for the farmer audit by Claude (Anthropic), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaoDroughtCard } from "@/components/fao-giews";
import { MapPanel } from "@/components/map";
import { FarmIcon } from "@/components/farm-icon";
import { VoiceAssistant } from "@/components/voice-assistant";
import { OfflineStatus } from "@/components/offline";
import { AdvisorCard } from "@/components/advisor-card";
import { MarketCard } from "@/components/market-card";
import { Onboarding, type FarmProfile } from "@/components/onboarding";
import { Fold } from "@/components/fold";
import { FarmSwitcher } from "@/components/farm-switcher";
import { loadFarms, saveFarms, piecesAreaM2, areaLabel, m2ToTareas, type Farm } from "@/lib/farms";
import { RainCard, useRain } from "@/components/rain-card";
import { ProfitCard } from "@/components/profit-card";
import { ShareButton, type ShareSummary } from "@/components/share-button";
import { adviceSentence, oversupplyFor } from "@/lib/advisor";
import { profitFor, rd } from "@/lib/profit";
import { climate, scoreDefinitions, type Priority, type Irrigation } from "@/lib/data";
import { nationalCenter, provinces, provinceAt, isInCountry, type Location } from "@/lib/geography";
import { getFarmerComparison, pillarColor } from "@/lib/farmer-comparison";
import { adviseNextCrop, cropEmoji, cropNames, defaultCrops, marketFor, monthNames, toTareas, unitWord, type CropId, type PreviousCrop } from "@/lib/advisor";
import { droughtSignal, faoProvince } from "@/lib/fao-giews";
import type { ClimateContext } from "@/lib/location-climate";
import type { VoiceSelection } from "@/lib/voice-context";
import { fieldMeta, type FieldInfo } from "@/lib/map/fields";
import parcels from "@/public/data/demo-parcels.json";
import { findParcel, parcelEvidence, signalLabels } from "@/lib/map/parcels";
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const rainWord = (mmDay: number) => mmDay * 30 < 50 ? "Poca lluvia" : mmDay * 30 < 120 ? "Lluvia moderada" : "Mucha lluvia";

export default function Home() {
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
  const [crops,setCrops] = useState<CropId[]>(defaultCrops);
  const [onboarding,setOnboarding] = useState(false);
  const applyProfile = useCallback((pr:FarmProfile) => {
    setLocation(pr.location);setSelectedParcel("location");setChosen(true);setPrevious(pr.previous);setIrrigation(pr.irrigation);setCrops(pr.crops);setMonth(pr.sowMonth);setPriority(pr.priority);
  },[]);
  const [farms,setFarms] = useState<Farm[]>([]);
  const [activeId,setActiveId] = useState<string|null>(null);
  const [editing,setEditing] = useState<Farm|null>(null);
  const activeFarm = farms.find(f => f.id === activeId) ?? farms[0] ?? null;
  // First visit: ask the farmer about the farm. Later visits reuse the saved farms (this device only).
  useEffect(() => {
    const { farms: saved, active } = loadFarms();
    const timer = setTimeout(() => {
      if (saved.length) { setFarms(saved); const a = saved.find(f => f.id === active) ?? saved[0]; setActiveId(a.id); applyProfile(a); }
      else setOnboarding(true);
    }, 0);
    return () => clearTimeout(timer);
  },[applyProfile]);
  const selectFarm = (id:string) => { const f = farms.find(x => x.id === id); if (!f) return; setActiveId(id); applyProfile(f); saveFarms(farms, id); window.scrollTo({top:0}); };
  const deleteFarm = (id:string) => { const rest = farms.filter(f => f.id !== id); setFarms(rest); const next = rest[0] ?? null; setActiveId(next?.id ?? null); if (next) applyProfile(next); else setOnboarding(true); saveFarms(rest, next?.id ?? null); };
  const finishOnboarding = (farm:Farm) => {
    const list = farms.some(f => f.id === farm.id) ? farms.map(f => f.id === farm.id ? farm : f) : [...farms, farm];
    setFarms(list); setActiveId(farm.id); applyProfile(farm); setOnboarding(false); setEditing(null); saveFarms(list, farm.id); window.scrollTo({top:0});
  };
  const searchRef = useRef<HTMLInputElement>(null);
  // Text typed before hydration on slow phones must not be lost.
  useEffect(() => { const typed = searchRef.current?.value; if (typed) setProvinceSearch(typed); }, []);
  const locationKey = `${location.longitude.toFixed(3)},${location.latitude.toFixed(3)}`;
  const onSelect = useCallback((id:string) => { const detected=findParcel(id);if(detected){setLocation({longitude:detected.properties.center[0],latitude:detected.properties.center[1]});setSelectedParcel(id);setChosen(true);return;} const parcel = parcels.features.find(p => p.id === id); if (!parcel) return; const p = parcel.geometry.coordinates[0][0]; setLocation({longitude:p[0]+.005,latitude:p[1]+.004});setSelectedParcel(id);setChosen(true); },[]);
  const onLocation = useCallback((point:Location) => {setLocation(point);setSelectedParcel("location");setField(null);setChosen(true);},[]);
  const onField = useCallback((f:FieldInfo) => {setField(f);setLocation({longitude:f.center[0],latitude:f.center[1]});setChosen(true);},[]);
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
  const sanJuan = selectedParcel !== "location" || province === "San Juan";
  const selectedContext = context?.key === locationKey ? context.data : null;
  const ordered = useMemo(() => getFarmerComparison(sanJuan,selectedContext,priority),[sanJuan,selectedContext,priority]);
  const ranked = useMemo(() => adviseNextCrop({ province, irrigation, previous, sowMonth: month, priority, crops }), [province, irrigation, previous, month, priority, crops]);
  const topAdvice = ranked[0];
  const topCrop = topAdvice?.crop ?? "habichuela_roja";
  const farmAreaM2 = activeFarm ? piecesAreaM2(activeFarm.pieces) : 0;
  const farmTareas = farmAreaM2 ? m2ToTareas(farmAreaM2) : null;
  const rain = useRain(chosen ? (activeFarm?.location ?? location) : null);
  const profit = profitFor(topCrop, farmTareas ?? 10);
  const profitText = "unavailable" in profit ? undefined : `${topAdvice?.name ?? ""} en ${Math.round(profit.tareas)} tareas: entre ${rd(profit.profit.low)} y ${rd(profit.profit.high)} (con el precio de hoy ${rd(profit.profit.mid)}), dato aproximado a precio mayorista`;
  const glut = topAdvice && topAdvice.harvestMonth ? oversupplyFor(topCrop, topAdvice.harvestMonth) : null;
  const shareSummary: ShareSummary = { farm: activeFarm?.name ?? "Mi finca", place: province ?? "República Dominicana", area: farmAreaM2 ? areaLabel(farmAreaM2) : "", advice: adviceSentence(topAdvice, previous), rain: rain.alert?.sentence, profit: profitText, oversupply: glut?.sentence };
  const topMarket = marketFor(topCrop);
  const farmName = activeFarm?.name; const rainSentence = rain.alert?.sentence; const glutSentence = glut?.sentence;
  const selection: VoiceSelection = {parcelId:(selectedParcel.startsWith("sj-unit-") ? "location" : selectedParcel) as VoiceSelection["parcelId"],location,priority,month,irrigation,previousCrop:previous,crops:crops.join(","),farmName:farmName,farmArea:farmAreaM2?areaLabel(farmAreaM2):undefined,rainAlert:rainSentence,profitRange:profitText,oversupply:glutSentence};
  const source = selectedParcel !== "location" ? { url:climate.source.url,period:"2016–2025",scale:"Regional · ~50 km · San Juan",quality:"Sin validación local",method:"Reanálisis histórico" } : context?.key === locationKey ? context.data.source : null;
  const matches = provinceSearch.trim() ? provinces.filter(p => fold(p.name).includes(fold(provinceSearch.trim()))).slice(0, 6) : [];
  return <main className="app-shell">
    {onboarding && <Onboarding key={editing?.id ?? "new"} initial={editing ?? {}} farmCount={farms.length} onDone={finishOnboarding} onSkip={() => { setOnboarding(false); setEditing(null); }}/>}
    <header className="topbar"><div className="brand"><span className="brand-mark"><FarmIcon name="soil"/></span>AgroVision</div><OfflineStatus/></header>
    <div className="workspace">
      <div className="heading-row"><div><h1>¿Qué siembro ahora?</h1><p className="subtitle">Con datos de la NASA, la FAO y el Ministerio de Agricultura, te decimos qué conviene sembrar en tu finca y por qué.</p></div></div>

      {farms.length > 0 && <FarmSwitcher farms={farms} activeId={activeFarm?.id ?? null} onSelect={selectFarm} onAdd={() => { setEditing(null); setOnboarding(true); }} onEdit={f => { setEditing(f); setOnboarding(true); }} onDelete={deleteFarm}/>}
      <AdvisorCard province={province} irrigation={irrigation} previous={previous} sowMonth={month} priority={priority} crops={crops} onEdit={() => { setEditing(activeFarm); setOnboarding(true); }}/>
      {chosen && <ShareButton summary={shareSummary}/>}
      {chosen && <Fold icon="🌧️" title="Lluvia esta semana" teaser={rain.alert?.sentence ?? (rain.error || "Pronóstico de 7 días para tu finca")}><RainCard rain={rain}/></Fold>}
      <Fold icon="💵" title="¿Cuánto me deja?" teaser={"unavailable" in profit ? "Calcula costo, venta y ganancia por tareas" : `${topAdvice?.name}: ${rd(profit.profit.low)} a ${rd(profit.profit.high)} en ${Math.round(profit.tareas)} tareas`}><ProfitCard key={`${topCrop}/${activeFarm?.id}`} crops={crops} initialCrop={topCrop} tareas={farmTareas}/></Fold>
      <Fold icon="💰" title="Precio y mercado" teaser={topMarket?.latest ? `${cropEmoji[topCrop]} ${cropNames[topCrop]}: RD$${Math.round(topMarket.latest.price)} ${unitWord(topMarket.unit)} al por mayor` : "Precios oficiales del Ministerio de Agricultura"}><MarketCard key={topCrop} initialCrop={topCrop}/></Fold>
      <Fold icon="🗺️" title="Tu finca en el mapa" teaser={field ? `Tu parcela: unas ${toTareas(field.areaHa)} tareas` : "Mira tu zona por satélite y toca tu finca"}>
      <section className="card location-card" aria-label="Elige tu zona"><div className="section-row"><h2>3 · Tu finca en el mapa</h2><span className="place">{province ?? "Sin elegir"}</span></div>
        <div className="location-controls">
          <button type="button" className="gps-button" onClick={useGps}>📍 Usar mi ubicación</button>
          <label>Escribe tu provincia<input ref={searchRef} type="search" placeholder="Ej.: San Juan" value={provinceSearch} onChange={e => setProvinceSearch(e.target.value)}/></label>
          {matches.length > 0 && <div className="search-results" role="group" aria-label="Provincias encontradas">{matches.map(p => <button type="button" aria-pressed={province === p.name} key={p.name} onClick={() => {onLocation({longitude:p.longitude,latitude:p.latitude});setProvinceSearch("");}}>{p.name}</button>)}</div>}
          {provinceSearch.trim() && matches.length === 0 && <p role="status">No encontramos esa provincia. Revisa el nombre.</p>}
          <label>O escoge de la lista<select aria-label="Provincia" value={province ?? ""} onChange={e => {const p = provinces.find(p => p.name === e.target.value);if (p) onLocation({longitude:p.longitude,latitude:p.latitude});}}><option value="" disabled>Selecciona</option>{provinces.map(p => <option key={p.name}>{p.name}</option>)}</select></label>
          {gpsStatus && <p role="status">{gpsStatus}</p>}
        </div>
        <MapPanel selected={selectedParcel} onSelect={onSelect} location={location} onLocation={onLocation} onField={onField}/>
        {(field || detectedParcel) && <article className="card parcel-card" aria-label="Tu parcela" aria-live="polite">
          <h3>Tu parcela{field ? `: unas ${toTareas(field.areaHa)} tareas` : detectedParcel ? `: unas ${toTareas(detectedParcel.properties.areaHa)} tareas` : ""}</h3>
          {detectedParcel && <p className="parcel-green"><i className={`light ${detectedParcel.properties.signal === "high" ? "green" : detectedParcel.properties.signal === "mid" ? "amber" : detectedParcel.properties.signal === "low" ? "red" : "gray"}`}/> {signalLabels[detectedParcel.properties.signal]} ({detectedParcel.properties.latestObservedMonth})</p>}
          <details className="evidence-details"><summary>Ver detalles de la parcela</summary>
            {field && <p>Borde aproximado: {field.areaHa.toFixed(2)} ha ({toTareas(field.areaHa)} tareas; 1 tarea = 628,86 m²). {fieldMeta.method} {fieldMeta.limitations} {fieldMeta.attribution}</p>}
            {detectedParcel && <>
              <p>Verdor (NDVI) {detectedParcel.properties.latestNdvi?.toFixed(2) ?? "sin datos"} · {detectedParcel.properties.latestObservedMonth}. Unidad de análisis satelital de {detectedParcel.properties.areaHa} ha.</p>
              <p>Copernicus Sentinel-2 L2A / Element 84 · enero 2024–noviembre 2026 · píxel de 10 m. {parcelEvidence.signalRule} {parcelEvidence.limitation}</p>
              <div className="ndvi-bars">{detectedParcel.properties.ndviSeries.slice(-12).map(row => <div key={row.month}><span>{row.month}</span><meter min={-1} max={1} value={row.value ?? -1} aria-label={`Verdor ${row.month}`}/><strong>{row.value?.toFixed(2) ?? "Sin dato"}</strong></div>)}</div>
              <p><a href={parcelEvidence.provenance[0].url}>Fuente Sentinel-2</a> · Contiene datos Copernicus modificados (2024–2026).</p>
            </>}
          </details>
        </article>}
      </section>
      </Fold>

      {province && <Fold icon="☀️" title="Sequía y lluvia" teaser={`${province}: ${droughtSignal(faoProvince(province)).label}`}><FaoDroughtCard province={province}/></Fold>}

      {chosen && <Fold icon="🌡️" title={`Clima normal de ${monthNames[month - 1]}`} teaser={selectedClimate?.temperatureC != null ? `${Math.round(selectedClimate.temperatureC)} °C de media` : "Promedio de 10 años (NASA POWER)"}><section className="card climate-card" aria-label="Clima de tu zona"><div className="section-row"><h2>Clima normal de {monthNames[month - 1]}</h2></div>
        {selectedClimate ? <><div className="climate-strip">
          <div className="climate-cell"><FarmIcon name="climate"/><div className="climate-val">{selectedClimate.temperatureC != null ? Math.round(selectedClimate.temperatureC) : "—"} °C</div><div>Temperatura media</div></div>
          <div className="climate-cell"><FarmIcon name="water"/><div className="climate-val">{selectedClimate.precipitationMmDay != null ? rainWord(selectedClimate.precipitationMmDay) : "—"}</div><div>{selectedClimate.precipitationMmDay != null ? `unos ${Math.round(selectedClimate.precipitationMmDay * 30)} mm en el mes` : "Lluvia"}</div></div>
        </div>
        <p className="note">Promedio de 10 años (2016–2025) de un cuadro de unos 50 km. Si ese cuadro incluye lomas, en el llano puede llover menos y hacer más calor.</p>
        <details className="evidence-details"><summary>Ver detalles del clima</summary><p><a href={source?.url}>NASA POWER</a> · {source?.period} · {source?.scale}. {source?.method}. {source?.quality}. Media histórica del mes, no pronóstico ni medición de finca. Humedad relativa: {selectedClimate.relativeHumidityPct != null ? Math.round(selectedClimate.relativeHumidityPct) : "—"}%. La lluvia por satélite/reanálisis en el trópico tiene errores; no se usa para la recomendación (la sequía viene de FAO GIEWS).</p></details></> : <p role="status">{climateStatus || "Sin datos para este punto"}</p>}
      </section></Fold>}

      <Fold icon="🎙️" title="Pregúntale a AgroVision" teaser="Habla como en una llamada o escribe tu pregunta"><VoiceAssistant key={`${selectedParcel}/${locationKey}/${month}/${priority}/${irrigation}/${previous}/${crops.join(",")}`} selection={selection}/></Fold>

      <details className="card landscape-details"><summary>Para técnicos: rotaciones de ejemplo con modelo de riego (San Juan)</summary>
        <p>Secuencias ilustrativas con riego neto modelado (NASA POWER + FAO-56) para el Valle de San Juan; en otras provincias, indicador genérico. Iconos: agua, clima, plagas, mercado.</p>
        <div className="scenario-grid">{ordered.map(s => <article key={s.id} className="card scenario-card" data-scenario={s.id}>
          <h3>{s.label}</h3>
          <div className="farmer-pillars" aria-label="Agua y suelo, clima, plagas y mercado">{scoreDefinitions.map(p => {
            const score=s.scores[p.id];
            const label=score===null?"Sin datos suficientes":score>=3.34?"Favorable":score>=1.67?"Revisar":"Menos favorable";
            return <span key={p.id} className={`farmer-pillar ${pillarColor(score)}`} role="img" aria-label={`${p.label}: ${label}`} title={`${p.label}: ${label}`}><FarmIcon name={p.id} size={28}/></span>;
          })}</div>
          <details className="evidence-details"><summary>Ver detalles</summary>
            <p>Fechas ilustrativas: {s.dates}.</p>
            {scoreDefinitions.map(p=><p key={p.id}><strong>{p.label}</strong>: {s.details[p.id]} <a href={s.sourceUrls[p.id]}>Fuente</a></p>)}
          </details>
        </article>)}</div>
      </details>

      <footer className="provenance about">
        <p><strong>¿Quién hace AgroVision?</strong> Estudiantes de Ingeniería en TIC de UNIBE (Santo Domingo), equipo AgroVision, para el NASA Space Apps Challenge 2026. No vendemos insumos ni semillas.</p>
        <p><strong>Datos:</strong> NASA POWER, NASA GIBS (MODIS, IMERG), Copernicus Sentinel-2, FAO GIEWS, FAO-56, Ministerio de Agricultura (precios, siembras y costos), IDIAF. Es una guía, no sustituye a tu técnico o extensionista.</p>
        <a href="/data/manifest.json">Fuentes y versión de datos</a>
      </footer>
    </div>
  </main>;
}
