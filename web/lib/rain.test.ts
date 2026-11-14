/* AI: Claude (Anthropic), 2026-11-14 — rain alert rules. Frainer review pending. */
import test from "node:test";
import assert from "node:assert/strict";
import { rainAlert, type RainDay } from "./rain";
const days = (mm: number[], prob = 80, t = 30): RainDay[] => mm.map((m, i) => ({ date: `2026-11-${String(16 + i).padStart(2, "0")}`, rainMm: m, probPct: prob, tMaxC: t }));
test("rain coming on a given day says not to irrigate that day", () => {
  const a = rainAlert({ source: "open-meteo", kind: "forecast", url: "", fetchedAt: "", days: days([0, 0, 0, 12, 0, 0, 0]) });
  assert.equal(a.level, "rain"); assert.match(a.sentence, /No riegues el jueves/);
});
test("dry hot week tells to irrigate early", () => {
  const a = rainAlert({ source: "open-meteo", kind: "forecast", url: "", fetchedAt: "", days: days([0, 0.5, 0, 0, 1, 0, 0], 10, 34) });
  assert.equal(a.level, "dry"); assert.match(a.sentence, /Semana seca y caliente/);
});
test("NASA POWER fallback talks about past days, not a forecast", () => {
  const a = rainAlert({ source: "nasa-power", kind: "recent", url: "", fetchedAt: "", days: days([0, 0, 1, 0, 0, 0, 0]) });
  assert.match(a.sentence, /Sin pronóstico ahora/);
});
