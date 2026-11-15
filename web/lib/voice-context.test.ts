/* AI: Antigravity, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import test from "node:test";
import assert from "node:assert/strict";
import { isProjectQuestion, localVoiceAnswer, projectScopeRefusal, type VoiceSelection } from "./voice-context";

const sampleSelection: VoiceSelection = {
  parcelId: "demo-01",
  month: 11,
  irrigation: "irrigated",
  priority: "balanced",
  previousCrop: "habichuela_roja",
  crops: "maiz,habichuela_roja",
};

test("isProjectQuestion accepts AgroVision and farm questions and rejects unrelated topics", () => {
  assert.equal(isProjectQuestion("¿Qué me conviene sembrar después de habichuela?"), true);
  assert.equal(isProjectQuestion("¿Cómo funciona AgroVision y qué fuentes NASA usa?"), true);
  assert.equal(isProjectQuestion("What pests should I watch on maize?"), true);
  assert.equal(isProjectQuestion("hola"), true);

  assert.equal(isProjectQuestion("¿Quién ganó el mundial de fútbol?"), false);
  assert.equal(isProjectQuestion("Escríbeme un código en Python para ordenar números"), false);
  assert.equal(isProjectQuestion("Cuánto es 25 * 48?"), false);
  assert.equal(isProjectQuestion("Cuéntame un chiste", true), false);
});

test("localVoiceAnswer refuses out-of-scope topics in the active locale", () => {
  assert.equal(localVoiceAnswer(sampleSelection, "Escríbeme un poema de amor", "es"), projectScopeRefusal("es"));
  assert.equal(localVoiceAnswer(sampleSelection, "Write a JavaScript function to sort numbers", "en"), projectScopeRefusal("en"));
});
