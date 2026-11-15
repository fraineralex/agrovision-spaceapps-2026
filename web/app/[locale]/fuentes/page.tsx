/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
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
    <Link href={`/${locale}`}>{text.back}</Link> <LanguageSelector />
    <h1>{text.heading}</h1>
    <ul>
      <li><a href={climate.source.url}>NASA POWER / MERRA-2</a> · {text.climate}</li>
      <li><a href={FAO56_URL}>FAO-56</a> · {text.water}</li>
      <li><a href={faoGiews.source}>FAO GIEWS</a> · {text.drought}</li>
      <li><a href={marketSources.prices}>{text.prices}</a> · {text.pricesDetail}, {marketSources.pricesPeriod}.</li>
      <li><a href={marketSources.sowing}>{text.sowing}</a> · {text.sowingDetail}</li>
      <li><a href={marketSources.costs}>{text.costs}</a> · {text.costsDetail}</li>
      <li><a href={CPI.url}>{text.cpi}</a> · {text.cpiDetail}</li>
      <li><a href="/data/manifest.json">{text.manifest}</a></li>
    </ul>
  </main>;
}
