/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. See AI_USAGE.md. */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPanel } from "@/components/map";
import { FarmIcon } from "@/components/farm-icon";
import { VoiceAssistant } from "@/components/voice-assistant";
import { OfflineStatus } from "@/components/offline";
import { climate, ndvi, priorityLabels, scoreDefinitions, type Priority, type Irrigation } from "@/lib/data";
import { nationalCenter, provinces, provinceAt, type Location } from "@/lib/geography";
import { getFarmerComparison, pillarColor } from "@/lib/farmer-comparison";
import type { ClimateContext } from "@/lib/location-climate";
import type { VoiceSelection } from "@/lib/voice-context";
import parcels from "@/public/data/demo-parcels.json";
import { findParcel, parcelEvidence, signalLabels } from "@/lib/map/parcels";
const months = Array.from({ length:12 },(_,i) => new Date(2024,i).toLocaleString("es",{month:"long"}));
export default function Home() {
  const [month,setMonth] = useState(11);
  const [selectedParcel,setSelectedParcel] = useState("location");
  const [location,setLocation] = useState<Location>(nationalCenter);
  const [priority,setPriority] = useState<Priority>("water");
  const [irrigation,setIrrigation] = useState<Irrigation>("unconfirmed");
  const [context,setContext] = useState<{key:string;data:ClimateContext} | null>(null);
  const [climateStatus,setClimateStatus] = useState("");
  const [provinceSearch,setProvinceSearch] = useState("");
  const locationKey = `${location.longitude.toFixed(3)},${location.latitude.toFixed(3)}`;
  const onSelect = useCallback((id:string) => { const detected=findParcel(id);if(detected){setLocation({longitude:detected.properties.center[0],latitude:detected.properties.center[1]});setSelectedParcel(id);setIrrigation("unconfirmed");return;} const parcel = parcels.features.find(p => p.id === id); if (!parcel) return; const p = parcel.geometry.coordinates[0][0]; setLocation({longitude:p[0]+.005,latitude:p[1]+.004});setSelectedParcel(id);setIrrigation("unconfirmed"); },[]);
  const onLocation = useCallback((point:Location) => {setLocation(point);setSelectedParcel("location");setIrrigation("unconfirmed");},[]);
  useEffect(() => {
    if (selectedParcel !== "location") return;
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
  },[locationKey,location.longitude,location.latitude,selectedParcel]);

  const selectedClimate = selectedParcel !== "location" ? climate.monthlyClimatology.find(m => m.month === month) : context?.key === locationKey ? context.data.monthly.find(m => m.month === month) : null;
  const selection = useMemo<VoiceSelection>(() => ({parcelId:(selectedParcel.startsWith("sj-unit-") ? "location" : selectedParcel) as VoiceSelection["parcelId"],location,priority,month,irrigation}),[selectedParcel,location,priority,month,irrigation]);
  const detectedParcel = findParcel(selectedParcel);
  const province = provinceAt(location);
  const sanJuan = selectedParcel !== "location" || province === "San Juan";
  const selectedContext = context?.key === locationKey ? context.data : null;
  const ordered = useMemo(() => getFarmerComparison(sanJuan,selectedContext,priority),[sanJuan,selectedContext,priority]);
  const recommended = ordered.find(s => s.id === "habichuela_maiz")!;
  const activePillar = priority === "soil" ? "water" : priority;
  const recommendationScore = priority === "soil" ? null : recommended.scores[activePillar];
  const reason = priority === "water" ? (sanJuan ? "menor necesidad estimada de agua que el ejemplo con guandul" : "menor indicador de uso de agua que el ejemplo con guandul") : priority === "pests" ? "incluye una rotación para interrumpir algunas plagas" : priority === "climate" ? "una alternativa con clima histórico para revisar" : priority === "market" ? "una alternativa con referencia histórica de precios" : "falta conocer el suelo antes de decidir";
  const source = selectedParcel !== "location" ? { url:climate.source.url,period:"2016–2025",scale:"Regional · ~50 km · San Juan",quality:"Sin validación local",method:"Reanálisis histórico" } : context?.key === locationKey ? context.data.source : null;
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><FarmIcon name="soil"/></span>AgroVision</div><OfflineStatus/></header>
    <div className="workspace">
      <div className="heading-row"><div><div className="eyebrow">REPÚBLICA DOMINICANA</div><h1>Tu tierra. Tu próxima cosecha.</h1><p className="subtitle">Elige tu zona y compara opciones.</p></div></div>
      <section className="card farmer-recommendation" aria-label="Recomendación para la parcela" aria-live="polite">
        <span className={`recommendation-light light ${pillarColor(recommendationScore)}`} role="img" aria-label={recommendationScore === null ? "Falta información" : recommendationScore >= 3.34 ? "Opción para considerar" : "Revisar con cuidado"}/>
        <div><small>{findParcel(selectedParcel)?.properties.name ?? province ?? "Tu zona"}</small><h2>{recommendationScore === null ? "Consulta con un técnico antes de elegir qué sembrar." : `Considera ${recommended.label.toLowerCase()}: ${reason}.`}</h2><p>Opción para revisar con tu técnico según el agua disponible.</p></div>
      </section>
      <section className="card location-card" aria-label="Elige tu zona"><div className="section-row"><h2>1 · ¿Dónde cultivas?</h2><span>{province ?? "Selecciona un punto terrestre"}</span></div>
        <div className="location-controls"><label>Buscar provincia<input type="search" placeholder="Escribe el nombre…" value={provinceSearch} onChange={e => setProvinceSearch(e.target.value)}/></label><label>Provincia<select aria-label="Provincia" value={province ?? ""} onChange={e => {const p = provinces.find(p => p.name === e.target.value);if (p) onLocation({longitude:p.longitude,latitude:p.latitude});}}><option value="" disabled>Selecciona</option>{provinces.filter(p => p.name === province || p.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(provinceSearch.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase())).map(p => <option key={p.name}>{p.name}</option>)}</select></label></div>
        <MapPanel selected={selectedParcel} onSelect={onSelect} location={location} onLocation={onLocation}/>
        {detectedParcel && <article className="card parcel-card" aria-label="Ficha de parcela" aria-live="polite">
          <h3>{detectedParcel.properties.name}</h3>
          <details className="evidence-details"><summary>Ver detalles de la parcela</summary>
          <p>{signalLabels[detectedParcel.properties.signal]} · NDVI {detectedParcel.properties.latestNdvi?.toFixed(2) ?? "sin datos"} · {detectedParcel.properties.latestObservedMonth}</p>
          <p>Superficie aproximada: {detectedParcel.properties.areaHa} ha · unidad de análisis satelital.</p>
          <details className="evidence-details"><summary>Vegetación observada y límites</summary>
            <p>Copernicus Sentinel-2 L2A / Element 84 · enero 2024–noviembre 2026 · píxel de 10 m · NDVI sin unidad. Observaciones satelitales agregadas por unidad aproximada; confianza preliminar sin validación de campo.</p>
            <p>{parcelEvidence.signalRule}</p><p>{parcelEvidence.limitation}</p>
            <div className="ndvi-bars">{detectedParcel.properties.ndviSeries.map(row => <div key={row.month}><span>{row.month}</span><meter min={-1} max={1} value={row.value ?? -1} aria-label={`NDVI ${row.month}`}/><strong>{row.value?.toFixed(2) ?? "Sin dato"}</strong></div>)}</div>
            <p><a href={parcelEvidence.provenance[0].url}>Fuente Sentinel-2</a> · Contiene datos Copernicus modificados (2024–2026). Delimitación SLIC aproximada, no identifica propietarios ni fincas verificadas. El color indica verdor, no salud, riesgo ni régimen de riego.</p>
          </details></details>
        </article>}
        <details className="evidence-details"><summary>Explorar áreas de ejemplo · San Juan</summary><div className="field-buttons">{parcels.features.map((p,i) => <button key={p.id} onClick={() => onSelect(p.id)} aria-pressed={selectedParcel === p.id}><FarmIcon name="field"/>Área {String.fromCharCode(65+i)}</button>)}</div><p>Límites sintéticos y aproximados. No identifican fincas reales.</p></details>
      </section>
      <section className="card climate-card" aria-label="Clima regional"><div className="section-row"><h2>Clima de tu zona</h2><select aria-label="Mes del clima" value={month} onChange={e => setMonth(Number(e.target.value))}>{months.map((m,i) => <option key={m} value={i+1}>{m}</option>)}</select></div>
        {selectedClimate ? <><div className="climate-strip"><div className="climate-cell"><FarmIcon name="climate"/><div className="climate-val">{selectedClimate.temperatureC ?? "—"} °C</div><div>Temperatura</div></div><div className="climate-cell"><FarmIcon name="water"/><div className="climate-val">{selectedClimate.precipitationMmDay ?? "—"}</div><div>Lluvia · mm/día</div></div><div className="climate-cell"><FarmIcon name="soil"/><div className="climate-val">{selectedClimate.relativeHumidityPct ?? "—"}%</div><div>Humedad del aire</div></div></div><details className="evidence-details"><summary>Fuente y límites del clima</summary><p><a href={source?.url}>NASA POWER</a> · {source?.period} · {source?.scale}. {source?.method}. {source?.quality}. Media histórica del mes, no pronóstico ni medición de finca. La lluvia tropical tiene limitaciones; no se usa para puntuar rotaciones.</p></details></> : <p role="status">{climateStatus || "Sin datos para este punto"}</p>}
      </section>
      <div className="section-row"><h2>2 · Compara rotaciones</h2><label className="priority-wrap">Prioridad<select aria-label="Prioridad" className="priority-select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>{Object.entries(priorityLabels).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
      <div className="scenario-grid">{ordered.map(s => <article key={s.id} className="card scenario-card" data-scenario={s.id}>
        <h3>{s.label}</h3>
        <div className="farmer-pillars" aria-label="Agua y suelo, clima, plagas y mercado">{scoreDefinitions.map(p => {
          const score=s.scores[p.id];
          const label=score===null?"Sin datos suficientes":score>=3.34?"Favorable en este indicador":score>=1.67?"Revisar":"Menos favorable en este indicador";
          return <span key={p.id} className={`farmer-pillar ${pillarColor(score)}`} role="img" aria-label={`${p.label}: ${label}`} title={`${p.label}: ${label}`}><FarmIcon name={p.id} size={28}/></span>;
        })}</div>
        <details className="evidence-details"><summary>Ver detalles</summary>
          <p>Iconos de izquierda a derecha: agua y suelo, clima, plagas y mercado. Verde: favorable en el indicador; ámbar: revisar; rojo: menos favorable; gris: falta evidencia suficiente. Son referencias preliminares, sin validación en finca.</p>
          <p>Fechas ilustrativas fijas, no fechas óptimas: {s.dates}. El selector del mes cambia el clima mostrado, no las fechas de estas rotaciones.</p>
          {scoreDefinitions.map(p=><p key={p.id}><strong>{p.label}</strong>: {s.details[p.id]} <a href={s.sourceUrls[p.id]}>Fuente</a></p>)}
          <p>El suelo sigue pendiente. No se predicen plagas, rendimiento ni ganancias. Los precios no son de finca.</p>
        </details>
      </article>)}</div>
      <div className="field-controls"><label className="control-label">Acceso al agua<select aria-label="Acceso al agua" value={irrigation} onChange={e => setIrrigation(e.target.value as Irrigation)}><option value="unconfirmed">Sin confirmar</option><option value="irrigated">Riego · declarado</option><option value="rainfed">Secano · declarado</option></select></label></div>
      <VoiceAssistant key={`${selectedParcel}/${locationKey}/${month}/${priority}/${irrigation}`} selection={selection}/>
      {selectedParcel.startsWith("demo-") && <details className="card landscape-details"><summary>Vegetación observada · área de ejemplo</summary><p>Landsat 8–9, Collection 2 Level-2 · 2024 · píxel de 30 m · NDVI sin unidad · observación satelital con máscara de calidad · confianza preliminar, sin validación de campo.</p><div className="ndvi-bars">{ndvi.rows.filter(r => r.parcelId===selectedParcel).map(r => <div key={r.date}><span>{r.date}</span><meter min={-1} max={1} value={r.ndvi??-1} aria-label={`NDVI ${r.date}`}/><strong>{r.ndvi?.toFixed(2)??"Sin dato"}</strong></div>)}</div><p><a href={ndvi.source.url}>Fuente Landsat / Planetary Computer</a>. Una señal baja no confirma campo pelado. Clasificación de riego y secano pendiente de validación.</p></details>}
      <footer className="provenance"><span>NASA POWER · NASA GIBS · FAO-56 · IDIAF. Ejemplos sin validación en finca.</span><a href="/data/manifest.json">Fuentes y versión de datos</a></footer>
    </div>
  </main>;
}
