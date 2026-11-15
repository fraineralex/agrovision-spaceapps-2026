/* AI: Codex/OpenAI & Antigravity, 2026-11-15; i18n integration, 2026-11-15. */
"use client";
import type { CropAdvice } from "@/lib/advisor";
import { pestsFor } from "@/lib/pests";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { pestMessages } from "@/lib/i18n/pest-messages";
import { localizedPillarWord } from "@/lib/i18n/advice";

/** Compact presentation only; keeps the underlying evidence and scoring unchanged. */
export function PestOverview({ advice }: { advice: CropAdvice }) {
  const locale = useLocale();
  const text = pestMessages[locale];
  const pestName = (name: string) => messages[locale].pests[name as keyof typeof messages.en.pests] ?? name;
  const pests = pestsFor(advice.crop)?.pests ?? [];
  const sharedTaxa = new Set(advice.sharedPests.map(s => s.taxon).filter(Boolean));
  const items = pests.reduce<{ label: string; shared: boolean }[]>((acc, pest) => {
    const label = pestName(pest.name) + (pest.external ? " †" : "");
    if (!acc.some(x => x.label === label)) {
      acc.push({ label, shared: Boolean(pest.taxon && sharedTaxa.has(pest.taxon)) });
    }
    return acc;
  }, []);
  const aria = locale === "en" ? "Pests to watch" : "Plagas a vigilar";
  return <div className="pest-overview">
    <p className="pest-status">{localizedPillarWord(advice, "pests", locale)}</p>
    {items.length > 0 && <ul className="pest-watch" aria-label={aria}>
      {items.map(item => <li key={item.label} className={item.shared ? "is-shared" : undefined}>{item.label}</li>)}
    </ul>}
    {pests.some(pest => pest.external) && <small className="pest-ext-note">† {text.external}</small>}
  </div>;
}
