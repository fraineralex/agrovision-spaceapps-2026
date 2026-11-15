/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import Link from "next/link";
import { climate } from "@/lib/data";
import { FAO56_URL, marketSources } from "@/lib/advisor";
import { faoGiews } from "@/lib/fao-giews";
import { CPI } from "@/lib/profit";

export default function SourcesPage() {
  return <main className="workspace source-directory">
    <Link href="/">Volver a AgroVision</Link>
    <h1>Fuentes de AgroVision</h1>
    <ul>
      <li><a href={climate.source.url}>NASA POWER / MERRA-2</a> · Clima regional 2016–2025, unos 50 km.</li>
      <li><a href={FAO56_URL}>FAO-56</a> · Demanda relativa de agua por cultivo.</li>
      <li><a href={faoGiews.source}>FAO GIEWS</a> · Sequía a escala provincial.</li>
      <li><a href={marketSources.prices}>Precios mayoristas del Ministerio de Agricultura</a> · Santo Domingo, {marketSources.pricesPeriod}.</li>
      <li><a href={marketSources.sowing}>Superficie sembrada</a> · Serie nacional del Ministerio de Agricultura.</li>
      <li><a href={marketSources.costs}>Costos de producción de 2019</a> · Fichas del Ministerio de Agricultura por sistema.</li>
      <li><a href={CPI.url}>Índice de precios del Banco Central</a> · Enero de 2026.</li>
      <li><a href="/data/manifest.json">Inventario técnico de datos (JSON)</a></li>
    </ul>
  </main>;
}
