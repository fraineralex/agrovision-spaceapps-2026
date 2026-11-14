/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. See AI_USAGE.md. */
import { droughtSignal, faoGiews, faoProvince } from "@/lib/fao-giews";
import styles from "./fao-giews.module.css";
export function FaoScoreDetails({ province }: { province?: string }) {
  const data = faoProvince(province);
  if (!data) return null;
  return <div className="sources-box"><h3>¿De dónde salen estos datos?</h3>
    <p>Sistema de alerta agrícola de la FAO (<a href={faoGiews.source}>FAO GIEWS / ASIS · {data.name}</a>), con imágenes de satélite. Datos descargados el {faoGiews.retrievedAt.slice(0, 10)}. Es un dato de toda la provincia, no de tu finca.</p>
    {data.asi && <p><a href={data.asi.source ?? faoGiews.source}>Área cultivada con sequía</a>: {data.asi.value}% · semana del {data.asi.date}.</p>}
    {data.history.map(h => <p key={h.season}><a href={h.source ?? faoGiews.source}>Historia de sequía, temporada {h.season}</a> ({h.start}–{h.end}): {h.above30} de {h.seasons} temporadas con más del 30% del área afectada; {h.above50} con más del 50%.</p>)}
    {data.rain && <p><a href={data.rain.source ?? faoGiews.source}>Lluvia estimada (ECMWF, publicada por la FAO)</a>: {data.rain.value} mm frente a {data.rain.normalMm ?? "sin dato"} mm normales · días desde el {data.rain.date}. Estimación regional, no pronóstico.</p>}
    <p>El color (normal, atención, sequía) lo pone AgroVision con estos datos. No es una alerta oficial de la FAO.</p>
  </div>;
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
