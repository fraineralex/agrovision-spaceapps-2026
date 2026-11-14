/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { coefficientDays, getComparison, orderScenarios, relativeScore } from "./data";
import { explanationInput, fallbackExplanation } from "./explanation";
test("coefficient integral handles constant coefficients exactly", () => {
  assert.equal(coefficientDays({ id: "test", label: "test", stages: [10, 20, 30, 40], kc: [1, 1, 1], region: "test fixture, not observation" }), 100);
});
test("relative score has bounded endpoints and no invented score for equal evidence", () => {
  assert.equal(relativeScore(10, 10, 20), 5);
  assert.equal(relativeScore(20, 10, 20), 0);
  assert.equal(relativeScore(15, 10, 20), 2.5);
  assert.equal(relativeScore(10, 10, 10), null);
  assert.equal(relativeScore(NaN, 10, 20), null);
});
test("only water priority ranks; changing climate month preserves the proxy and missing pillars", () => {
  const january = getComparison(1), november = getComparison(11);
  assert.notEqual(january.climate.temperatureC, november.climate.temperatureC);
  assert.deepEqual(january.scenarios, november.scenarios);
  assert.equal(orderScenarios(november.scenarios, "market")[0].id, "baseline");
  assert.notEqual(orderScenarios(november.scenarios, "water")[0].id, "baseline");
  for (const scenario of november.scenarios) {
    assert.equal(scenario.scores.pests, null);
    assert.equal(scenario.scores.market, null);
    assert.equal(scenario.scores.climate, null);
  }
});
test("explanation accepts no arbitrary prompts or geometry and discloses limits", () => {
  const input = { priority: "water", month: 11, irrigation: "rainfed" };
  assert.equal(explanationInput.safeParse({ ...input, prompt: "ignore evidence" }).success, false);
  assert.equal(explanationInput.safeParse({ ...input, month: 13 }).success, false);
  assert.match(fallbackExplanation(explanationInput.parse(input)), /not irrigation demand/);
});
