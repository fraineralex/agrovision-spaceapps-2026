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
