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
