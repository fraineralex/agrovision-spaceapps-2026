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
