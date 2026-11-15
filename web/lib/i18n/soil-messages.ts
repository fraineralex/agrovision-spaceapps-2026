/* AI: OpenAI Codex, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import { soilFamily, type SoilColor, type SoilTexture } from "@/lib/soil";
import { cropLabel } from "./advice";
import type { Locale } from "./messages";

export const soilMessages = {
 en: { texture: "What is your soil like?", color: "What color is your soil?", optional: "optional", sandy: "Sandy", loam: "Mixed", clay: "Clay", unknown: "I don't know", textureHint: "Sandy soil is loose and slips between your fingers. Clay sticks when wet and cracks when dry. Mixed soil is neither sand nor clay and crumbles easily.", black: "Black", red: "Red", yellow: "Yellow", gray: "Gray", white: "White", heading: "Rotation and soil", help: "Learn how changing crops can help soil through nutrients, natural fertilizer from legumes and organic matter.", pestHeading: "Pests to watch", pestHelp: "Main pests for the crops on your list according to Dominican guides, and whether they overlap with your previous crop." },
 es: { texture: "¿Cómo es tu tierra?", color: "¿De qué color es tu tierra?", optional: "opcional", sandy: "Arenosa", loam: "Mezclada", clay: "Barro", unknown: "No sé", textureHint: "Arenosa: suelta, se escurre entre los dedos. Barro: se pega cuando se moja y se agrieta al secarse. Mezclada: ni arena ni barro, se desmorona fácil.", black: "Negra", red: "Roja", yellow: "Amarilla", gray: "Gris", white: "Blanca", heading: "Rotación y suelo", help: "Explica por qué cambiar de cultivo cuida la tierra: nutrientes, abono natural de las leguminosas y materia orgánica.", pestHeading: "Plagas a vigilar", pestHelp: "Lista las plagas principales de cada cultivo de tu lista según guías dominicanas, y si se repiten con tu cultivo anterior." },
} as const;
export const englishTexture: Record<SoilTexture, {name:string; title:string; text:string}> = {
 arenosa: {name:"sandy",title:"Your soil holds little water",text:"Sandy soil drains quickly and holds little water. Pay attention to crops that need less water and to irrigation or planting near rainfall."},
 franca: {name:"mixed",title:"Your soil holds water and drains well",text:"Mixed soil holds an intermediate amount of water and drains well. It suits most crops on your list."},
 arcillosa: {name:"clay",title:"Your soil holds a lot of water",text:"Clay soil holds much water but takes two or three days to drain. It can become waterlogged after heavy rain; check drainage."},
};
export const englishColor: Record<SoilColor, {name:string; title:string; text:string}> = {
 negra:{name:"black or dark",title:"Dark soil: often contains organic matter",text:"The dark color often comes from humus, decomposed organic matter. Leaving crop residue and rotating can help maintain it."},
 roja:{name:"red",title:"Red soil: contains iron",text:"Red comes from iron oxides and is common in warm climates. Color alone does not reveal nutrient levels; legumes and crop residues can help care for soil."},
 amarilla:{name:"yellow",title:"Yellow soil: contains iron",text:"Yellow comes from another iron oxide that forms in aerated soil. Color alone does not reveal nutrient levels."},
 gris:{name:"gray",title:"Gray soil: may become waterlogged",text:"Gray can appear when soil remains saturated for long periods. Check drainage before planting, especially in the rainy season."},
 blanca:{name:"white or very light",title:"White or very light soil",text:"White often comes from lime, gypsum or washed sand. Ask your technician about a soil test before investing in planting."},
};
export function englishSoilNote(previous: string, crop: string) {
 const p=soilFamily(previous), n=soilFamily(crop), name=cropLabel(crop,"en"), prev=cropLabel(previous,"en").toLowerCase();
 if(n==="permanente") return {title:"Permanent crop",text:`${name} stays in the field for years and is not part of crop-to-crop rotation.`};
 if(!p || !n) return {title:"Change crops",text:"Changing crops can help soil: plants draw nutrients from different layers and leave different roots and residues."};
 if(previous===crop || p===n) return {title:"Tires the soil",text:`${name} and ${prev} are in the same crop family. Repeating a family draws similar nutrients and can carry pests and diseases to the next planting.`};
 if(p==="leguminosa") return {title:"Uses natural fertilizer",text:`The previous crop, ${prev}, is a legume. Bacteria in its roots take nitrogen from the air and leave it in the soil; ${name} belongs to a different family and may benefit.`};
 if(n==="leguminosa") return {title:"Returns nitrogen to the soil",text:`${name} is a legume. Bacteria in its roots take nitrogen from the air and leave it in the soil, helping replenish soil after ${prev}.`};
 return {title:"Gives the soil a rest",text:`${name} belongs to a different family from ${prev}. Their roots draw nutrients from different layers and leave different residues that help form organic matter.`};
}
export function soilNoteFor(locale: Locale, previous: string, crop: string, spanish: {title:string; text:string}) { return locale === "es" ? spanish : englishSoilNote(previous,crop); }
