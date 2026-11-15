/* AI: Claude (Anthropic), 2026-11-15 — "Rotación y suelo" section. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo } from "react";
import { Leaf } from "lucide-react";
import { adviseNextCrop, previousCropName, recommendedCrop, type AdvicePriority, type CropId, type PreviousCrop } from "@/lib/advisor";
import { rotationReasons, soilSources, textureNames, textureNote, type SoilTexture } from "@/lib/soil";
import type { Irrigation } from "@/lib/data";

const levelWord = { good: "Bueno para la tierra", ok: "Regular", bad: "Cansa la tierra", none: "Sin rotación que comparar" } as const;
const levelLight = { good: "lv-good", ok: "lv-ok", bad: "lv-bad", none: "lv-none" } as const;

export function SoilCard(p: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[]; texture?: SoilTexture }) {
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const tex = p.texture ? textureNote(p.texture) : null;
  const light = [...advice].filter(a => a.viable && !a.repeats && (a.scores.water ?? 0) >= 3.34).map(a => a.name.toLowerCase());
  const known = p.previous !== "unknown" && p.previous !== "otro";
  return <div className="soil">
    <p className="soil-lead">Cambiar de cultivo de una siembra a otra es, sobre todo, para cuidar la tierra: que no se gaste, que guarde sus nutrientes y que siga dando.</p>
    {top && <div className={`soil-now ${levelLight[top.soil.level]}`}>
      <h3><Leaf aria-hidden="true" size={20} /> {known ? `De ${previousCropName(p.previous).toLowerCase()} a ${top.name.toLowerCase()}` : top.name}: {top.soil.title.toLowerCase()}</h3>
      <p>{top.soil.text}</p>
    </div>}
    {tex ? <div className="soil-now lv-none">
      <h3>{tex.title}</h3>
      <p>{tex.text}{p.texture === "arenosa" && light.length ? ` De tu lista, piden poca agua: ${light.slice(0, 4).join(", ")}.` : ""}</p>
      <p className="note">Tierra que nos dijiste: {textureNames[p.texture!].toLowerCase()}. Es lo que tú declaraste, no una medición.</p>
    </div> : <p className="note">Si nos dices cómo es tu tierra (arenosa, media o barro) en “Editar”, te decimos cómo guarda el agua.</p>}
    {!known && <p className="note">Dinos qué sembraste la última vez (botón “Cambiar”) para decirte cómo queda tu tierra con cada cultivo.</p>}
    {known && advice.length > 1 && <>
      <h3 className="soil-sub">Cómo queda la tierra con cada cultivo de tu lista</h3>
      <ul className="soil-list">{advice.map(a => <li key={a.crop} className={levelLight[a.soil.level]}>
        <strong>{a.name}</strong><span><i aria-hidden="true" />{a.soil.level === "good" ? `${levelWord.good}: ${a.soil.title.toLowerCase()}` : a.soil.level === "bad" ? "Cansa la tierra: es la misma familia" : a.soil.title}</span>
      </li>)}</ul>
    </>}
    <h3 className="soil-sub">¿Por qué rotar es bueno para la tierra?</h3>
    <ul className="soil-reasons">{rotationReasons.map(r => <li key={r.title}><strong>{r.title}.</strong> {r.text}</li>)}</ul>
    <div className="sources-box"><h3>¿De dónde sale esto?</h3>
      <p><a href={soilSources.rotation.url}>{soilSources.rotation.label}</a>.</p>
      <p><a href={soilSources.legumes.url}>{soilSources.legumes.label}</a>.</p>
      <p><a href={soilSources.texture.url}>{soilSources.texture.label}</a> (cuánta agua guarda cada tipo de tierra).</p>
      <p>Son reglas generales de la FAO, no una medición de tu finca. No sabemos cuánto nitrógeno ni cuánta materia orgánica tiene tu tierra: para eso hace falta un análisis de suelo. Las estrellas no cambian por esta parte.</p>
    </div>
  </div>;
}
