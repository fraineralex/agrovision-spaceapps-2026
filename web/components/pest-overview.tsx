/* AI: Codex/OpenAI & Antigravity, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import type { CropAdvice } from "@/lib/advisor";
import { pestsFor } from "@/lib/pests";

/** Compact presentation only; keeps the underlying evidence and scoring unchanged. */
export function PestOverview({ advice }: { advice: CropAdvice }) {
  const pests = pestsFor(advice.crop)?.pests ?? [];
  const sharedTaxa = new Set(advice.sharedPests.map(s => s.taxon).filter(Boolean));
  const items = pests.reduce<{ label: string; shared: boolean }[]>((acc, pest) => {
    const label = pest.name + (pest.external ? " †" : "");
    if (!acc.some(x => x.label === label)) {
      acc.push({ label, shared: Boolean(pest.taxon && sharedTaxa.has(pest.taxon)) });
    }
    return acc;
  }, []);
  return <div className="pest-overview">
    <p className="pest-status">{advice.words.pests}</p>
    {items.length > 0 && <ul className="pest-watch" aria-label="Plagas a vigilar">
      {items.map(item => <li key={item.label} className={item.shared ? "is-shared" : undefined}>{item.label}</li>)}
    </ul>}
    {pests.some(pest => pest.external) && <small className="pest-ext-note">† Referencia de otro país; falta confirmación local.</small>}
  </div>;
}
