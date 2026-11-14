/* AI: Claude (Anthropic), 2026-11-14 — rain alert rules. Frainer review pending. */
import test from "node:test";
import assert from "node:assert/strict";
import { currentRain, parseOpenMeteo, rainAlert, type RainDay } from "./rain";
const days = (mm: number[], prob = 80, t = 30): RainDay[] => mm.map((m, i) => ({ date: `2026-11-${String(16 + i).padStart(2, "0")}`, rainMm: m, probPct: prob, tMaxC: t }));
test("forecast names the wet day and probability without prescribing irrigation", () => {
  const a = rainAlert({ source: "open-meteo", kind: "forecast", url: "", fetchedAt: "", days: days([0, 0, 0, 12, 0, 0, 0]) });
  assert.equal(a.level, "rain"); assert.match(a.sentence, /jueves 19\/11.*80%/);
});
test("dry hot forecast describes the modeled conditions", () => {
  const a = rainAlert({ source: "open-meteo", kind: "forecast", url: "", fetchedAt: "", days: days([0, 0.5, 0, 0, 1, 0, 0], 10, 34) });
  assert.equal(a.level, "dry"); assert.match(a.sentence, /Poca lluvia prevista y días calurosos/);
});
test("NASA POWER fallback talks about past days, not a forecast", () => {
  const a = rainAlert({ source: "nasa-power", kind: "recent", url: "", fetchedAt: "", days: days([0, 0, 1, 0, 0, 0, 0]) });
  assert.match(a.sentence, /Sin pronóstico ahora/);
});
test("expired forecast rows are removed and missing rainfall is not presented as zero", () => {
  const forecast = { source: "open-meteo", kind: "forecast", url: "", fetchedAt: "", days: days([12, 0]) } as const;
  assert.deepEqual(currentRain(forecast, "2026-11-17")?.days.map(day => day.rainMm), [0]);
  assert.equal(currentRain(forecast, "2026-11-18"), null);
  assert.deepEqual(parseOpenMeteo({ daily: { time: ["2026-11-17"], precipitation_sum: [null] } }), []);
});
