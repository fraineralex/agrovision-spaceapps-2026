/* AI: Codex/OpenAI & Antigravity, 2026-11-15; i18n integration, 2026-11-15. */
"use client";
import { useLocale } from "@/lib/i18n/client";
import { messages, type Locale } from "@/lib/i18n/messages";
import { pestMessages } from "@/lib/i18n/pest-messages";
import { pestSourceLabels } from "@/lib/i18n/source-messages";
import { cropLabel } from "@/lib/i18n/advice";
import { useMemo } from "react";
import { CropIdentity } from "@/components/planting-ui";
import { PestOverview } from "@/components/pest-overview";
import { adviseNextCrop, recommendedCrop, type AdvicePriority, type CropAdvice, type CropId, type PreviousCrop } from "@/lib/advisor";
import { pestKind, pestSources, pestsFor } from "@/lib/pests";
import type { Irrigation } from "@/lib/data";

function pestBadge(state: CropAdvice["pestState"], locale: Locale): { label: string; tone: "green" | "amber" | "red" | "gray" } {
  if (locale === "en") {
    switch (state) {
      case "rotation": return { label: "Breaks pests", tone: "green" };
      case "different": return { label: "Different pests", tone: "green" };
      case "maybe": return { label: "Unconfirmed", tone: "amber" };
      case "shared": return { label: "Shares pests", tone: "red" };
      case "repeat": return { label: "Same crop", tone: "red" };
      default: return { label: "Not compared", tone: "gray" };
    }
  }
  switch (state) {
    case "rotation": return { label: "Corta plagas", tone: "green" };
    case "different": return { label: "Plagas distintas", tone: "green" };
    case "maybe": return { label: "Por confirmar", tone: "amber" };
    case "shared": return { label: "Comparte plagas", tone: "red" };
    case "repeat": return { label: "Mismo cultivo", tone: "red" };
    default: return { label: "Sin comparar", tone: "gray" };
  }
}

export function PestCard(p: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[]; supervisor?: boolean }) {
  const locale = useLocale();
  const text = pestMessages[locale];
  const label = (name: string) => messages[locale].pests[name as keyof typeof messages.en.pests] ?? name;
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const ordered = top ? [top, ...advice.filter(a => a !== top)] : advice;
  const before = pestsFor(String(p.previous));
  const prevName = cropLabel(p.previous, locale).toLowerCase();
  const anyNematode = ordered.some(a => pestsFor(a.crop)?.pests.some(x => pestKind(x).kind === "nematodo")) || Boolean(before?.pests.some(x => pestKind(x).kind === "nematodo"));
  const sup = Boolean(p.supervisor);
  const limitsBody = <>
    {anyNematode && <p>{text.nematodeNote}</p>}
    <p>{text.limit}</p>
    <p>{text.advice}</p>
  </>;
  return <div className="pests">
    <p className="pest-intro">{text.lead}</p>
    <ul className="pest-crops" data-count={ordered.length}>{ordered.map(a => {
      const entry = pestsFor(a.crop);
      const name = cropLabel(a.crop, locale);
      const badge = pestBadge(a.pestState, locale);
      const stateSentence = (
        a.pestState === "rotation" ? text.rotation
        : a.pestState === "repeat" ? text.repeat
        : a.pestState === "shared" ? text.shares
        : a.pestState === "maybe" ? text.maybe
        : a.pestState === "different" ? text.different
        : text.unknown
      ).replace("{crop}", prevName);
      const evidenceBody = entry ? <>
        <ul className="pest-list">{entry.pests.map(x => { const k = pestKind(x); const shared = a.sharedPests.some(s => s.taxon === x.taxon) && a.crop !== p.previous; return <li key={x.name + (x.taxon ?? "")}>
          <strong>{label(x.name)}</strong>{x.taxon ? <> <em>({x.taxon})</em></> : null} · {k.kind === "insecto" ? text.insect : k.kind === "ácaro" ? text.mite : text.nematode}{x.external ? ` · † ${text.external}` : ""}
          {shared && <span className="pest-shared"> · {text.shared}</span>}
        </li>; })}</ul>
        <div className="pest-evidence-foot">
          {!sup && <p className="pest-state">{stateSentence}</p>}
          <p className="pest-src">{text.sources}: {entry.sources.map((id, i) => <span key={id}>{i ? " · " : ""}<a href={pestSources[id][1]}>{pestSourceLabels[locale][id]}</a></span>)}</p>
        </div>
      </> : null;
      return <li key={a.crop} className="pest-row-item">
        <div className="pest-col-crop">
          <CropIdentity name={name} crop={a.crop} recommended={a === top}/>
          <span className={`pest-risk-badge is-${badge.tone}`}>{badge.label}</span>
        </div>
        <div className="pest-col-watch">
          <PestOverview advice={a}/>
        </div>
        {entry ? (sup ? <div className="pest-evidence pest-evidence-open">{evidenceBody}</div> : <details className="pest-evidence"><summary>{locale === "en" ? "Details & sources" : "Detalles y fuentes"}</summary>{evidenceBody}</details>) : <p className="note pest-no-guide">{text.missing.replace("{crop}", name.toLowerCase())}</p>}
      </li>;
    })}</ul>
    {sup ? <div className="pest-evidence pest-general pest-evidence-open"><strong>{text.important}</strong>{limitsBody}</div> : <details className="pest-evidence pest-general"><summary>{text.important}</summary>{limitsBody}</details>}
  </div>;
}
