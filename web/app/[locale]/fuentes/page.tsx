/* AI: OpenAI, 2026-11-15; layout & i18n integration: Antigravity, 2026-11-15. */
"use client";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/client";
import { climate } from "@/lib/data";
import { FAO56_URL, marketSources } from "@/lib/advisor";
import { faoGiews } from "@/lib/fao-giews";
import { CPI } from "@/lib/profit";
import { messages } from "@/lib/i18n/messages";
import { LanguageSelector } from "@/components/language-selector";

export default function SourcesPage() {
  const locale = useLocale();
  const text = messages[locale].sources;
  return <main className="workspace source-directory">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
      <Link className="source-back-link" href={`/${locale}`}>{text.back}</Link>
      <LanguageSelector />
    </div>
    <article className="card source-directory-card">
      <h1>{text.heading}</h1>
      <p className="source-directory-lead">{locale === "en" ? "Public datasets used across recommendations and calculators, with spatial scope and reference period." : "Todos los datos públicos utilizados en las recomendaciones y calculadoras, con su alcance y período de referencia."}</p>
      <ul className="source-directory-list">
        <li><a href={climate.source.url}>NASA POWER / MERRA-2</a><span>{text.climate}</span></li>
        <li><a href={FAO56_URL}>FAO-56</a><span>{text.water}</span></li>
        <li><a href={faoGiews.source}>FAO GIEWS</a><span>{text.drought}</span></li>
        <li><a href={marketSources.prices}>{text.prices}</a><span>{text.pricesDetail}, {marketSources.pricesPeriod}.</span></li>
        <li><a href={marketSources.sowing}>{text.sowing}</a><span>{text.sowingDetail}</span></li>
        <li><a href={marketSources.costs}>{text.costs}</a><span>{text.costsDetail}</span></li>
        <li><a href={CPI.url}>{text.cpi}</a><span>{text.cpiDetail}</span></li>
        <li><a href="/data/manifest.json">{text.manifest}</a><span>{locale === "en" ? "Full local cache registry and capture dates." : "Registro completo de caché local y fechas de captura."}</span></li>
      </ul>
    </article>
  </main>;
}
