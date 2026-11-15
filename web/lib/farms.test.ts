/* AI: Claude (Anthropic), 2026-11-14 — farm geometry tests. Frainer review pending. */
import test from "node:test";
import assert from "node:assert/strict";
import { areaLabel, cellAt, cellsInBox, drawnPiece, m2ToTareas, piecesAreaM2, ringAreaM2, togglePiece } from "./farms";

test("a 50 m grid cell is about 2 500 m² (about 4 tareas)", () => {
  const c = cellAt(-71.23, 18.8);
  const a = ringAreaM2(c.ring);
  assert.ok(Math.abs(a - 2500) < 60, `area ${a}`);
  assert.ok(Math.abs(m2ToTareas(a) - 3.98) < 0.1);
});

test("cell ids are stable so the same cell toggles on and off", () => {
  const a = cellAt(-71.2301, 18.8001), b = cellAt(-71.23012, 18.80012);
  assert.equal(a.id, b.id);
  assert.equal(togglePiece(togglePiece([], a), b).length, 0);
});

test("a dragged box selects the cells inside it", () => {
  const cells = cellsInBox([-71.231, 18.799], [-71.229, 18.801]);
  assert.ok(cells.length >= 12 && cells.length <= 25, `${cells.length}`);
  assert.equal(new Set(cells.map(c => c.id)).size, cells.length);
});

test("a drawn polygon of 100 m × 100 m is about 1 ha and 15.9 tareas", () => {
  const dLat = 100 / 111320, dLon = 100 / (111320 * Math.cos(18.8 * Math.PI / 180));
  const p = drawnPiece([[-71.23, 18.8], [-71.23 + dLon, 18.8], [-71.23 + dLon, 18.8 + dLat], [-71.23, 18.8 + dLat]])!;
  const m2 = piecesAreaM2([p]);
  assert.ok(Math.abs(m2 - 10000) < 150, `${m2}`);
  assert.match(areaLabel(m2), /15[.,]9 tareas · 1[.,]00 ha|16 tareas/);
  assert.equal(drawnPiece([[0, 0], [1, 1]]), null);
});
