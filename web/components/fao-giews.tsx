/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. See AI_USAGE.md. */
import { droughtSignal, faoGiews, faoProvince, faoScoreRule } from "@/lib/fao-giews";
import styles from "./fao-giews.module.css";
export function FaoScoreDetails({ province }: { province?: string }) {
  const data = faoProvince(province);
  if (!data) return null;
  return <details className="evidence-details"><summary>Ver detalles · sequía y puntuación de clima</summary>
    <p><a href={faoGiews.source}>FAO GIEWS / ASIS · {data.name}</a>. {faoGiews.scale} {faoGiews.quality}</p>
    <p>{faoGiews.method} Descarga: {faoGiews.retrievedAt.slice(0, 10)}. Límites históricos GAUL; no mide una finca.</p>
    <p>{faoScoreRule} Se usa VHI ponderado estacional cuando existe; VHI no estacional como alternativa. Los datos de más de 45 días no generan alerta ni puntuación.</p>
    <p>Semáforo de AgroVision, sin validación local: Sequía si ASI &gt;30% o VHI &lt;0.35; Atención si ASI ≥10% o VHI &lt;0.50; Normal en los demás casos con datos recientes. No es una alerta oficial de FAO.</p>
    {data.asi && <p><a href={data.asi.source ?? faoGiews.source}>ASI temporada 1</a>: {data.asi.value}% del área cultivada con VHI medio bajo 0.35 · década iniciada {data.asi.date}. Indicador satelital derivado; confianza provincial preliminar.</p>}
    {data.vhi && <p><a href={data.vhi.source ?? faoGiews.source}>VHI no estacional</a>: {data.vhi.value} · índice 0–1 · {data.vhi.date}.</p>}
    {data.weightedVhi && <p><a href={data.weightedVhi.source ?? faoGiews.source}>VHI ponderado temporada 1</a>: {data.weightedVhi.value} · índice 0–1 · {data.weightedVhi.date}.</p>}
    {data.history.map(h => <p key={h.season}><a href={h.source ?? faoGiews.source}>ASI anual · temporada {h.season}</a> · {h.start}–{h.end}: {h.above30} de {h.seasons} temporadas válidas con &gt;30% del área afectada ({h.frequency30Pct}%); {h.above50} con &gt;50% ({h.frequency50Pct}%). Conteo calculado, sin rellenar años ausentes; temporadas 1 y 2 se mantienen separadas. No equivale a sequía en tu finca.</p>)}
    {data.rain && <p><a href={data.rain.source ?? faoGiews.source}>ECMWF vía FAO</a>: {data.rain.value} mm frente a {data.rain.normalMm ?? "sin dato"} mm normales · década iniciada {data.rain.date}. Anomalía = 100 × (lluvia / normal − 1). {faoGiews.rainBaseline} Estimación regional, confianza local baja; no pronóstico.</p>}
    <p>{data.phenologyStatus} La fenología representa verdor estacional multianual, no fechas óptimas universales. GAUL nivel 2: sin descarga enlazada verificada para DOM.</p>
  </details>;
}
export function FaoDroughtCard({ province }: { province?: string }) {
  const data = faoProvince(province);
  const signal = droughtSignal(data);
  const rain = data?.rain;
  const historical = data?.history.reduce<typeof data.history[number] | undefined>((highest, h) => !highest || h.frequency30Pct > highest.frequency30Pct ? h : highest, undefined);
  return <section className="card" aria-label="Sequía provincial FAO">
    <div className="section-row"><h2>Agua y sequía · {province ?? "Elige una provincia"}</h2></div>
    <p className={styles.note}>Contexto provincial FAO · no mide tu finca</p>
    <div className={styles.grid}>
      <div className={styles.item}><h3>☀ Alerta de sequía</h3><strong className={styles.status}><i className={`light ${signal.color}`}/>{signal.label}</strong><p>{signal.sentence}</p><p className={styles.note}>{data?.asi ? `Observación: ${data.asi.date}` : "Sin observación provincial"} · semáforo orientativo</p></div>
      <div className={styles.item}><h3>↺ Riesgo histórico</h3>{historical ? <><strong>{historical.above30} de {historical.seasons} temporadas</strong><p>Con más del 30% del área cultivada afectada por sequía.</p><p className={styles.note}>{historical.start}–{historical.end} · temporada {historical.season} · cálculo desde FAO</p></> : <p>Sin serie histórica verificada.</p>}</div>
      <div className={styles.item}><h3>☂ Lluvia vs normal</h3>{rain?.anomalyPct != null ? <><strong>{rain.anomalyPct > 0 ? "↑" : rain.anomalyPct < 0 ? "↓" : "→"} {Math.round(Math.abs(rain.anomalyPct))}% {rain.anomalyPct > 0 ? "más" : rain.anomalyPct < 0 ? "menos" : "de diferencia"}</strong><p className={styles.note}>Década iniciada {rain.date} · ECMWF vía FAO · estimación regional</p></> : <p>Sin comparación verificada.</p>}</div>
    </div>
    <FaoScoreDetails province={province}/>
  </section>;
}
