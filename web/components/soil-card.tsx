/* AI: Claude (Anthropic) & Antigravity, 2026-11-15; i18n integration, 2026-11-15. */
"use client";
import { useLocale } from "@/lib/i18n/client";
import { cropLabel } from "@/lib/i18n/advice";
import { englishColor, englishTexture, soilNoteFor } from "@/lib/i18n/soil-messages";
import { useMemo } from "react";
import { Droplets, Layers, Leaf } from "lucide-react";
import { adviseNextCrop, recommendedCrop, type AdvicePriority, type CropId, type PreviousCrop } from "@/lib/advisor";
import { colorNames, colorNote, rotationReasons, soilSources, textureNames, textureNote, type SoilColor, type SoilTexture } from "@/lib/soil";
import type { Irrigation } from "@/lib/data";

const levelLight = { good: "lv-good", ok: "lv-ok", bad: "lv-bad", none: "lv-none" } as const;

export function SoilCard(p: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[]; texture?: SoilTexture; color?: SoilColor; supervisor?: boolean }) {
  const locale = useLocale();
  const en = locale === "en";
  const levelBadge = en
    ? ({ good: "Good", ok: "Fair", bad: "Tires soil", none: "Fixed" } as const)
    : ({ good: "Bueno", ok: "Regular", bad: "Cansa", none: "Fijo" } as const);
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const tex = p.texture ? (en ? englishTexture[p.texture] : textureNote(p.texture)) : null;
  const col = p.color ? (en ? englishColor[p.color] : colorNote(p.color)) : null;
  const light = [...advice].filter(a => a.viable && !a.repeats && (a.scores.water ?? 0) >= 3.34).map(a => cropLabel(a.crop, locale).toLowerCase());
  const known = p.previous !== "unknown" && p.previous !== "otro";
  const missingHints = [
    !tex && (en ? "soil texture" : "tipo de tierra"),
    !col && (en ? "soil color" : "color de tierra"),
    !known && (en ? "previous crop" : "cultivo anterior"),
  ].filter(Boolean);
  const sourcesList = [
    { url: soilSources.rotation.url, label: en ? "FAO · Species diversification & crop rotation" : soilSources.rotation.label },
    { url: soilSources.legumes.url, label: en ? "FAO (2016) · Pulses & biodiversity" : soilSources.legumes.label },
    { url: soilSources.color.url, label: en ? "SSSA · Soil color" : soilSources.color.label },
    { url: soilSources.texture.url, label: en ? "FAO · Irrigation manual: soil & water" : soilSources.texture.label },
  ];

  const reasonsBlock = (
    <div className="soil-reasons-wrap">
      <h3 className="soil-sub">{en ? "Why is rotation good for soil?" : "¿Por qué rotar es bueno para la tierra?"}</h3>
      <ul className="soil-reasons">
        {en ? <>
          <li><strong>Nutrients</strong><p>Different crops draw nutrients from different soil layers.</p></li>
          <li><strong>Natural fertilizer</strong><p>Legumes and bacteria in their roots take nitrogen from the air.</p></li>
          <li><strong>Soil life</strong><p>Different roots and residues contribute organic matter.</p></li>
          <li><strong>Fewer pests</strong><p>Changing crops can interrupt pests and diseases between plantings.</p></li>
        </> : rotationReasons.map(r => <li key={r.title}><strong>{r.title}</strong><p>{r.text}</p></li>)}
      </ul>
    </div>
  );

  const sourcesBlock = (
    <div className="soil-source-links">
      <div className="soil-source-chips" aria-label={en ? "Soil and rotation sources" : "Fuentes de suelo y rotación"}>
        {sourcesList.map(src => <a key={src.url} href={src.url} className="soil-source-chip">{src.label}</a>)}
      </div>
      <p className="soil-source-disclaimer">{en ? "General FAO guidelines, not farm measurements. They do not measure actual nitrogen or organic matter; a soil test is needed. Stars do not change here." : "Reglas generales de la FAO, no medición de tu finca. No miden nitrógeno ni materia orgánica real; para eso hace falta un análisis de suelo. Las estrellas no cambian por esta parte."}</p>
    </div>
  );

  const hasMatrix = known && advice.length > 1;

  return <div className={`soil ${hasMatrix ? "soil-split" : ""}`}>
    <div className="soil-primary">
      <p className="soil-lead">{en ? "Changing crops between plantings protects the soil: it prevents depletion, preserves nutrients, and keeps yields stable." : "Cambiar de cultivo de una siembra a otra cuida la tierra: evita que se gaste, conserva nutrientes y mantiene el rendimiento estable."}</p>
      <div className="soil-diagnoses">
        {top && (() => {
          const note = soilNoteFor(locale, p.previous, top.crop, top.soil);
          const topName = cropLabel(top.crop, locale);
          return (
            <div className={`soil-now ${levelLight[top.soil.level]}`}>
              <span className="soil-tag"><Leaf aria-hidden="true" size={14} /> {en ? "Main rotation" : "Rotación principal"}</span>
              <h3>{known ? `${en ? "From" : "De"} ${cropLabel(p.previous, locale).toLowerCase()} ${en ? "to" : "a"} ${topName.toLowerCase()}` : topName}: {note.title.toLowerCase()}</h3>
              <p>{note.text}</p>
            </div>
          );
        })()}
        {tex && (
          <div className="soil-now lv-none">
            <span className="soil-tag"><Droplets aria-hidden="true" size={14} /> {en ? "Soil texture" : "Tipo de tierra"}</span>
            <h3>{tex.title}</h3>
            <p>{tex.text}{p.texture === "arenosa" && light.length ? ` ${en ? "Crops on your list needing little water" : "De tu lista, piden poca agua"}: ${light.slice(0, 4).join(", ")}.` : ""}</p>
            <p className="soil-declared">{en ? `Reported: ${englishTexture[p.texture!].name.toLowerCase()} (self-reported, not measured).` : `Declarada: ${textureNames[p.texture!].toLowerCase()} (dato tuyo, no análisis).`}</p>
          </div>
        )}
        {col && (
          <div className="soil-now lv-none">
            <span className="soil-tag"><Layers aria-hidden="true" size={14} /> {en ? "Soil color" : "Color del suelo"}</span>
            <h3>{col.title}</h3>
            <p>{col.text}</p>
            <p className="soil-declared">{en ? `Reported: ${englishColor[p.color!].name.toLowerCase()} (visual clue, not a test).` : `Declarado: ${colorNames[p.color!].toLowerCase()} (pista visual, no análisis).`}</p>
          </div>
        )}
      </div>
      {missingHints.length > 0 && <p className="note soil-missing-note">{en ? `You can add ${missingHints.join(", ")} in “Edit” to refine this guide.` : `Puedes agregar ${missingHints.join(", ")} en “Editar” para afinar esta guía.`}</p>}
    </div>
    {hasMatrix && (
      <div className="soil-matrix">
        <h3 className="soil-sub">{en ? "How each crop on your list affects the soil" : "Cómo queda la tierra con cada cultivo de tu lista"}</h3>
        <ul className="soil-list" data-count={advice.length}>
          {advice.map(a => {
            const note = soilNoteFor(locale, p.previous, a.crop, a.soil);
            return (
              <li key={a.crop} className={levelLight[a.soil.level]}>
                <div className="soil-list-head">
                  <strong>{cropLabel(a.crop, locale)}</strong>
                  <span className={`soil-badge ${levelLight[a.soil.level]}`}>{levelBadge[a.soil.level]}</span>
                </div>
                <p className="soil-list-desc">{a.soil.level === "bad" ? (en ? "Same plant family as your previous crop" : "Misma familia que tu cultivo anterior") : note.title}</p>
              </li>
            );
          })}
        </ul>
      </div>
    )}
    <div className="soil-footer">
      {p.supervisor ? (
        <>
          {reasonsBlock}
          <div className="sources-box soil-sources soil-sources-open">{sourcesBlock}</div>
        </>
      ) : (
        <details className="sources-box soil-sources">
          <summary>{en ? "Why rotate and where does this come from?" : "¿Por qué rotar y de dónde sale esto?"}</summary>
          {reasonsBlock}
          {sourcesBlock}
        </details>
      )}
    </div>
  </div>;
}
