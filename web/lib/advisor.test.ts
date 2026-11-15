/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
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

test("rotates away from potato and skips crops without data", () => {
  const ranked = adviseNextCrop({ province: "La Vega", irrigation: "rainfed", previous: "papa", sowMonth: 11, priority: "balanced", crops: ["papa", "cebolla", "cebolla", "ajo"] });
  assert.deepEqual(ranked.map(row => row.crop), ["cebolla", "papa"]);
  assert.ok(ranked[1].repeats);
  assert.match(ranked[1].warnings.join(" "), /Repetir/);
});

test("whyThisCrop explains the pick in plain words without inventing pest comparisons", async () => {
  const { adviseNextCrop, recommendedCrop, whyThisCrop, starsFor, pillarTitle } = await import("./advisor");
  const all = adviseNextCrop({ province: "San Juan", irrigation: "rainfed", previous: "habichuela_roja", sowMonth: 11, priority: "balanced" as never, crops: ["habichuela_roja", "maiz", "yuca"] });
  const top = recommendedCrop(all)!;
  const lines = whyThisCrop(top, all, "habichuela_roja");
  assert.ok(lines.length >= 2);
  assert.ok(lines.every(l => !/puntaje|Kc|índice/i.test(l)));
  assert.ok(lines.some(l => l.startsWith("¿Por qué no")));
  const next = all.find(x => x.viable && x.crop !== top.crop && x.overall !== null)!;
  if (next.scores.pests === null) assert.ok(!lines.some(l => l.includes("menos riesgo de plagas")));
  assert.equal(starsFor(4.4), 4); assert.equal(starsFor(null), 0); assert.equal(starsFor(0.2), 1);
  assert.equal(pillarTitle("water", 4), "Pide poca agua"); assert.equal(pillarTitle("pests", null), "Sin dato");
});

test("options always show at least three strategies including the current crop", async () => {
  const { fiveOptions } = await import("./advisor");
  const opts = fiveOptions({ province: "San Juan", irrigation: "rainfed", previous: "habichuela_roja", sowMonth: 11, crops: ["habichuela_roja", "maiz", "yuca"] });
  const crops = new Set(opts.flatMap(o => o.advice ? [o.advice.crop] : []));
  assert.ok(crops.size >= 3, `only ${crops.size} strategies`);
  assert.ok(opts.some(o => o.key === "keep" && o.advice?.crop === "habichuela_roja"));
});
test("advice carries a soil rotation note and the sentence leads with the soil", async () => {
  const { adviseNextCrop, adviceSentence, recommendedCrop } = await import("./advisor");
  const all = adviseNextCrop({ province: "San Juan", irrigation: "irrigated", previous: "habichuela_roja", sowMonth: 11, priority: "balanced" as never, crops: ["habichuela_roja", "maiz", "yuca"] });
  const top = recommendedCrop(all)!;
  assert.equal(top.soil.level, "good");
  assert.match(adviceSentence(top, "habichuela_roja"), /abono natural/);
  assert.equal(all.find(a => a.crop === "habichuela_roja")!.soil.level, "bad");
});

test("pests never read as 'no data' when both crops are in the Dominican catalogue", async () => {
  const { adviseNextCrop } = await import("./advisor");
  const all = adviseNextCrop({ province: "San Juan", irrigation: "irrigated", previous: "arroz", sowMonth: 11, priority: "balanced" as never, crops: ["arroz", "maiz", "yuca", "batata", "tomate"] });
  const maiz = all.find(a => a.crop === "maiz")!;
  assert.equal(maiz.pestState, "different");
  assert.equal(maiz.titles.pests, "Plagas distintas");
  assert.equal(maiz.scores.pests, null); // stars unchanged
  assert.ok(maiz.watch.includes("gusano cogollero"));
  for (const a of all) assert.ok(!/sin dato|no tenemos datos/i.test(a.titles.pests + a.words.pests), a.crop);
  const unknownPrev = adviseNextCrop({ province: "San Juan", irrigation: "irrigated", previous: "unknown", sowMonth: 11, priority: "balanced" as never, crops: ["maiz"] })[0];
  assert.equal(unknownPrev.pestState, "listed");
  assert.match(unknownPrev.words.pests, /Vigila gusano cogollero/);
});
