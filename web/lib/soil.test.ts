/* AI: Claude (Anthropic), 2026-11-15 — soil rotation note tests. Frainer review pending. */
import test from "node:test";
import assert from "node:assert/strict";
import { soilFamily, soilNote, rotationReasons, soilSources } from "./soil";

test("legume before another family credits nitrogen with the FAO legume source", () => {
  const n = soilNote("habichuela_roja", "maiz", "Habichuela roja", "Maíz");
  assert.equal(n.level, "good");
  assert.match(n.text, /nitrógeno/);
  assert.ok(n.sources.includes("legumes"));
});
test("same crop or same family is flagged as tiring the soil", () => {
  assert.equal(soilNote("maiz", "maiz", "Maíz", "Maíz").level, "bad");
  assert.equal(soilNote("habichuela_roja", "guandul", "Habichuela roja", "Guandul").level, "bad");
  assert.equal(soilNote("tomate", "aji", "Tomate", "Ají").level, "bad");
});
test("a legume after another family returns nitrogen; other changes rest the soil", () => {
  assert.match(soilNote("maiz", "habichuela_negra", "Maíz", "Habichuela negra").title, /nitrógeno/);
  assert.equal(soilNote("arroz", "batata", "Arroz", "Batata").title, "Le da descanso a la tierra");
});
test("unknown previous crop and perennials make no rotation claim", () => {
  assert.equal(soilNote("unknown", "maiz", "otro cultivo", "Maíz").level, "none");
  assert.equal(soilNote("maiz", "cafe", "Maíz", "Café").level, "none");
  assert.equal(soilFamily("__proto__"), undefined);
});
test("every general reason cites a listed source and gives no numbers", () => {
  for (const r of rotationReasons) { assert.ok(soilSources[r.source].url.startsWith("https://")); assert.ok(!/\d/.test(r.text)); }
});
test("soil colour notes are clues with a source and never claim nutrient amounts", async () => {
  const { colorNote, soilSources } = await import("./soil");
  for (const c of ["negra", "roja", "amarilla", "gris", "blanca"] as const) { const n = colorNote(c); assert.ok(n.title && n.text); assert.ok(!/\d/.test(n.text)); }
  assert.match(colorNote("gris").text, /agua/);
  assert.match(colorNote("negra").text, /materia orgánica/);
  assert.ok(soilSources.color.url.startsWith("https://"));
});
test("pest kinds come from the common name", async () => {
  const { pestKind } = await import("./pests");
  assert.equal(pestKind({ name: "Nematodos agalladores" }).kind, "nematodo");
  assert.equal(pestKind({ name: "Ácaro del vaneo" }).kind, "ácaro");
  assert.equal(pestKind({ name: "Gusano cogollero" }).kind, "insecto");
});
