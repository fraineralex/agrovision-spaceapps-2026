/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import { adviceSentence, marketFor, monthNames, recommendedCrop, whyThisCrop, type CropAdvice, type CropId, type PreviousCrop } from "@/lib/advisor";
import { pestPrecautions, pestsFor, sharedPests } from "@/lib/pests";
import { messages, type Locale } from "./messages";
import { localeTag } from "./locale";

/** Presentation helpers only: the scores and ranking remain in advisor.ts. */
export function cropLabel(crop: string, locale: Locale): string {
  const dict = messages[locale];
  return dict.crops[crop as keyof typeof dict.crops]
    ?? dict.previousCrops[crop as keyof typeof dict.previousCrops]
    ?? crop;
}
export function monthLabel(month: number, locale: Locale): string {
  if (month < 1 || month > 12) return "";
  return new Intl.DateTimeFormat(localeTag(locale), { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2020, month - 1, 1)));
}
function pestLabel(name: string, locale: Locale): string {
  return messages[locale].pests[name as keyof typeof messages.en.pests] ?? name;
}
export function localizedPestPrecautions(previous: PreviousCrop, crop: CropId, locale: Locale): string[] {
  if (locale === "es") return pestPrecautions(previous, crop);
  const candidate = pestsFor(crop);
  if (!candidate) return [];
  const shared = sharedPests(previous, crop);
  const before = pestsFor(previous);
  const result: string[] = [];
  if (before && shared.length) {
    const names = shared.map(pest => pestLabel(pest.name, locale).toLowerCase() + (pest.external ? " (local confirmation pending)" : ""));
    result.push(`Before planting ${cropLabel(crop, locale).toLowerCase()}, check whether ${new Intl.ListFormat(localeTag(locale)).format(names)} occurred in ${cropLabel(previous, locale).toLowerCase()}. If you saw damage, ask your technician to confirm the pest before planting another host.`);
  }
  const next = candidate.pests.find(pest => !pest.external && !shared.some(other => other.taxon && other.taxon === pest.taxon));
  if (next) {
    const action = next.name.toLowerCase().includes("nematodo")
      ? "If plants were weak or roots damaged, ask whether root or soil testing is needed."
      : "Inspect plants from establishment onward and ask your technician if you see damage.";
    result.push(`In ${cropLabel(crop, locale).toLowerCase()}, monitor for ${pestLabel(next.name, locale).toLowerCase()}. ${action}`);
  }
  if (!result.length && candidate.pests.length) result.push("Ask your technician which crop pests to monitor in your area and planting season.");
  return result;
}
export function localizedAdviceSentence(top: CropAdvice | undefined, previous: PreviousCrop, locale: Locale): string {
  if (locale === "es") return adviceSentence(top, previous);
  if (!top || top.repeats || top.overall === null) return "There is not enough information to recommend a crop. Consult your technician.";
  const reasons: string[] = [];
  if (top.scores.pests === 5) reasons.push("IDIAF supports rotating beans with maize");
  if ((top.scores.water ?? 0) >= 3.34) reasons.push("it needs less water than the other crops on your list");
  if ((top.scores.market ?? 0) >= 3.34) reasons.push(`it usually sells better in ${monthLabel(top.harvestMonth, locale)}`);
  if (!reasons.length) reasons.push("it ranks best among the crops on your list");
  const after = previous !== "unknown" && previous !== "otro" ? ` after ${cropLabel(previous, locale).toLowerCase()}` : "";
  return `Consider ${cropLabel(top.crop, locale).toLowerCase()}${after}: ${new Intl.ListFormat(localeTag(locale)).format(reasons.slice(0, 2))}.`;
}
export function localizedOversupply(crop: CropId, harvestMonth: number, locale: Locale): string | null {
  const market = marketFor(crop);
  if (!market || locale === "es") return null;
  const index = harvestMonth ? market.seasonalIndex?.[String(harvestMonth)] ?? null : null;
  if (market.sowing?.status === "alta") {
    const percentage = Math.round(((market.sowing.ratio ?? 1) - 1) * 100);
    return `A lot of ${cropLabel(crop, locale).toLowerCase()} is being planted nationwide (${percentage}% more than usual)${harvestMonth ? `; the price could fall at harvest (${monthLabel(harvestMonth, locale)})` : ""}.`;
  }
  if (typeof index === "number" && index <= 95) return `In ${monthLabel(harvestMonth, locale)}, the historical wholesale price was ${Math.round(100 - index)}% below average.`;
  return null;
}
export function localizedWarnings(a: CropAdvice, locale: Locale): string[] {
  if (locale === "es") return a.warnings;
  const warnings: string[] = [];
  if (!a.cycleDays) warnings.push("This permanent crop takes years to produce and occupies the land for many years. It is an investment, not a rotation.");
  if (!a.viable) warnings.push("Rice needs irrigation; it is not recommended without irrigation.");
  if (a.cycleDays > 300) warnings.push(`This is a long crop (about ${Math.round(a.cycleDays / 30)} months): it occupies the land throughout that time.`);
  if (a.repeats) warnings.push("Repeating the crop can maintain pests in the field. Review the farm's history.");
  const glut = localizedOversupply(a.crop, a.harvestMonth, locale);
  if (glut && a.harvestMonth) warnings.push(glut);
  return warnings;
}
export function spanishMonthIndex(name: string): number { return monthNames.indexOf(name) + 1; }

