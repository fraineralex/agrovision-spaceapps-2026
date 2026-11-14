/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. See AI_USAGE.md. */
"use client";
import { useCallback, useMemo, useState } from "react";
import { MapPanel } from "@/components/map";
import { Button } from "@/components/ui/button";
import { OfflineStatus } from "@/components/offline";
import { catalog, climate, ndvi, getComparison, orderScenarios, priorityLabels, scoreDefinitions, type Priority, type Irrigation } from "@/lib/data";
import { fallbackExplanation } from "@/lib/explanation";
import parcels from "@/public/data/demo-parcels.json";

const months = Array.from({ length: 12 }, (_, index) => new Date(2024, index).toLocaleString("en", { month: "long" }));
export default function Home() {
  const [month, setMonth] = useState(11);
  const comparison = useMemo(() => getComparison(month), [month]);
  const [selectedParcel, setSelectedParcel] = useState("demo-01");
  const [priority, setPriority] = useState<Priority>("water");
  const [irrigation, setIrrigation] = useState<Irrigation>("unconfirmed");
  const [explanation, setExplanation] = useState<{ text: string; mode: string; key: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const onSelect = useCallback((id: string) => { setSelectedParcel(id); setIrrigation("unconfirmed"); }, []);
  const ordered = useMemo(() => orderScenarios(comparison.scenarios, priority), [comparison.scenarios, priority]);
  const requestKey = `${selectedParcel}/${priority}/${month}/${irrigation}`;
  async function explain() {
    setLoading(true);
    const input = { priority, month, irrigation };
    try {
      if (!navigator.onLine) throw new Error("Offline");
      const response = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(14_000) });
      if (!response.ok) throw new Error("Unavailable");
      const data = await response.json();
      if (typeof data.explanation !== "string") throw new Error("Invalid response");
      setExplanation({ text: data.explanation, mode: data.mode === "ai-generated" ? "AI-generated explanation · OpenAI GPT-4.1 mini via Vercel AI Gateway · constrained evidence selection" : "Deterministic explanation · no AI generation", key: requestKey });
    } catch { setExplanation({ text: fallbackExplanation(input), mode: "Deterministic offline explanation · no AI generation", key: requestKey }); }
    finally { setLoading(false); }
  }
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">✳</span><span>AgroVision</span></div><div className="top-meta"><OfflineStatus /><span>San Juan Valley · Dominican Republic</span></div></header>
    <div className="workspace">
      <div className="heading-row"><div><div className="eyebrow">Field Shift · Rotation explorer</div><h1>Compare what comes next.</h1><p className="subtitle">Explore crop rotation scenarios with environmental evidence for the San Juan Valley.</p></div><span className="offline-pill">● Offline-ready case</span></div>
      <div className="main-grid">
        <section className="card map-card" aria-label="Map and NASA layers"><div className="map-head"><div><h2>San Juan Valley</h2><div className="small-label">Pilot landscape · approximate demo boundaries</div></div><span className="map-badge">NASA Earth observations</span></div><MapPanel selected={selectedParcel} onSelect={onSelect} /></section>
        <section className="card panel" aria-label="Selected demo parcel"><div className="eyebrow">Selected demo area</div><h2 style={{ marginTop: 6 }}>Parcel context</h2>
          <div className="parcel-select"><select aria-label="Choose a demo area" value={selectedParcel} onChange={(event) => onSelect(event.target.value)}>{parcels.features.map((parcel) => <option key={parcel.id} value={parcel.id}>{parcel.properties.name}</option>)}</select><span className="parcel-tag">Approximate</span></div>
          <label className="control-label">Declared water access <select aria-label="Declared water access" value={irrigation} onChange={(event) => setIrrigation(event.target.value as Irrigation)}><option value="unconfirmed">Unconfirmed</option><option value="irrigated">Irrigated (declared)</option><option value="rainfed">Rainfed (declared)</option></select></label>
          <div className="data-note">Synthetic demo area, not an identified farm. Water access is user-declared, not satellite-confirmed. {irrigation === "rainfed" ? "The water proxy does not establish rainfed suitability; seasonal rainfall and soil storage are missing." : "Verify water access with a local technician before discussing rotations."}</div>
          <div className="section-row"><h2>Regional climate context</h2><select aria-label="Climate month" value={month} onChange={(event) => setMonth(Number(event.target.value))}>{months.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select></div>
          <div className="climate-strip"><div className="climate-cell"><div className="climate-val">{comparison.climate.temperatureC} °C</div><div className="climate-label">Air temperature</div></div><div className="climate-cell"><div className="climate-val">{comparison.climate.precipitationMmDay}</div><div className="climate-label">Rain · mm/day</div></div><div className="climate-cell"><div className="climate-val">{comparison.climate.relativeHumidityPct}%</div><div className="climate-label">Relative humidity</div></div></div>
          <p className="source-line"><a href={comparison.provenance.url}>NASA POWER</a> · {comparison.provenance.periodStart}–{comparison.provenance.periodEnd} · calendar-month daily mean · reanalysis · ~50 km regional grid. Quality: unvalidated locally; tropical rainfall is limited, excluded from scores. Same grid context for every demo area.</p>
          <details className="evidence-details"><summary>Temperature history · 12 calendar-month means</summary><div className="climate-chart" role="img" aria-label="Regional monthly temperature means, degrees Celsius, 2016 to 2025">{climate.monthlyClimatology.map((item) => <button key={item.month} title={`${months[item.month - 1]}: ${item.temperatureC} °C`} aria-label={`${months[item.month - 1]}: ${item.temperatureC} degrees Celsius`} onClick={() => setMonth(item.month)} style={{ height: `${item.temperatureC * 3}px` }}><span>{item.month}</span></button>)}</div><p className="source-line">Absolute height from 0 °C. NASA POWER · regional · 2016–2025 · local validation pending.</p></details>
          <details className="evidence-details" open><summary>Landsat NDVI · real point sample</summary>
            <p><a href={ndvi.source.url}>USGS/NASA Landsat 8–9 Collection 2 Level-2</a> via Microsoft Planetary Computer · six selected 2024 dates · one 30 m pixel per demo area · unitless NDVI · quality-masked satellite observation. Confidence: preliminary; no field validation.</p>
            <table className="ndvi-table"><caption>Historical vegetation signal · {parcels.features.find((item) => item.id === selectedParcel)?.properties.name}</caption><thead><tr><th>Date</th><th>NDVI</th><th>Exploratory signal</th></tr></thead><tbody>{ndvi.rows.filter((row) => row.parcelId === selectedParcel).map((row) => <tr key={row.date}><td>{row.date}</td><td>{row.ndvi?.toFixed(3) ?? "Missing"}</td><td>{row.signal}</td></tr>)}</tbody></table>
            <p className="source-line">Uncalibrated signal thresholds: below 0.2 = low vegetation; 0.2–0.4 = ambiguous; at least 0.4 = vegetation. Low vegetation may include bare soil; it does not confirm bare soil or crop identity. Missing/cloudy pixels are not filled. Irrigation classification and supervised ML remain pending labeled data; no accuracy is claimed.</p>
          </details>
        </section>
      </div>
      <div className="section-row"><div><div className="eyebrow">Scenario comparison</div><h2>Compare the evidence by pillar</h2></div><label className="priority-wrap">Your priority <select className="priority-select" aria-label="Your priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      <p className="comparison-note" aria-live="polite">{priority === "water" ? "Ordered by the water proxy only. Scores are relative within these scenarios: 5 means a smaller coefficient-day proxy, not proven suitability or savings." : `No verified ${priorityLabels[priority].toLowerCase()} ranking. The baseline stays first; missing evidence is never treated as favorable.`}</p>
      <div className="scenario-grid">{ordered.map((scenario) => <article key={scenario.id} data-scenario={scenario.id} className="card scenario-card"><div className="scenario-top"><span className="scenario-name">{scenario.label}</span><span className="scenario-type">{scenario.status}</span></div><div className="crops">{scenario.crops.join(" → ")}</div>
        <div className="score-grid">{scoreDefinitions.map((pillar) => <div className="score-item" key={pillar.id}><div className="score-head"><span>{pillar.label}</span><span>0–5</span></div><div className={`score ${scenario.scores[pillar.id] === null ? "unknown" : ""}`}>{scenario.scores[pillar.id] === null ? "Insufficient data" : `${scenario.scores[pillar.id]?.toFixed(1)} / 5`}</div><div className="score-quality">{pillar.id === "water" ? "Water proxy only · low confidence; soil unknown" : "Confidence unavailable · evidence missing"}</div></div>)}</div>
        <details className="evidence-details"><summary>Sources, method & missing evidence</summary><p>Water proxy: {scenario.coefficientDays} Kc·day per illustrative two-crop sequence. <a href={catalog.source.url}>FAO-56, tables 11–12 (1998)</a>. Published rule, generic regional examples, not calibrated in San Juan. Low local confidence; no measured soil health.</p><p>Integral of the example Kc curve, summed across crops. Score = 5 × (largest proxy − proxy) / (largest proxy − smallest proxy). No ETo or rainfall correction; excludes paddy percolation, irrigation losses and actual crop dates.</p><p>Climate: POWER context available; crop-specific suitability unverified. Pests: verified IDIAF host rules missing. Market: cleaned Ministry price sample missing; Santo Domingo prices would not equal farmgate prices. These three scores remain null.</p><p>{scenario.citation} {scenario.sourceUrl && <a href={scenario.sourceUrl}>IDIAF context source (local fit unverified)</a>}</p></details>
        <p className="scenario-foot">Illustrative scenario. Discuss with a local agricultural technician. No farm validation, yield prediction or guaranteed profit.</p>
      </article>)}</div>
      <div className="card ai-row"><div><div className="scenario-name">Explain these results</div><p>Optional AI evidence selection. A local template remains available without network or an API key.</p></div><Button className="ai-button" onClick={explain} disabled={loading}>{loading ? "Preparing…" : "Explain comparison →"}</Button></div>
      {explanation?.key === requestKey && <div className="card explanation" aria-live="polite"><strong>{explanation.mode}</strong><p>{explanation.text}</p><a href="/data/manifest.json">Bundled evidence manifest</a></div>}
      <div className="provenance"><span>NASA POWER · NASA EOSDIS GIBS · FAO-56 · IDIAF context. Data bundle: 2026-11-14. Synthetic demo areas; no farmer data.</span><a href="/data/manifest.json">Sources & data version ↗</a></div>
    </div>
  </main>;
}
