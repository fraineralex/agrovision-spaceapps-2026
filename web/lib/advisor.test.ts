/* AI: Claude (Anthropic), 2026-11-14 — advisor regression tests. Frainer review pending. */
import test from "node:test";
import assert from "node:assert/strict";
import { adviseNextCrop, adviceSentence, toTareas } from "./advisor";

test("bean followed by maize retains the cited IDIAF benefit", () => {
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

test("only common Dominican crops; perennials are listed after seasonal crops", async () => {
  const { allCrops } = await import("./advisor");
  assert.ok(!allCrops.includes("sorgo" as never));
  for (const c of ["cafe", "cacao", "aguacate", "habichuela_negra", "guineo"]) assert.ok(allCrops.includes(c as never));
  const a = adviseNextCrop({ province: "San José de Ocoa", irrigation: "irrigated", previous: "unknown", sowMonth: 11, priority: "water", crops: ["cafe", "cacao", "habichuela_roja"] });
  assert.equal(a[0].crop, "habichuela_roja");
  assert.equal(a.find(x => x.crop === "cafe")!.harvestMonth, 0);
});


test("locally documented shared hosts lower the recommendation score", () => {
  const opts = { irrigation: "irrigated", sowMonth: 11, priority: "pests" } as const;
  const afterBeans = adviseNextCrop({ ...opts, previous: "habichuela_roja", crops: ["tomate"] })[0];
  const unknown = adviseNextCrop({ ...opts, previous: "unknown", crops: ["tomate"] })[0];
  assert.equal(afterBeans.scores.pests, 1);
  assert.equal(Math.round((unknown.overall! - afterBeans.overall!) * 10), 10);
  assert.equal(afterBeans.sharedPests[0].taxon, "Bemisia tabaci");

  const afterYam = adviseNextCrop({ ...opts, previous: "name", crops: ["habichuela_negra"] })[0];
  assert.equal(afterYam.scores.pests, 1);
  assert.equal(afterYam.sharedPests[0].taxon, "Meloidogyne");

  const afterGuandul = adviseNextCrop({ ...opts, previous: "guandul", crops: ["tomate"] })[0];
  assert.equal(afterGuandul.scores.pests, null);
  assert.equal(afterGuandul.overall, unknown.overall);
});

test("catalog preserves external references and excludes ambiguous group names from matches", async () => {
  const { pestCatalog, sharedPests } = await import("./pests");
  assert.equal(Object.keys(pestCatalog).length, 27);
  assert.equal(sharedPests("name", "yautia").find(p => p.taxon === "Scutellonema bradys")?.external, true);
  assert.equal(sharedPests("aji", "cacao").length, 0);
});

test("precautions follow the actual transition and include surveillance for the next crop", async () => {
  const { pestPrecautions } = await import("./pests");
  assert.match(pestPrecautions("habichuela_roja", "tomate")[0], /mosca blanca.*habichuela roja/);
  assert.match(pestPrecautions("unknown", "tomate")[0], /En tomate, vigila mosca blanca/);
  assert.match(pestPrecautions("name", "yautia")[0], /por confirmar localmente/);
  assert.deepEqual(pestPrecautions("tomate", "unknown"), []);
});


test("sowing uses fresh forecasts for the selected month and applies a dry-start penalty", async () => {
  const { weatherForSowing } = await import("./climate-advice");
  const now = new Date("2026-11-14T16:00:00Z");
  const forecast = {
    source: "open-meteo", kind: "forecast", url: "", fetchedAt: now.toISOString(),
    days: Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-${14 + i}`, rainMm: 0, probPct: 0, tMaxC: 31 })),
    cyclone: true, dustPeak: 40,
  } as const;
  const input = { ...forecast, days: [...forecast.days] };
  assert.equal(weatherForSowing(input, 12, now), undefined);
  assert.equal(weatherForSowing(input, 11, new Date("2026-11-16T16:00:00Z")), undefined);
  const weather = weatherForSowing(input, 11, now);
  assert.equal(weather?.dry, true);
  const advice = adviseNextCrop({ irrigation: "rainfed", previous: "unknown", sowMonth: 11, priority: "water", crops: ["maiz"], weather })[0];
  assert.ok(advice.scores.climate! < 5);
  assert.match(adviceSentence(advice, "unknown"), /cuando pase el riesgo/);
});
