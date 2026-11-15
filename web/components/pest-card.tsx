/* AI: Claude (Anthropic), 2026-11-15 — "Plagas a vigilar" section from the Dominican pest catalogue. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { pestMessages } from "@/lib/i18n/pest-messages";
import { pestSourceLabels } from "@/lib/i18n/source-messages";
import { cropLabel } from "@/lib/i18n/advice";
import { useMemo } from "react";
import { Bug } from "lucide-react";
import { adviseNextCrop, recommendedCrop, type AdvicePriority, type CropId, type PreviousCrop } from "@/lib/advisor";
import { pestKind, pestSources, pestsFor } from "@/lib/pests";
import type { Irrigation } from "@/lib/data";

export function PestCard(p: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[] }) {
  const locale = useLocale();
  const text = pestMessages[locale];
  const label = (name: string) => messages[locale].pests[name as keyof typeof messages.en.pests] ?? name;
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const ordered = top ? [top, ...advice.filter(a => a !== top)] : advice;
  const before = pestsFor(String(p.previous));
  const prevName = cropLabel(p.previous,locale).toLowerCase();
  const anyNematode = ordered.some(a => pestsFor(a.crop)?.pests.some(x => pestKind(x).kind === "nematodo")) || Boolean(before?.pests.some(x => pestKind(x).kind === "nematodo"));
  return <div className="pests">
    <p className="soil-lead">{text.lead}</p>
    {before && <p className="note">{text.previous.replace("{crop}",prevName).replace("{pests}", [...new Set(before.pests.map(x => label(x.name).toLowerCase()))].join(", "))}</p>}
    <ul className="pest-crops">{ordered.map(a => { const entry = pestsFor(a.crop); const name=cropLabel(a.crop,locale); return <li key={a.crop}>
      <h3><Bug aria-hidden="true" size={18} /> {name}{a === top ? ` (${text.recommended})` : ""}</h3>
      {entry ? <>
        <ul className="pest-list">{entry.pests.map(x => { const k = pestKind(x); const shared = a.sharedPests.some(s => s.taxon === x.taxon) && a.crop !== p.previous; return <li key={x.name + (x.taxon ?? "")}>
          <strong>{label(x.name)}</strong>{x.taxon ? <> <em>({x.taxon})</em></> : null} · {k.kind === "insecto" ? text.insect : k.kind === "ácaro" ? text.mite : text.nematode}{x.external ? ` · † ${text.external}` : ""}
          {shared && <span className="pest-shared"> · {text.shared}</span>}
        </li>; })}</ul>
        <p className="pest-state">{(a.pestState === "rotation" ? text.rotation : a.pestState === "repeat" ? text.repeat : a.pestState === "shared" ? text.shares : a.pestState === "maybe" ? text.maybe : a.pestState === "different" ? text.different : text.unknown).replace("{crop}",prevName)}</p>
        <p className="pest-src">{text.sources}: {entry.sources.map((id, i) => <span key={id}>{i ? " · " : ""}<a href={pestSources[id][1]}>{pestSourceLabels[locale][id]}</a></span>)}</p>
      </> : <p className="note">{text.missing.replace("{crop}",name.toLowerCase())}</p>}
    </li>; })}</ul>
    {anyNematode && <p className="warning">{text.nematodeNote}</p>}
    <div className="sources-box"><h3>{text.important}</h3><p>{text.limit}</p><p>{text.advice}</p></div>
  </div>;
}
