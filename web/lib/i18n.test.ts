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