export function localizedPillarTitle(id: import("@/lib/advisor").Pillar, score: number | null, locale: Locale): string {
  const light = score === null ? "gray" : score >= 3.34 ? "green" : score >= 1.67 ? "amber" : "red";
  return messages[locale].pillarTitles[id][light];
}
export function localizedAdvicePillarTitle(a: CropAdvice, id: import("@/lib/advisor").Pillar, locale: Locale): string {
  if (id === "pests") {
    if (locale === "es") return a.titles.pests;
    if (a.pestState === "different") return "Distinct pests";
    if (a.pestState === "maybe") return "Watch for pests";
    if (a.pestState === "listed") return "Pests to monitor";
  }
  return localizedPillarTitle(id, a.scores[id], locale);
}
export function localizedPillarWord(a: CropAdvice, pillar: import("@/lib/advisor").Pillar, locale: Locale): string {
  const original = a.words[pillar];
  if (locale === "es") return original;
  const translated = messages.en.pillarWords[original as keyof typeof messages.en.pillarWords];
  if (translated) return translated;
  if (pillar === "market" && a.harvestMonth) {
    const index = marketFor(a.crop)?.seasonalIndex?.[String(a.harvestMonth)];
    if (typeof index === "number") {
      const diff = Math.round(index - 100);
      const comparison = diff > 0 ? `${diff}% above` : diff < 0 ? `${-diff}% below` : "equal to";
      return `Harvest in ${monthLabel(a.harvestMonth, locale)}: the price is usually ${comparison} average`;
    }
  }
  return "No reference data";
}

/** Explain the same comparison in the selected language; this does not rank crops. */
export function localizedWhyThisCrop(a: CropAdvice, all: CropAdvice[], previous: PreviousCrop, locale: Locale): string[] {
  if (locale === "es") return whyThisCrop(a, all, previous);
  const name = cropLabel(a.crop, locale);
  if (!a.viable) return [`${name} needs irrigation and you said you do not have it. That is why we do not recommend it now.`];
  const pillars = ["water", "climate", "pests", "market"] as const;
  const good = pillars.filter(p => (a.scores[p] ?? 0) >= 3.34);
  const bad = pillars.filter(p => a.scores[p] !== null && a.scores[p]! < 1.67);
  const positives = { water: "needs little water", climate: "faces no drought in your area now", pests: "helps interrupt pest cycles from the previous crop", market: `is harvested in ${a.harvestMonth ? monthLabel(a.harvestMonth, locale) : "a month"} with a good price` };
  const negatives = { water: "needs a lot of water", climate: "there is drought in your area", pests: "may maintain pests from the previous crop", market: "is harvested when prices are usually low" };
  const list = new Intl.ListFormat(localeTag(locale));
  const result = good.length ? [`${name} scores well because it ${list.format(good.map(p => positives[p]))}.`] : [`${name} does not stand out in any one area, but it does not score poorly in the comparison either.`];
  if (a.soil.level === "good") result.push("For the soil: changing crop families can help maintain soil health. Ask your technician about your soil.");
  if (a.soil.level === "bad") result.push("Soil caution: repeatedly planting the same crop family can deplete similar nutrients and carry pests and diseases forward.");
  if (bad.length) result.push(`Its drawbacks: ${list.format(bad.map(p => negatives[p]))}.`);
  if (a.scores.market !== null && !good.includes("market") && !bad.includes("market")) result.push("The harvest price is average: neither very good nor very bad.");
  if (a.pestState === "different") result.push(`Pests: ${name} and your previous crop do not share their main pests according to Dominican guides, so the change helps interrupt them.${a.watch.length ? ` Watch for ${new Intl.ListFormat(localeTag(locale)).format(a.watch.slice(0, 2).map(p => pestLabel(p, locale).toLowerCase()))} in ${name}.` : ""}`);
  else if (a.pestState === "listed" && a.watch.length) result.push(`Pests: watch for ${new Intl.ListFormat(localeTag(locale)).format(a.watch.slice(0, 2).map(p => pestLabel(p, locale).toLowerCase()))} in ${name}. Tell us what you planted before to compare.`);
  else if (a.pestState === "unknown") result.push(`Pests: the guides we use do not list pests for ${name}. Ask your technician.`);
  const gaps = ["we have not measured your soil (a soil test is needed)", "the price is wholesale in Santo Domingo, not what you receive at the farm"];
  if (a.pestState === "unknown") gaps.unshift(`the guides do not list pests for ${name}`);
  if (a.pestState === "different" || a.pestState === "listed") gaps.unshift("the guides list only major pests; others may occur in your area");
  result.push(`What we do not know: ${gaps.join("; ")}.`);
  const top = recommendedCrop(all);
  if (top?.crop === a.crop) {
    const next = all.find(x => x.viable && x.crop !== a.crop && x.overall !== null);
    if (next) {
      const worse = (["water", "pests", "market"] as const).find(p => a.scores[p] !== null && next.scores[p] !== null && a.scores[p]! - next.scores[p]! >= 0.5);
      const comparison = { water: "needs less water", pests: "has lower pest risk", market: "is harvested at a better price" };
      const nextName = cropLabel(next.crop, locale);
      result.push(worse ? `Why not ${nextName.toLowerCase()}? Because ${name.toLowerCase()} ${comparison[worse]}.`
        : a.scores.pests === 5 && next.scores.pests === null ? `Why not ${nextName.toLowerCase()}? IDIAF recommends a rotation for ${name.toLowerCase()}, but we do not have that information for ${nextName.toLowerCase()}.`
        : `${nextName} scores similarly and is also an option.`);
    }
    const prev = previous !== "unknown" && previous !== "otro" ? all.find(x => x.crop === previous) : undefined;
    if (prev?.repeats) result.push(`Why not repeat ${cropLabel(prev.crop, locale).toLowerCase()}? Planting the same crop repeatedly leaves pests in the field.`);
  } else if (top) result.push(`${cropLabel(top.crop, locale)} scores best on your list.`);
  return result;
}
