/* AI: Codex (OpenAI), 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import fs from "node:fs";
import path from "node:path";
import { RAG_INDEX_PATH } from "../lib/rag-config";
import { createRagTursoClient, uploadRagChunks } from "../lib/rag-turso";
import type { RagIndex } from "../lib/rag";

async function main() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required");
  }
  const indexPath = path.join(process.cwd(), RAG_INDEX_PATH);
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as RagIndex;
  const client = createRagTursoClient();
  try {
    const rowCount = await uploadRagChunks(client, index.chunks, index.dimensions);
    if (rowCount !== index.chunks.length) throw new Error("Uploaded row count does not match index");
    console.log(`Uploaded ${index.chunks.length} chunks; ${rowCount} rows in Turso.`);
  } finally {
    client.close();
  }
}

main().catch(() => {
  console.error("RAG upload failed.");
  process.exit(1);
});
