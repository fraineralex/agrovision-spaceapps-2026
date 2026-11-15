/* AI: Claude (Anthropic), 2026-11-15 — "Plagas a vigilar" section from the Dominican pest catalogue. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo } from "react";
import { Bug } from "lucide-react";
import { adviseNextCrop, previousCropName, recommendedCrop, type AdvicePriority, type CropId, type PreviousCrop } from "@/lib/advisor";
import { nematodeNote, pestKind, pestLimit, pestSources, pestsFor } from "@/lib/pests";
import type { Irrigation } from "@/lib/data";

export function PestCard(p: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[] }) {
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const ordered = top ? [top, ...advice.filter(a => a !== top)] : advice;
  const before = pestsFor(String(p.previous));
  const prevName = previousCropName(p.previous).toLowerCase();
  const anyNematode = ordered.some(a => pestsFor(a.crop)?.pests.some(x => pestKind(x).kind === "nematodo")) || Boolean(before?.pests.some(x => pestKind(x).kind === "nematodo"));
  return <div className="pests">
    <p className="soil-lead">Estas son las plagas principales de cada cultivo de tu lista, según guías y reportes dominicanos. Sirven para saber qué mirar; no dicen que la plaga esté en tu finca.</p>
    {before && <p className="note">Tu cultivo anterior, {prevName}, tiene como plagas principales: {before.pests.map(x => x.name.toLowerCase()).filter((n, i, all) => all.indexOf(n) === i).join(", ")}. Si un cultivo nuevo comparte alguna, lo marcamos.</p>}
    <ul className="pest-crops">{ordered.map(a => { const entry = pestsFor(a.crop); return <li key={a.crop}>
      <h3><Bug aria-hidden="true" size={18} /> {a.name}{a === top ? " (el recomendado)" : ""}</h3>
      {entry ? <>
        <ul className="pest-list">{entry.pests.map(x => { const k = pestKind(x); const shared = a.sharedPests.some(s => s.taxon === x.taxon) && a.crop !== p.previous; return <li key={x.name + (x.taxon ?? "")}>
          <strong>{x.name}</strong>{x.taxon ? <> <em>({x.taxon})</em></> : null} · {k.kind === "insecto" ? "insecto" : `${k.kind}: ${k.where}`}{x.external ? " · † reportada fuera del país; falta confirmarla aquí" : ""}
          {shared && <span className="pest-shared"> · También ataca a tu cultivo anterior</span>}
        </li>; })}</ul>
        <p className="pest-state">{a.pestState === "rotation" ? "El IDIAF recomienda este cambio para cortar plagas y enfermedades de la habichuela."
          : a.pestState === "repeat" ? "Repetir el cultivo deja estas mismas plagas en el terreno."
          : a.pestState === "shared" ? `Comparte plagas con ${prevName}: confirma con tu técnico si las tuviste antes de sembrar.`
          : a.pestState === "maybe" ? `Puede compartir plagas con ${prevName}, pero la referencia es de fuera del país.`
          : a.pestState === "different" ? `No comparte plagas principales con ${prevName}: el cambio ayuda a cortarlas.`
          : "Dinos qué sembraste antes para comparar."}</p>
        <p className="pest-src">Fuentes: {entry.sources.map((id, i) => <span key={id}>{i ? " · " : ""}<a href={pestSources[id][1]}>{pestSources[id][0]}</a></span>)}</p>
      </> : <p className="note">Las guías que usamos no listan las plagas de {a.name.toLowerCase()}. Pregunta a tu técnico.</p>}
    </li>; })}</ul>
    {anyNematode && <p className="warning">{nematodeNote}</p>}
    <div className="sources-box"><h3>Importante</h3>
      <p>{pestLimit}</p>
      <p>No recomendamos pesticidas ni dosis. Si ves daño, lleva una foto o una muestra a tu técnico, al extensionista de Agricultura o al IDIAF.</p>
    </div>
  </div>;
}
