/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getFarmerComparison } from "./farmer-comparison";
import raw from "../public/data/farmer-pillars.json";
import power from "../public/data/power/-70.200,18.800.json";

test("San Juan preserves exact derived scenario IDs and water/climate scores",()=>{
  const scenarios=getFarmerComparison(true,null,"water");
  for(const s of scenarios){
    const original=raw.waterClimate.scenarios.find(r=>r.id===s.id)!;
    assert.equal(s.scores.water,original.pillars.find(p=>p.pillar==="water_soil")!.score);
    assert.equal(s.scores.climate,original.pillars.find(p=>p.pillar==="climate")!.score);
    assert.notEqual(s.scores.market,null);
    assert.match(s.details.market,/Santo Domingo/);
  }
  assert.equal(scenarios.find(s=>s.id==="habichuela_maiz")!.scores.pests,5);
  assert.equal(scenarios.find(s=>s.id==="habichuela_guandul_maiz")!.scores.pests,null);
});
test("national climate uses own cache and never borrows San Juan",()=>{
  const missing=getFarmerComparison(false,null,"climate");
  assert.ok(missing.every(s=>s.scores.climate===null));
  const cached=getFarmerComparison(false,power,"climate");
  assert.ok(cached.every(s=>s.scores.climate!==null));
  const uniform={...power,monthly:power.monthly.map(m=>({...m,temperatureC:20}))};
  assert.ok(getFarmerComparison(false,uniform,"climate").every(s=>s.scores.climate===5));
  const incomplete={...power,monthly:power.monthly.slice(1)};
  assert.ok(getFarmerComparison(false,incomplete,"climate").every(s=>s.scores.climate===null));
});
