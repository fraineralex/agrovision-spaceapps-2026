/* AI: Claude (Anthropic), 2026-11-15 — "Rotación y suelo" section. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useLocale } from "@/lib/i18n/client";
import { cropLabel } from "@/lib/i18n/advice";
import { englishColor, englishTexture, soilNoteFor } from "@/lib/i18n/soil-messages";
import { useMemo } from "react";
import { Leaf } from "lucide-react";
import { adviseNextCrop, recommendedCrop, type AdvicePriority, type CropId, type PreviousCrop } from "@/lib/advisor";
import { colorNames, colorNote, rotationReasons, soilSources, textureNames, textureNote, type SoilColor, type SoilTexture } from "@/lib/soil";
import type { Irrigation } from "@/lib/data";

const levelWord = { good: "Bueno para la tierra", ok: "Regular", bad: "Cansa la tierra", none: "Sin rotación que comparar" } as const;
const levelLight = { good: "lv-good", ok: "lv-ok", bad: "lv-bad", none: "lv-none" } as const;

export function SoilCard(p: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[]; texture?: SoilTexture; color?: SoilColor }) {
  const locale = useLocale();
  const en = locale === "en";
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const tex = p.texture ? (en ? englishTexture[p.texture] : textureNote(p.texture)) : null;
  const col = p.color ? (en ? englishColor[p.color] : colorNote(p.color)) : null;
  const light = [...advice].filter(a => a.viable && !a.repeats && (a.scores.water ?? 0) >= 3.34).map(a => cropLabel(a.crop, locale).toLowerCase());
  const known = p.previous !== "unknown" && p.previous !== "otro";
  return <div className="soil">
    <p className="soil-lead">{en ? "Changing crops between plantings helps care for the soil and retain its nutrients." : "Cambiar de cultivo de una siembra a otra es, sobre todo, para cuidar la tierra: que no se gaste, que guarde sus nutrientes y que siga dando."}</p>
    {top && <div className={`soil-now ${levelLight[top.soil.level]}`}>
      <h3><Leaf aria-hidden="true" size={20} /> {known ? `${en ? "From" : "De"} ${cropLabel(p.previous, locale).toLowerCase()} ${en ? "to" : "a"} ${cropLabel(top.crop, locale).toLowerCase()}` : cropLabel(top.crop, locale)}: {soilNoteFor(locale,p.previous,top.crop,top.soil).title.toLowerCase()}</h3>
      <p>{soilNoteFor(locale,p.previous,top.crop,top.soil).text}</p>
    </div>}
    {tex ? <div className="soil-now lv-none">
      <h3>{tex.title}</h3>
      <p>{tex.text}{p.texture === "arenosa" && light.length ? ` ${en ? "Crops on your list needing little water" : "De tu lista, piden poca agua"}: ${light.slice(0, 4).join(", ")}.` : ""}</p>
      <p className="note">{en ? `Soil you reported: ${englishTexture[p.texture!].name}. This is self-reported, not measured.` : `Tierra que nos dijiste: ${textureNames[p.texture!].toLowerCase()}. Es lo que tú declaraste, no una medición.`}</p>
    </div> : <p className="note">{en ? "Tell us your soil texture in Edit to learn how it holds water." : "Si nos dices cómo es tu tierra (arenosa, mezclada o barro) en “Editar”, te decimos cómo guarda el agua."}</p>}
    {col ? <div className="soil-now lv-none">
      <h3>{col.title}</h3>
      <p>{col.text}</p>
      <p className="note">{en ? `Color you reported: ${englishColor[p.color!].name}. Color is a clue, not a soil test.` : `Color que nos dijiste: ${colorNames[p.color!].toLowerCase()}. El color es una pista, no un análisis de suelo.`}</p>
    </div> : <p className="note">{en ? "Tell us your soil color in Edit to see what it may indicate." : "Si nos dices de qué color es tu tierra en “Editar”, te decimos qué suele indicar."}</p>}
    {!known && <p className="note">{en ? "Tell us what you planted last time using Change to compare soil effects." : "Dinos qué sembraste la última vez (botón “Cambiar”) para decirte cómo queda tu tierra con cada cultivo."}</p>}
    {known && advice.length > 1 && <>
      <h3 className="soil-sub">{en ? "Soil effects for each crop on your list" : "Cómo queda la tierra con cada cultivo de tu lista"}</h3>
      <ul className="soil-list">{advice.map(a => <li key={a.crop} className={levelLight[a.soil.level]}>
        <strong>{cropLabel(a.crop,locale)}</strong><span><i aria-hidden="true" />{en ? soilNoteFor(locale,p.previous,a.crop,a.soil).title : a.soil.level === "good" ? `${levelWord.good}: ${a.soil.title.toLowerCase()}` : a.soil.level === "bad" ? "Cansa la tierra: es la misma familia" : a.soil.title}</span>
      </li>)}</ul>
    </>}
    <h3 className="soil-sub">{en ? "Why is rotation good for soil?" : "¿Por qué rotar es bueno para la tierra?"}</h3>
    <ul className="soil-reasons">{en ? <><li><strong>Nutrients.</strong> Different crops draw nutrients from different layers.</li><li><strong>Natural fertilizer.</strong> Legumes and bacteria in their roots take nitrogen from the air.</li><li><strong>Soil life.</strong> Different roots and residues contribute organic matter.</li><li><strong>Fewer pests.</strong> Changing crops can interrupt pests and diseases between plantings.</li></> : rotationReasons.map(r => <li key={r.title}><strong>{r.title}.</strong> {r.text}</li>)}</ul>
    <details className="sources-box soil-sources"><summary>{en ? "Where does this come from?" : "¿De dónde sale esto?"}</summary>
      <p><a href={soilSources.rotation.url}>{en ? "FAO · Species diversification and crop rotation" : soilSources.rotation.label}</a>.</p>
      <p><a href={soilSources.legumes.url}>{en ? "FAO (2016) · Pulses and biodiversity" : soilSources.legumes.label}</a>.</p>
      <p><a href={soilSources.color.url}>{en ? "Soil Science Society of America · Soil color" : soilSources.color.label}</a> {en ? "(what color indicates)" : "(qué indica el color)"}.</p>
      <p><a href={soilSources.texture.url}>{en ? "FAO · Irrigation manual: soil and water" : soilSources.texture.label}</a> {en ? "(water held by each soil type)" : "(cuánta agua guarda cada tipo de tierra)"}.</p>
      <p>{en ? "These are general FAO guidelines, not farm measurements. A soil test is needed to know nitrogen and organic matter levels. This section does not change the stars." : "Son reglas generales de la FAO, no una medición de tu finca. No sabemos cuánto nitrógeno ni cuánta materia orgánica tiene tu tierra: para eso hace falta un análisis de suelo. Las estrellas no cambian por esta parte."}</p>
    </details>
  </div>;
}
