/* AI: Claude (Anthropic), 2026-11-14 — advisor regression tests. Frainer review pending. */
import test from "node:test";
import assert from "node:assert/strict";
import { adviseNextCrop, adviceSentence, toTareas } from "./advisor";

test("bean followed by maize is the only cited pest rule and is rewarded", () => {
  const a = adviseNextCrop({ province: "San Juan", irrigation: "irrigated", previous: "habichuela_roja", sowMonth: 11, priority: "pests" });
  assert.equal(a[0].crop, "maiz");
  assert.equal(a.find(x => x.crop === "maiz")!.scores.pests, 5);
  assert.equal(a.find(x => x.crop === "habichuela_roja")!.scores.pests, 1);
  assert.equal(a.find(x => x.crop === "batata")!.scores.pests, null);
});

test("rice is never recommended without irrigation", () => {
  const a = adviseNextCrop({ province: "Monte Plata", irrigation: "rainfed", previous: "unknown", sowMonth: 5, priority: "market" });
  const rice = a.find(x => x.crop === "arroz")!;
  assert.equal(rice.viable, false);
  assert.equal(rice.overall, null);
  assert.notEqual(a[0].crop, "arroz");
});

test("recommendation changes with the previous crop and sowing month", () => {
  const afterRice = adviceSentence(adviseNextCrop({ province: "San Juan", irrigation: "irrigated", previous: "arroz", sowMonth: 11, priority: "water" })[0], "arroz");
  const afterBean = adviceSentence(adviseNextCrop({ province: "San Juan", irrigation: "irrigated", previous: "habichuela_roja", sowMonth: 11, priority: "water" })[0], "habichuela_roja");
  assert.notEqual(afterRice, afterBean);
  const nov = adviseNextCrop({ irrigation: "irrigated", previous: "unknown", sowMonth: 11, priority: "market" }).find(x => x.crop === "maiz")!;
  const may = adviseNextCrop({ irrigation: "irrigated", previous: "unknown", sowMonth: 5, priority: "market" }).find(x => x.crop === "maiz")!;
  assert.notEqual(nov.harvestMonth, may.harvestMonth);
});

test("hectares convert to Dominican tareas (628.86 m2)", () => {
  assert.equal(toTareas(1), 16);
  assert.equal(toTareas(2.09), 33);
});
