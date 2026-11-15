/* AI: OpenAI, 2026-11-15; layout & hierarchy polish: Antigravity (Gemini), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import Link from "next/link";
import { climate } from "@/lib/data";
import { FAO56_URL, marketSources } from "@/lib/advisor";
import { faoGiews } from "@/lib/fao-giews";
import { CPI } from "@/lib/profit";

export default function SourcesPage() {
  return <main className="workspace source-directory">
    <Link className="source-back-link" href="/">← Volver a AgroVision</Link>
    <article className="card source-directory-card">
      <h1>Fuentes de AgroVision</h1>
      <p className="source-directory-lead">Todos los datos públicos utilizados en las recomendaciones y calculadoras, con su alcance y período de referencia.</p>
      <ul className="source-directory-list">
        <li><a href={climate.source.url}>NASA POWER / MERRA-2</a><span>Clima regional 2016–2025, resolución aproximada de 50 km.</span></li>
        <li><a href={FAO56_URL}>FAO-56</a><span>Demanda relativa de agua por cultivo.</span></li>
        <li><a href={faoGiews.source}>FAO GIEWS</a><span>Sequía a escala provincial (ASIS y precipitación estimada).</span></li>
        <li><a href={marketSources.prices}>Precios mayoristas del Ministerio de Agricultura</a><span>Santo Domingo, {marketSources.pricesPeriod}.</span></li>
        <li><a href={marketSources.sowing}>Superficie sembrada</a><span>Serie nacional del Ministerio de Agricultura.</span></li>
        <li><a href={marketSources.costs}>Costos de producción de 2019</a><span>Fichas del Ministerio de Agricultura por sistema.</span></li>
        <li><a href={CPI.url}>Índice de precios del Banco Central</a><span>Ajuste inflacionario a enero de 2026.</span></li>
        <li><a href="/data/manifest.json">Inventario técnico de datos (JSON)</a><span>Registro completo de caché local y fechas de captura.</span></li>
      </ul>
    </article>
  </main>;
}
