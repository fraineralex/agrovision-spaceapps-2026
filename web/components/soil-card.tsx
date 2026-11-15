/* AI: Claude (Anthropic) & Antigravity, 2026-11-15 — "Rotación y suelo" section. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useMemo } from "react";
import { Droplets, Layers, Leaf } from "lucide-react";
import { adviseNextCrop, previousCropName, recommendedCrop, type AdvicePriority, type CropId, type PreviousCrop } from "@/lib/advisor";
import { colorNames, colorNote, rotationReasons, soilSources, textureNames, textureNote, type SoilColor, type SoilTexture } from "@/lib/soil";
import type { Irrigation } from "@/lib/data";

const levelBadge = { good: "Bueno", ok: "Regular", bad: "Cansa", none: "Fijo" } as const;
const levelLight = { good: "lv-good", ok: "lv-ok", bad: "lv-bad", none: "lv-none" } as const;

export function SoilCard(p: { province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[]; texture?: SoilTexture; color?: SoilColor; supervisor?: boolean }) {
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const tex = p.texture ? textureNote(p.texture) : null;
  const col = p.color ? colorNote(p.color) : null;
  const light = [...advice].filter(a => a.viable && !a.repeats && (a.scores.water ?? 0) >= 3.34).map(a => a.name.toLowerCase());
  const known = p.previous !== "unknown" && p.previous !== "otro";
  const missingHints = [!tex && "tipo de tierra", !col && "color de tierra", !known && "cultivo anterior"].filter(Boolean);
  const sourcesList = [soilSources.rotation, soilSources.legumes, soilSources.color, soilSources.texture];

  const reasonsBlock = (
    <div className="soil-reasons-wrap">
      <h3 className="soil-sub">¿Por qué rotar es bueno para la tierra?</h3>
      <ul className="soil-reasons">{rotationReasons.map(r => <li key={r.title}><strong>{r.title}</strong><p>{r.text}</p></li>)}</ul>
    </div>
  );

  const sourcesBlock = (
    <div className="soil-source-links">
      <div className="soil-source-chips" aria-label="Fuentes de suelo y rotación">
        {sourcesList.map(src => <a key={src.url} href={src.url} className="soil-source-chip">{src.label}</a>)}
      </div>
      <p className="soil-source-disclaimer">Reglas generales de la FAO, no medición de tu finca. No miden nitrógeno ni materia orgánica real; para eso hace falta un análisis de suelo. Las estrellas no cambian por esta parte.</p>
    </div>
  );

  const hasMatrix = known && advice.length > 1;

  return <div className={`soil ${hasMatrix ? "soil-split" : ""}`}>
    <div className="soil-primary">
      <p className="soil-lead">Cambiar de cultivo de una siembra a otra cuida la tierra: evita que se gaste, conserva nutrientes y mantiene el rendimiento estable.</p>
      <div className="soil-diagnoses">
        {top && (
          <div className={`soil-now ${levelLight[top.soil.level]}`}>
            <span className="soil-tag"><Leaf aria-hidden="true" size={14} /> Rotación principal</span>
            <h3>{known ? `De ${previousCropName(p.previous).toLowerCase()} a ${top.name.toLowerCase()}` : top.name}: {top.soil.title.toLowerCase()}</h3>
            <p>{top.soil.text}</p>
          </div>
        )}
        {tex && (
          <div className="soil-now lv-none">
            <span className="soil-tag"><Droplets aria-hidden="true" size={14} /> Tipo de tierra</span>
            <h3>{tex.title}</h3>
            <p>{tex.text}{p.texture === "arenosa" && light.length ? ` De tu lista, piden poca agua: ${light.slice(0, 4).join(", ")}.` : ""}</p>
            <p className="soil-declared">Declarada: {textureNames[p.texture!].toLowerCase()} (dato tuyo, no análisis).</p>
          </div>
        )}
        {col && (
          <div className="soil-now lv-none">
            <span className="soil-tag"><Layers aria-hidden="true" size={14} /> Color del suelo</span>
            <h3>{col.title}</h3>
            <p>{col.text}</p>
            <p className="soil-declared">Declarado: {colorNames[p.color!].toLowerCase()} (pista visual, no análisis).</p>
          </div>
        )}
      </div>
      {missingHints.length > 0 && <p className="note soil-missing-note">Puedes agregar {missingHints.join(", ")} en “Editar” para afinar esta guía.</p>}
    </div>
    {hasMatrix && (
      <div className="soil-matrix">
        <h3 className="soil-sub">Cómo queda la tierra con cada cultivo de tu lista</h3>
        <ul className="soil-list" data-count={advice.length}>
          {advice.map(a => (
            <li key={a.crop} className={levelLight[a.soil.level]}>
              <div className="soil-list-head">
                <strong>{a.name}</strong>
                <span className={`soil-badge ${levelLight[a.soil.level]}`}>{levelBadge[a.soil.level]}</span>
              </div>
              <p className="soil-list-desc">{a.soil.level === "bad" ? "Misma familia que tu cultivo anterior" : a.soil.title}</p>
            </li>
          ))}
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
          <summary>¿Por qué rotar y de dónde sale esto?</summary>
          {reasonsBlock}
          {sourcesBlock}
        </details>
      )}
    </div>
  </div>;
}
