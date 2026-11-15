/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import test from "node:test";
import assert from "node:assert/strict";
import { chunkDocument, cosineSimilarity, rankChunks } from "./rag-chunk";
import { corpusDocs } from "./rag-corpus";
import { RAG_MIN_SCORE } from "./rag-config";

test("chunkDocument splits long text with overlap-friendly sizes", () => {
  const doc = corpusDocs[0]!;
  const body = "A".repeat(5000);
  const chunks = chunkDocument(doc, body, "test");
  assert.ok(chunks.length >= 2);
  for (const c of chunks) {
    assert.ok(c.text.length >= 1);
    assert.equal(c.sourceName, doc.sourceName);
    assert.match(c.id, /^test-/);
  }
});

test("cosineSimilarity ranks identical vectors highest", () => {
  const a = [1, 0, 0];
  const b = [1, 0, 0];
  const c = [0, 1, 0];
  assert.ok(cosineSimilarity(a, b) > cosineSimilarity(a, c));
  assert.equal(cosineSimilarity(a, b), 1);
});

test("rankChunks returns empty below min score threshold", () => {
  const meta = { id: "x-1", title: "T", sourceName: "S", filePath: "f", text: "body" };
  const entries = [
    { meta, vector: [1, 0, 0] },
    { meta: { ...meta, id: "x-2" }, vector: [0, 1, 0] },
  ];
  const query = [1, 0, 0];
  const ranked = rankChunks(query, entries, 5, RAG_MIN_SCORE);
  assert.equal(ranked.length, 1);
  assert.ok(ranked[0]!.score >= RAG_MIN_SCORE);
  const weak = rankChunks([0, 0, 1], entries, 5, RAG_MIN_SCORE);
  assert.equal(weak.length, 0);
});