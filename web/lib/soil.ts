/* AI: Claude (Anthropic), 2026-11-15 — plain soil-rotation notes (nutrients, roots, nitrogen). Frainer review pending. See AI_USAGE.md. */
// General agronomic rules from the FAO, not measurements of a farm. They explain the rotation; they do not change the stars.

export const soilSources = {
  rotation: { label: "FAO · Agricultura de conservación: diversificación de especies y rotación", url: "https://www.fao.org/conservation-agriculture/in-practice/species-diversification/es/" },
  legumes: { label: "FAO (2016) · Las legumbres y la biodiversidad", url: "https://fao.org/fileadmin/user_upload/pulses-2016/docs/factsheets/Biodiversity_SP_PRINT.pdf" },
  texture: { label: "FAO · Manual de riego n.º 1, capítulo 2: suelo y agua", url: "https://www.fao.org/4/r4082e/r4082e03.htm" },
  color: { label: "Soil Science Society of America · El color del suelo (adaptado de Lynn y Pearson, 2000)", url: "https://www.soils4teachers.org/files/s4t/color-of-soil-handout-with-images.pdf" },
} as const;

/** Soil colour as the farmer sees it. A clue, not a soil test. */
export type SoilColor = "negra" | "roja" | "amarilla" | "gris" | "blanca";
export const colorNames: Record<SoilColor, string> = { negra: "Negra u oscura", roja: "Roja", amarilla: "Amarilla", gris: "Gris", blanca: "Blanca o muy clara" };
export function colorNote(c: SoilColor): { title: string; text: string } {
  if (c === "negra") return { title: "Tierra oscura: suele tener materia orgánica", text: "El color oscuro suele venir del humus, que es la materia orgánica ya descompuesta. Es buena señal. Dejar el rastrojo y rotar ayuda a mantenerla." };
  if (c === "roja") return { title: "Tierra roja: tiene hierro", text: "El rojo viene de óxidos de hierro y es común en climas calientes. El color solo no dice cuántos nutrientes tiene: rotar con leguminosas y dejar rastrojo ayuda a cuidarla." };
  if (c === "amarilla") return { title: "Tierra amarilla: tiene hierro", text: "El amarillo viene de otro óxido de hierro, que se forma en tierras donde entra el aire. El color solo no dice cuántos nutrientes tiene." };
  if (c === "gris") return { title: "Tierra gris: puede encharcarse", text: "El gris aparece cuando la tierra pasa mucho tiempo llena de agua. Revisa el drenaje antes de sembrar, sobre todo en época de lluvia." };
  return { title: "Tierra blanca o muy clara", text: "El color blanco suele venir de cal, yeso o arena lavada. Pregunta a tu técnico por un análisis antes de invertir en la siembra." };
}

/** Soil texture as the farmer declares it (local soil information; not measured by AgroVision). */
export type SoilTexture = "arenosa" | "franca" | "arcillosa";
export const textureNames: Record<SoilTexture, string> = { arenosa: "Arenosa (suelta)", franca: "Mezclada (ni arena ni barro)", arcillosa: "Arcillosa (pesada, barro)" };
/** FAO Training Manual 1, ch. 2: available water 25–100 (sand), 100–175 (loam), 175–250 (clay) mm per metre; sandy soils drain in hours, clayey in 2–3 days. */
export function textureNote(t: SoilTexture): { title: string; text: string } {
  if (t === "arenosa") return { title: "Tu tierra guarda poca agua", text: "La tierra arenosa deja pasar el agua rápido y guarda poca. Fíjate más en los cultivos que piden poca agua y en regar o sembrar cerca de la lluvia." };
  if (t === "arcillosa") return { title: "Tu tierra guarda mucha agua", text: "La tierra arcillosa guarda mucha agua, pero tarda 2 o 3 días en escurrir. Después de aguaceros fuertes puede encharcarse: cuida el drenaje." };
  return { title: "Tu tierra guarda bien el agua sin encharcarse", text: "La tierra mezclada (ni arena ni barro) guarda una cantidad intermedia de agua y escurre bien. Sirve para la mayoría de los cultivos de tu lista." };
}

