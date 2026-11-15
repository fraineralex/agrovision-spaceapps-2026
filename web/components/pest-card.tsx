/* AI: Codex/OpenAI & Antigravity, 2026-11-15 — "Plagas a vigilar" section from the Dominican pest catalogue. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo } from "react";
import { CropIdentity } from "@/components/planting-ui";
import { PestOverview } from "@/components/pest-overview";
import { adviseNextCrop, previousCropName, recommendedCrop, type AdvicePriority, type CropAdvice, type CropId, type PreviousCrop } from "@/lib/advisor";
import { nematodeNote, pestKind, pestLimit, pestSources, pestsFor } from "@/lib/pests";
import type { Irrigation } from "@/lib/data";

function pestBadge(state: CropAdvice["pestState"]): { label: string; tone: "green" | "amber" | "red" | "gray" } {
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
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const ordered = top ? [top, ...advice.filter(a => a !== top)] : advice;
  const before = pestsFor(String(p.previous));
  const prevName = previousCropName(p.previous).toLowerCase();
  const anyNematode = ordered.some(a => pestsFor(a.crop)?.pests.some(x => pestKind(x).kind === "nematodo")) || Boolean(before?.pests.some(x => pestKind(x).kind === "nematodo"));
  const sup = Boolean(p.supervisor);
  const limitsBody = <>
    {anyNematode && <p>{nematodeNote}</p>}
    <p>{pestLimit}</p>
    <p>No recomendamos pesticidas ni dosis. Si ves daño, lleva una foto o una muestra a tu técnico, al extensionista de Agricultura o al IDIAF.</p>
  </>;
  return <div className="pests">
    <p className="pest-intro">Plagas clave por cultivo según guías dominicanas (no indica presencia activa en tu finca).</p>
    <ul className="pest-crops" data-count={ordered.length}>{ordered.map(a => {
      const entry = pestsFor(a.crop);
      const badge = pestBadge(a.pestState);
      const stateSentence = a.pestState === "rotation" ? "El IDIAF recomienda este cambio para cortar plagas y enfermedades de la habichuela."
        : a.pestState === "repeat" ? "Repetir el cultivo deja estas mismas plagas en el terreno."
        : a.pestState === "shared" ? `Comparte plagas con ${prevName}: confirma con tu técnico si las tuviste antes de sembrar.`
        : a.pestState === "maybe" ? `Puede compartir plagas con ${prevName}, pero la referencia es de fuera del país.`
        : a.pestState === "different" ? `No comparte plagas principales con ${prevName}: el cambio ayuda a cortarlas.`
        : "Dinos qué sembraste antes para comparar.";
      const evidenceBody = entry ? <>
        <ul className="pest-list">{entry.pests.map(x => { const k = pestKind(x); const shared = a.sharedPests.some(s => s.taxon === x.taxon) && a.crop !== p.previous; return <li key={x.name + (x.taxon ?? "")}>
          <strong>{x.name}</strong>{x.taxon ? <> <em>({x.taxon})</em></> : null} · {k.kind === "insecto" ? "insecto" : `${k.kind}: ${k.where}`}{x.external ? " · † reportada fuera del país; falta confirmarla aquí" : ""}
          {shared && <span className="pest-shared"> · También ataca a tu cultivo anterior</span>}
        </li>; })}</ul>
        <div className="pest-evidence-foot">
          {!sup && <p className="pest-state">{stateSentence}</p>}
          <p className="pest-src">Fuentes: {entry.sources.map((id, i) => <span key={id}>{i ? " · " : ""}<a href={pestSources[id][1]}>{pestSources[id][0]}</a></span>)}</p>
        </div>
      </> : null;
      return <li key={a.crop} className="pest-row-item">
        <div className="pest-col-crop">
          <CropIdentity name={a.name} crop={a.crop} recommended={a === top}/>
          <span className={`pest-risk-badge is-${badge.tone}`}>{badge.label}</span>
        </div>
        <div className="pest-col-watch">
          <PestOverview advice={a}/>
        </div>
        {entry ? (sup ? <div className="pest-evidence pest-evidence-open">{evidenceBody}</div> : <details className="pest-evidence"><summary>Detalles y fuentes</summary>{evidenceBody}</details>) : <p className="note pest-no-guide">Las guías que usamos no listan las plagas de {a.name.toLowerCase()}. Pregunta a tu técnico.</p>}
      </li>;
    })}</ul>
    {sup ? <div className="pest-evidence pest-general pest-evidence-open"><strong>Límites y precauciones</strong>{limitsBody}</div> : <details className="pest-evidence pest-general"><summary>Límites y precauciones</summary>{limitsBody}</details>}
  </div>;
}
