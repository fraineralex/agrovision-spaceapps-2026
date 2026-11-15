/* AI: Codex/OpenAI, 2026-11-14; visual rings, anomaly bar & Lucide icons by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
import { CloudRain, History, Sun } from "lucide-react";
import { droughtSignal, faoGiews, faoProvince } from "@/lib/fao-giews";
import styles from "./fao-giews.module.css";

/** Plain words for the share of cropland under drought stress. */
export const areaWords = (pct: number) => pct < 1 ? "Menos de 1% del área con sequía" : `${Math.round(pct)}% del área con sequía`;
/** Plain words for rain compared with normal. */
export function rainWords(pct: number) {
  const a = Math.abs(pct);
  if (a < 10) return "Lluvia como lo normal";
  if (pct > 0) return pct >= 200 ? "Más del triple de lo normal" : pct >= 100 ? "Más del doble de lo normal" : pct >= 50 ? "Mucho más que lo normal" : "Algo más que lo normal";
  return a >= 50 ? "Menos de la mitad de lo normal" : "Algo menos que lo normal";
}

function RingGauge({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const r = 18, c = 2 * Math.PI * r;
  return (
    <svg className="mini-ring" width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
      <circle cx="23" cy="23" r={r} fill="none" stroke="#dbe5d8" strokeWidth="5" />
      <circle
        className={`mini-ring-arc ${tone}`}
        cx="23"
        cy="23"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 23 23)"
      />
    </svg>
  );
}

export function FaoScoreDetails({ province }: { province?: string }) {
  const data = faoProvince(province);
  if (!data) return null;
  return <details className="sources-fold">
    <summary>¿De dónde salen estos datos? (FAO GIEWS · {data.name})</summary>
    <div className="sources-box">
      <p>Sistema de alerta agrícola de la FAO (<a href={faoGiews.source}>FAO GIEWS / ASIS · {data.name}</a>), con imágenes de satélite. Datos descargados el {faoGiews.retrievedAt.slice(0, 10)}. Es un dato de toda la provincia, no de tu finca.</p>
      {data.asi && <p><a href={data.asi.source ?? faoGiews.source}>Área cultivada con sequía</a>: {areaWords(data.asi.value).toLowerCase()} · semana del {data.asi.date}.</p>}
      {data.history.map(h => <p key={h.season}><a href={h.source ?? faoGiews.source}>Historia de sequía, temporada {h.season}</a> ({h.start}–{h.end}): {h.above30} de {h.seasons} temporadas con más del 30% del área afectada; {h.above50} con más del 50%.</p>)}
      {data.rain && <p><a href={data.rain.source ?? faoGiews.source}>Lluvia estimada (ECMWF, publicada por la FAO)</a>: {data.rain.value} mm frente a {data.rain.normalMm ?? "sin dato"} mm normales · días desde el {data.rain.date}. Estimación regional, no pronóstico.</p>}
      <p>El color (normal, atención, sequía) lo pone AgroVision con estos datos. No es una alerta oficial de la FAO.</p>
    </div>
  </details>;
}
export function FaoDroughtCard({ province }: { province?: string }) {
  const data = faoProvince(province);
  const signal = droughtSignal(data);
  const rain = data?.rain;
  const historical = data?.history.reduce<typeof data.history[number] | undefined>((highest, h) => !highest || h.frequency30Pct > highest.frequency30Pct ? h : highest, undefined);
  const asiVal = data?.asi?.value ?? 0;
  const anomalyPct = rain?.anomalyPct ?? null;
  const anomalyWidth = anomalyPct == null ? 0 : Math.min(100, Math.round(Math.abs(anomalyPct) / 1.5));
  return <section className="card" aria-label="Sequía provincial FAO">
    <div className="section-row"><h2>Agua y sequía · {province ?? "Elige una provincia"}</h2></div>
    <p className={styles.note}>Contexto provincial FAO · no mide tu finca</p>
    <div className={styles.grid}>
      <div className={styles.item}>
        <h3><Sun size={16} aria-hidden="true" /> Alerta de sequía</h3>
        <div className="fao-visual-row">
          <RingGauge value={asiVal} max={100} tone={signal.color} />
          <div>
            <strong className={styles.status}><i className={`light ${signal.color}`}/>{signal.label}</strong>
            <p className={styles.note}>{data?.asi ? areaWords(asiVal) : "Sin observación"}</p>
          </div>
        </div>
        <p>{signal.sentence}</p>
        <p className={styles.note}>{data?.asi ? `Observación: ${data.asi.date}` : "Sin observación provincial"} · semáforo orientativo</p>
      </div>
      <div className={styles.item}>
        <h3><History size={16} aria-hidden="true" /> Riesgo histórico</h3>
        {historical ? <>
          <div className="fao-visual-row">
            <RingGauge value={historical.above30} max={historical.seasons} tone={historical.frequency30Pct >= 30 ? "red" : historical.frequency30Pct >= 15 ? "amber" : "green"} />
            <strong>{historical.above30} de {historical.seasons} temporadas</strong>
          </div>
          <p>En esas temporadas la sequía afectó a más de un tercio de los cultivos de la provincia.</p>
          <p className={styles.note}>{historical.start}–{historical.end} · temporada {historical.season} · cálculo desde FAO</p>
        </> : <p>Sin serie histórica verificada.</p>}
      </div>
      <div className={styles.item}>
        <h3><CloudRain size={16} aria-hidden="true" /> Lluvia de los últimos días</h3>
        {anomalyPct != null ? <>
          <strong>{rainWords(anomalyPct)}</strong>
          <div className="anom-track" aria-hidden="true">
            <span className={`anom-fill ${anomalyPct >= 0 ? "wet" : "dry"}`} style={{ width: `${Math.max(10, anomalyWidth)}%` }} />
          </div>
          <p className={styles.note}>Lluvia de los 10 días desde el {rain?.date}, comparada con lo normal de esas fechas. Estimación de la FAO para toda la provincia.</p>
          <p className={styles.note}>No es lo mismo que “Lluvia de la semana”: aquella es el pronóstico de los próximos 7 días; esta mira los días que ya pasaron.</p>
        </> : <p>Sin comparación verificada.</p>}
      </div>
    </div>
    <FaoScoreDetails province={province}/>
  </section>;
}