export type SoilFamily = "leguminosa" | "grano" | "raiz" | "tomate" | "auyama" | "cebolla" | "repollo" | "zanahoria" | "permanente";
const families: Record<string, SoilFamily> = {
  habichuela_roja: "leguminosa", habichuela_negra: "leguminosa", guandul: "leguminosa", mani: "leguminosa",
  maiz: "grano", arroz: "grano", cana: "grano",
  yuca: "raiz", batata: "raiz", yautia: "raiz", name: "raiz",
  tomate: "tomate", aji: "tomate", berenjena: "tomate", papa: "tomate", tabaco: "tomate",
  auyama: "auyama", pepino: "auyama",
  cebolla: "cebolla", ajo: "cebolla", repollo: "repollo", zanahoria: "zanahoria",
  platano: "permanente", guineo: "permanente", cafe: "permanente", cacao: "permanente", aguacate: "permanente", pina: "permanente", mango: "permanente", coco: "permanente", lechosa: "permanente", limon: "permanente",
};
/** Family in campo words, for sentences like "es de la familia de …". */
export const familyWords: Record<SoilFamily, string> = {
  leguminosa: "las leguminosas (las que echan vaina)", grano: "los granos como el maíz y el arroz", raiz: "las raíces y tubérculos",
  tomate: "la familia del tomate, el ají y la papa", auyama: "la familia de la auyama y el pepino", cebolla: "la familia de la cebolla y el ajo",
  repollo: "la familia del repollo", zanahoria: "la familia de la zanahoria", permanente: "los cultivos permanentes",
};
export const soilFamily = (crop: string): SoilFamily | undefined => Object.hasOwn(families, crop) ? families[crop] : undefined;

export type SoilNote = { level: "good" | "ok" | "bad" | "none"; title: string; text: string; sources: (keyof typeof soilSources)[] };

/** What changing from `previous` to `next` does for the soil, in plain words. Names are display names. */
export function soilNote(previous: string, next: string, prevName: string, nextName: string): SoilNote {
  const p = soilFamily(previous), n = soilFamily(next);
  const prev = prevName.toLowerCase();
  if (n === "permanente") return { level: "none", title: "Cultivo permanente", text: `${nextName} se queda años en el terreno: no entra en la rotación de una siembra a otra.`, sources: ["rotation"] };
  if (!p || !n) return { level: "none", title: "Cambia de cultivo", text: "Cambiar de cultivo de una siembra a otra ayuda a la tierra: cada planta busca los nutrientes en una capa distinta y deja raíces y rastrojo diferentes.", sources: ["rotation"] };
  if (previous === next || p === n) return {
    level: "bad", title: "Cansa la tierra",
    text: `${nextName} y ${prev} son de ${familyWords[n]}. Sembrar la misma familia seguido saca siempre los mismos nutrientes de la misma capa de tierra y deja pasar sus plagas y enfermedades a la siembra siguiente.`,
    sources: ["rotation"],
  };
  if (p === "leguminosa") return {
    level: "good", title: "Aprovecha el abono natural",
    text: `Tu cultivo anterior, ${prev}, es leguminosa: en sus raíces viven bacterias que toman nitrógeno del aire y lo dejan en la tierra, como un abono natural. ${nextName} es de otra familia y puede aprovecharlo.`,
    sources: ["legumes", "rotation"],
  };
  if (n === "leguminosa") return {
    level: "good", title: "Devuelve nitrógeno a la tierra",
    text: `${nextName} es leguminosa: en sus raíces viven bacterias que toman nitrógeno del aire y lo dejan en la tierra. Después de ${prev}, ayuda a reponer lo que se gastó y deja mejor el terreno para la siembra que venga.`,
    sources: ["legumes", "rotation"],
  };
  return {
    level: "good", title: "Le da descanso a la tierra",
    text: `${nextName} es de otra familia que ${prev}. Sus raíces buscan los nutrientes en otra capa de la tierra y dejan un rastrojo distinto, que ayuda a formar materia orgánica.`,
    sources: ["rotation"],
  };
}

/** General reasons shown in the "Rotación y suelo" section. Each one is stated by the FAO sources above. */
export const rotationReasons: { title: string; text: string; source: keyof typeof soilSources }[] = [
  { title: "Nutrientes", text: "Cada cultivo busca su comida en una capa distinta de la tierra. Al cambiar, no se gasta siempre lo mismo y se recuperan nutrientes que habían bajado a lo hondo.", source: "rotation" },
  { title: "Abono natural", text: "Las leguminosas (habichuela, guandul, maní) toman nitrógeno del aire con las bacterias de sus raíces y lo dejan en la tierra.", source: "legumes" },
  { title: "Tierra más suelta y viva", text: "Raíces distintas abren canales diferentes y dejan rastrojo variado. Eso forma materia orgánica y alimenta lombrices y microbios.", source: "rotation" },
  { title: "Menos plagas", text: "Cambiar de cultivo evita que las plagas y enfermedades de una siembra pasen a la siguiente por el rastrojo.", source: "rotation" },
];
