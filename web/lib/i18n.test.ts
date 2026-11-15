/* AI: Codex gpt-6.1-terra (OpenAI), 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import assert from "node:assert/strict";
import test from "node:test";
import { messages } from "./i18n/messages";
import { allCrops } from "./advisor";

function leafKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof item === "object" && item !== null ? leafKeys(item, path) : [path];
  }).sort();
}

test("English and Spanish dictionaries have identical keys and cover the crop catalog", () => {
  assert.deepEqual(leafKeys(messages.en), leafKeys(messages.es));
  assert.deepEqual(Object.keys(messages.en.crops).sort(), [...allCrops].sort());
});

import { DEFAULT_LOCALE, localeTag, resolveLocale } from "./i18n/locale";

test("locale preferences fall back to English and have speech and formatting tags", () => {
  assert.equal(DEFAULT_LOCALE, "en");
  assert.equal(resolveLocale("en"), "en");
  assert.equal(resolveLocale("es"), "es");
  assert.equal(resolveLocale(null), "en");
  assert.equal(resolveLocale("fr"), "en");
  assert.equal(localeTag("en"), "en-US");
  assert.equal(localeTag("es"), "es-DO");
});

import { browserLocale, localizedPath } from "./i18n/locale";
test("browser preference respects language weights and supported languages", () => {
  assert.equal(browserLocale("es-DO,es;q=0.9,en;q=0.8"), "es");
  assert.equal(browserLocale("es;q=0.2,en-US;q=0.9"), "en");
  assert.equal(browserLocale("es;q=0,en;q=0.1"), "en");
  assert.equal(browserLocale("fr,es;q=0.5"), "es");
  assert.equal(browserLocale(null), "en");
});
test("locale paths retain the current page", () => {
  assert.equal(localizedPath("/en", "es"), "/es");
  assert.equal(localizedPath("/es/fuentes", "en"), "/en/fuentes");
});

import { adviseNextCrop, recommendedCrop } from "./advisor";
import { pestCatalog } from "./pests";
import { localizedAdviceSentence, localizedPestPrecautions, localizedWarnings, monthLabel } from "./i18n/advice";

test("English pest names cover the catalog and explanations preserve the selected crop", () => {
  for (const crop of Object.values(pestCatalog)) {
    for (const pest of crop.pests) assert.ok(Object.hasOwn(messages.en.pests, pest.name), `Missing pest: ${pest.name}`);
  }
  const advice = adviseNextCrop({ province: "San Juan", irrigation: "irrigated", previous: "habichuela_roja", sowMonth: 1, priority: "balanced", crops: ["maiz", "yuca", "arroz"] });
  const top = recommendedCrop(advice);
  assert.ok(top);
  assert.match(localizedAdviceSentence(top, "habichuela_roja", "en"), new RegExp(messages.en.crops[top.crop], "i"));
  assert.match(localizedAdviceSentence(top, "habichuela_roja", "es"), new RegExp(messages.es.crops[top.crop], "i"));
  assert.ok(localizedPestPrecautions("habichuela_roja", "maiz", "en").length > 0);
  assert.equal(monthLabel(1, "en"), "January");
  assert.equal(monthLabel(1, "es"), "enero");
  assert.ok(localizedWarnings(advice.find(item => item.crop === "maiz")!, "en").every(Boolean));
});

import { localAdviceText, localVoiceAnswer, plantingCalendar, voiceInstructions, type VoiceSelection } from "./voice-context";
import { localizedRainAlert } from "./i18n/rain";
import type { RainForecast } from "./rain";

test("voice answers and planting calendars use the selected language without changing the recommendation", () => {
  const selection: VoiceSelection = { parcelId: "demo-01", month: 1, irrigation: "irrigated", priority: "balanced", previousCrop: "habichuela_roja", crops: "maiz,yuca,arroz", rainAlert: "Possible rain on Monday." };
  assert.match(localAdviceText(selection, "en"), /Consider|not enough information/);
  assert.match(localAdviceText(selection, "es"), /Considera|Falta información/);
  assert.equal(localVoiceAnswer(selection, "Will it rain?", "en"), "Possible rain on Monday.");
  assert.match(localVoiceAnswer(selection, "What should I plant?", "en"), /Consider|not enough information/);
  assert.match(plantingCalendar("When should I plant maize?", "en")?.answer ?? "", /maize/i);
  assert.match(plantingCalendar("¿Cuándo siembro maíz?", "es")?.answer ?? "", /maíz/i);
  assert.match(voiceInstructions(selection, "call", "en"), /Responde siempre en inglés/);
});

test("localized rain alerts keep the same weather level and measurements", () => {
  const forecast: RainForecast = { source: "open-meteo", kind: "forecast", url: "https://example.com", fetchedAt: "2026-11-15T00:00:00Z", days: [{ date: "2026-11-16", rainMm: 14, probPct: 80, tMaxC: 30 }] };
  const en = localizedRainAlert(forecast, "en");
  const es = localizedRainAlert(forecast, "es");
  assert.equal(en.level, es.level);
  assert.match(en.sentence, /14 mm.*80%/);
  assert.match(es.sentence, /14 mm.*80%/);
});

import { localizedWhyThisCrop } from "./i18n/advice";
import { whyThisCrop } from "./advisor";
test("localized why explanations preserve comparison branches", () => {
  const advice = adviseNextCrop({ province: "San Juan", irrigation: "irrigated", previous: "habichuela_roja", sowMonth: 1, priority: "balanced", crops: ["maiz", "yuca", "arroz"] });
  for (const item of advice) {
    assert.deepEqual(localizedWhyThisCrop(item, advice, "habichuela_roja", "es"), whyThisCrop(item, advice, "habichuela_roja"));
    assert.equal(localizedWhyThisCrop(item, advice, "habichuela_roja", "en").length, whyThisCrop(item, advice, "habichuela_roja").length);
  }
});

import { sourceMessages, pestSourceLabels } from "./i18n/source-messages";
import { pestSources } from "./pests";
test("source-panel dictionaries have matching keys, interpolation fields and links", () => {
  assert.deepEqual(leafKeys(sourceMessages.en), leafKeys(sourceMessages.es));
  for (const key of Object.keys(sourceMessages.en) as Array<keyof typeof sourceMessages.en>) {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(placeholders(sourceMessages.en[key]), placeholders(sourceMessages.es[key]), key);
  }
  assert.equal(pestSourceLabels.en.length, pestSources.length);
  assert.deepEqual([...pestSourceLabels.es], pestSources.map(([label]) => label));
});

import { weatherMessages } from "./i18n/weather-messages";
import { localizedDayName, localizedShortDate } from "./i18n/rain";
test("weather dictionaries and date formats follow the language", () => {
  assert.deepEqual(leafKeys(weatherMessages.en), leafKeys(weatherMessages.es));
  for (const key of Object.keys(weatherMessages.en) as Array<keyof typeof weatherMessages.en>) {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(placeholders(weatherMessages.en[key]), placeholders(weatherMessages.es[key]), key);
  }
  assert.equal(localizedDayName("2026-11-16", "en"), "Monday");
  assert.equal(localizedDayName("2026-11-16", "es"), "lunes");
  assert.equal(localizedShortDate("2026-11-16", "en"), "11/16");
  assert.equal(localizedShortDate("2026-11-16", "es"), "16/11");
});

import { droughtMessages } from "./i18n/drought-messages";
test("drought dictionaries have matching keys and interpolation fields", () => {
  assert.deepEqual(leafKeys(droughtMessages.en), leafKeys(droughtMessages.es));
  for (const key of Object.keys(droughtMessages.en) as Array<keyof typeof droughtMessages.en>) {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(placeholders(droughtMessages.en[key]), placeholders(droughtMessages.es[key]), key);
  }
});

import { areaLabel } from "./farms";
test("farm area uses each locale's decimal conventions without changing units", () => {
  assert.equal(areaLabel(2500, "en"), "4.0 tareas · 0.25 ha");
  assert.equal(areaLabel(2500, "es"), "4.0 tareas · 0.25 ha");
});

import { saleMessages } from "./i18n/sale-messages";
test("sale calculator dictionaries have matching keys and interpolation fields", () => {
  assert.deepEqual(leafKeys(saleMessages.en), leafKeys(saleMessages.es));
  for (const key of Object.keys(saleMessages.en) as Array<keyof typeof saleMessages.en>) {
    const english = saleMessages.en[key], spanish = saleMessages.es[key];
    if (typeof english !== "string" || typeof spanish !== "string") continue;
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(placeholders(english), placeholders(spanish), key);
  }
});

import { rd } from "./profit";
test("currency formatting preserves the Dominican peso symbol", () => {
  assert.equal(rd(625, "en"), "RD$625");
  assert.equal(rd(-625, "es"), "−RD$625");
});

import { optionsMessages } from "./i18n/options-messages";
test("alternative option messages have matching keys and fields", () => {
  assert.deepEqual(leafKeys(optionsMessages.en), leafKeys(optionsMessages.es));
  for (const key of Object.keys(optionsMessages.en) as Array<keyof typeof optionsMessages.en>) {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(placeholders(optionsMessages.en[key]), placeholders(optionsMessages.es[key]), key);
  }
});

import { profitMessages } from "./i18n/profit-messages";
test("profit messages preserve keys and interpolation fields", () => {
  assert.deepEqual(leafKeys(profitMessages.en), leafKeys(profitMessages.es));
  for (const key of Object.keys(profitMessages.en) as Array<keyof typeof profitMessages.en>) {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(placeholders(profitMessages.en[key]), placeholders(profitMessages.es[key]), key);
  }
});

import { marketMessages } from "./i18n/market-messages";
import { marketLimits } from "./advisor";
test("market messages and source limitations stay aligned", () => {
  assert.deepEqual(leafKeys(marketMessages.en), leafKeys(marketMessages.es));
  for (const key of Object.keys(marketMessages.en) as Array<keyof typeof marketMessages.en>) {
    const en = marketMessages.en[key], es = marketMessages.es[key];
    if (typeof en !== "string" || typeof es !== "string") continue;
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    assert.deepEqual(placeholders(en), placeholders(es), key);
  }
  assert.deepEqual([...marketMessages.es.limits], marketLimits);
  assert.equal(marketMessages.en.limits.length, marketLimits.length);
});
