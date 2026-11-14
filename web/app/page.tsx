/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. See AI_USAGE.md. */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPanel } from "@/components/map";
import { FarmIcon } from "@/components/farm-icon";
import { VoiceAssistant } from "@/components/voice-assistant";
import { OfflineStatus } from "@/components/offline";
import { catalog, climate, ndvi, getComparison, orderScenarios, priorityLabels, scoreDefinitions, type Priority, type Irrigation } from "@/lib/data";
import { nationalCenter, provinces, provinceAt, type Location } from "@/lib/geography";
import type { ClimateContext } from "@/lib/location-climate";
import type { VoiceSelection } from "@/lib/voice-context";
import parcels from "@/public/data/demo-parcels.json";
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
  const onSelect = useCallback((id:string) => { const parcel = parcels.features.find(p => p.id === id); if (!parcel) return; const p = parcel.geometry.coordinates[0][0]; setLocation({longitude:p[0]+.005,latitude:p[1]+.004});setSelectedParcel(id);setIrrigation("unconfirmed"); },[]);
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
  const comparison = useMemo(() => getComparison(month),[month]);
  const ordered = useMemo(() => orderScenarios(comparison.scenarios,priority),[comparison.scenarios,priority]);
  const selectedClimate = selectedParcel !== "location" ? climate.monthlyClimatology.find(m => m.month === month) : context?.key === locationKey ? context.data.monthly.find(m => m.month === month) : null;
  const selection = useMemo<VoiceSelection>(() => ({parcelId:selectedParcel as VoiceSelection["parcelId"],location,priority,month,irrigation}),[selectedParcel,location,priority,month,irrigation]);
  const province = provinceAt(location);
  const waterMax = Math.max(...comparison.scenarios.map(s => s.coefficientDays));
  const source = selectedParcel !== "location" ? { url:climate.source.url,period:"2016–2025",scale:"Regional · ~50 km · San Juan",quality:"Sin validación local",method:"Reanálisis histórico" } : context?.key === locationKey ? context.data.source : null;
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><FarmIcon name="soil"/></span>AgroVision</div><OfflineStatus/></header>
    <div className="workspace">
      <div className="heading-row"><div><div className="eyebrow">REPÚBLICA DOMINICANA</div><h1>Tu tierra. Tu próxima cosecha.</h1><p className="subtitle">Elige tu zona y compara opciones.</p></div></div>
      <section className="card location-card" aria-label="Elige tu zona"><div className="section-row"><h2>1 · ¿Dónde cultivas?</h2><span>{province ?? "Selecciona un punto terrestre"}</span></div>
        <div className="location-controls"><label>Buscar provincia<input type="search" placeholder="Escribe el nombre…" value={provinceSearch} onChange={e => setProvinceSearch(e.target.value)}/></label><label>Provincia<select aria-label="Provincia" value={province ?? ""} onChange={e => {const p = provinces.find(p => p.name === e.target.value);if (p) onLocation({longitude:p.longitude,latitude:p.latitude});}}><option value="" disabled>Selecciona</option>{provinces.filter(p => p.name === province || p.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(provinceSearch.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase())).map(p => <option key={p.name}>{p.name}</option>)}</select></label></div>
        <MapPanel selected={selectedParcel} onSelect={onSelect} location={location} onLocation={onLocation}/>
        <details className="evidence-details"><summary>Explorar áreas de ejemplo · San Juan</summary><div className="field-buttons">{parcels.features.map((p,i) => <button key={p.id} onClick={() => onSelect(p.id)} aria-pressed={selectedParcel === p.id}><FarmIcon name="field"/>Área {String.fromCharCode(65+i)}</button>)}</div><p>Límites sintéticos y aproximados. No identifican fincas reales.</p></details>
      </section>
      <section className="card climate-card" aria-label="Clima regional"><div className="section-row"><h2>Clima de tu zona</h2><select aria-label="Mes del clima" value={month} onChange={e => setMonth(Number(e.target.value))}>{months.map((m,i) => <option key={m} value={i+1}>{m}</option>)}</select></div>
        {selectedClimate ? <><div className="climate-strip"><div className="climate-cell"><FarmIcon name="climate"/><div className="climate-val">{selectedClimate.temperatureC ?? "—"} °C</div><div>Temperatura</div></div><div className="climate-cell"><FarmIcon name="water"/><div className="climate-val">{selectedClimate.precipitationMmDay ?? "—"}</div><div>Lluvia · mm/día</div></div><div className="climate-cell"><FarmIcon name="soil"/><div className="climate-val">{selectedClimate.relativeHumidityPct ?? "—"}%</div><div>Humedad del aire</div></div></div><details className="evidence-details"><summary>Fuente y límites del clima</summary><p><a href={source?.url}>NASA POWER</a> · {source?.period} · {source?.scale}. {source?.method}. {source?.quality}. Media histórica del mes, no pronóstico ni medición de finca. La lluvia tropical tiene limitaciones; no se usa para puntuar rotaciones.</p></details></> : <p role="status">{climateStatus || "Sin datos para este punto"}</p>}
      </section>
      <div className="section-row"><h2>2 · Compara rotaciones</h2><label className="priority-wrap">Prioridad<select aria-label="Prioridad" className="priority-select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>{Object.entries(priorityLabels).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
      <div className="pillar-legend"><span><i className="light green"/>Menor indicador</span><span><i className="light amber"/>Intermedio</span><span><i className="light red"/>Mayor indicador</span><span><i className="light gray"/>Sin datos</span></div>
      <p className="comparison-note">{priority === "water" ? "Ordenadas por un indicador relativo de agua. No mide litros ni ahorro." : "Sin evidencia suficiente para ordenar por esta prioridad."}</p>
      <div className="scenario-grid">{ordered.map(s => <article key={s.id} className="card scenario-card" data-scenario={s.id}><div className="scenario-top"><strong className="scenario-name">{s.label}</strong><span className="scenario-type">{s.status === "baseline" ? "Referencia" : "Ejemplo"}</span></div><div className="crop-journey">{s.cropIds.map((id,i) => <div className="crop-step" key={id}>{i>0 && <span className="crop-arrow">→</span>}<span className={`crop-illustration crop-${id}`}><FarmIcon name={id} size={62}/><strong>{s.crops[i]}</strong></span></div>)}</div>
        <div className="water-gauge"><div className="gauge-label"><FarmIcon name="water"/><strong>Indicador de agua</strong></div><div className="gauge-track" role="meter" aria-label={`Indicador de agua: ${s.label}`} aria-valuemin={0} aria-valuemax={waterMax} aria-valuenow={s.coefficientDays} aria-valuetext={`${s.coefficientDays} Kc por día; confianza baja; no es volumen de riego`}><span style={{width:`${s.coefficientDays/waterMax*100}%`}}/></div><div className="gauge-caption"><strong>{s.coefficientDays} Kc·día</strong><span>Regla genérica · confianza baja</span></div></div>
        <div className="score-grid">{scoreDefinitions.map(p => {const score=s.scores[p.id];const color=score===null?"gray":score>=3.34?"green":score>=1.67?"amber":"red";return <div key={p.id} className={`score-item pillar-${p.id}`}><div className="score-head"><FarmIcon name={p.id} size={30}/>{p.label}</div><div className="score"><i className={`light ${color}`}/>{score===null?"Sin datos":`${score.toFixed(1)} / 5`}</div><div className="score-quality">{p.id==="water"?"Solo agua · suelo pendiente":"Sin evidencia local verificada"}</div></div>;})}</div>
        <details className="evidence-details"><summary>Ver fuentes y límites</summary><p><a href={catalog.source.url}>FAO-56 · 1998 · tablas 11–12</a>. Regla publicada, ejemplos genéricos regionales. Confianza local baja. Integral Kc × duración de etapas, sumada por secuencia. Puntuación relativa 0–5: 5 × (máximo − indicador) / (máximo − mínimo).</p><p>No incluye lluvia, ETo, pérdidas de riego, percolación ni fechas reales. No es demanda de riego ni ahorro. Aptitud climática, suelo, relaciones de plagas y precios locales verificados: sin datos para estos escenarios.</p>{s.sourceUrl && <p><a href={s.sourceUrl}>IDIAF · compendio de habichuela · 2013</a>: contexto de arroz–habichuela, pertinencia local sin verificar.</p>}</details><p className="scenario-foot">Ejemplo para revisar con un técnico. Sin predicción de plagas, rendimiento ni ganancias.</p>
      </article>)}</div>
      <div className="field-controls"><label className="control-label">Acceso al agua<select aria-label="Acceso al agua" value={irrigation} onChange={e => setIrrigation(e.target.value as Irrigation)}><option value="unconfirmed">Sin confirmar</option><option value="irrigated">Riego · declarado</option><option value="rainfed">Secano · declarado</option></select></label></div>
      <VoiceAssistant key={`${selectedParcel}/${locationKey}/${month}/${priority}/${irrigation}`} selection={selection}/>
      {selectedParcel !== "location" && <details className="card landscape-details"><summary>Vegetación observada · área de ejemplo</summary><p>Landsat 8–9, Collection 2 Level-2 · 2024 · píxel de 30 m · NDVI sin unidad · observación satelital con máscara de calidad · confianza preliminar, sin validación de campo.</p><div className="ndvi-bars">{ndvi.rows.filter(r => r.parcelId===selectedParcel).map(r => <div key={r.date}><span>{r.date}</span><meter min={-1} max={1} value={r.ndvi??-1} aria-label={`NDVI ${r.date}`}/><strong>{r.ndvi?.toFixed(2)??"Sin dato"}</strong></div>)}</div><p><a href={ndvi.source.url}>Fuente Landsat / Planetary Computer</a>. Una señal baja no confirma campo pelado. Clasificación de riego y secano pendiente de validación.</p></details>}
      <footer className="provenance"><span>NASA POWER · NASA GIBS · FAO-56 · IDIAF. Ejemplos sin validación en finca.</span><a href="/data/manifest.json">Fuentes y versión de datos</a></footer>
    </div>
  </main>;
}
