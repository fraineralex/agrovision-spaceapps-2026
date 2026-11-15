/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "./route";

test("explain uses deterministic fallback without gateway key", async () => {
  const key = process.env.AI_GATEWAY_API_KEY;
  delete process.env.AI_GATEWAY_API_KEY;
  const body = JSON.stringify({ month: 11, priority: "water", irrigation: "unconfirmed" });
  const response = await POST(new Request("http://localhost/api/explain", { method: "POST", body }));
  const json = (await response.json()) as { mode: string; model: string | null };
  assert.equal(json.mode, "deterministic");
  assert.equal(json.model, null);
  if (key) process.env.AI_GATEWAY_API_KEY = key;
});