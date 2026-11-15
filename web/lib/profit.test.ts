/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — profit range tests. Frainer review pending. */
import test from "node:test";
import assert from "node:assert/strict";
import { CPI, profitFor } from "./profit";
test("beans: cost scales with tareas and inflation; range is ordered", () => {
  const p = profitFor("habichuela_roja", 10, "irrigated");
  assert.ok(!("unavailable" in p));
  if ("unavailable" in p) return;
  assert.equal(Math.round(p.costRD), Math.round(6178.87 * CPI.factor * 10));
  assert.ok(p.profit.low <= p.profit.mid && p.profit.mid <= p.profit.high);
  assert.equal(p.yieldLb, 2500);
});
test("rice is not computed because units do not match", () => {
  const p = profitFor("arroz", 40, "irrigated");
  assert.ok("unavailable" in p);
});
test("crops without 2019 costs say so instead of inventing", () => {
  assert.ok("unavailable" in profitFor("cafe", 5));
});

test("Carmen’s rainfed potato does not borrow irrigated costs or yield", () => {
  const p = profitFor("papa", 10, "rainfed");
  assert.ok("unavailable" in p && p.unavailable.includes("secano"));
});
