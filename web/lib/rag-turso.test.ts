/* AI: Codex (OpenAI), 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import test from "node:test";
import assert from "node:assert/strict";
import type { Client } from "@libsql/client";
import { retrieveVector, type RagIndex } from "./rag";
import { retrieveFromTurso } from "./rag-turso";

const meta = { id: "one", title: "Title", sourceName: "Source", filePath: "guide.md", text: "Grounded text" };
const index: RagIndex = {
  schemaVersion: 1, generatedAt: "2026-11-15", embeddingModel: "embedding-model", dimensions: 2,
  chunkCount: 1, chunks: [{ meta, vector: [1, 0] }],
};

test("Turso retrieval is preferred and returns the same ranked chunk shape", async () => {
  let closed = false;
  const expected = [{ ...meta, score: 0.8 }];
  const results = await retrieveVector([1, 0], index, {
    configured: () => true,
    createClient: () => ({ close: () => { closed = true; } } as Client),
    retrieve: async () => expected,
  });
  assert.deepEqual(results, expected);
  assert.equal(closed, true);
});

test("missing Turso configuration uses the bundled JSON ranking", async () => {
  const results = await retrieveVector([1, 0], index, { configured: () => false });
  assert.equal(results.length, 1);
  assert.equal(results[0]?.id, "one");
  assert.equal(results[0]?.score, 1);
});

test("Turso errors fall back to the bundled JSON ranking", async () => {
  const results = await retrieveVector([1, 0], index, {
    configured: () => true,
    createClient: () => ({ close() {} } as Client),
    retrieve: async () => { throw new Error("database unavailable"); },
  });
  assert.equal(results.length, 1);
  assert.equal(results[0]?.id, "one");
});

test("Turso SQL uses vector_top_k and maps cosine scores and source metadata", async () => {
  let statement = "";
  const client = {
    execute: async (arg: { sql: string }) => {
      statement = arg.sql;
      return { rows: [{ id: "one", title: "Title", source: "Source", url: null,
        text: "Grounded text", metadata: JSON.stringify({ filePath: "guide.md" }), score: 0.8 }] };
    },
  };
  const results = await retrieveFromTurso(client as unknown as Client, [1, 0]);
  assert.match(statement, /vector_top_k/);
  assert.match(statement, /vector_distance_cos/);
  assert.deepEqual(results, [{ ...meta, score: 0.8 }]);
});
