/* AI: Codex (OpenAI), 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import { createClient, type Client, type InStatement } from "@libsql/client";
import type { RankedChunk, RagChunkMeta } from "./rag-chunk";
import { RAG_MIN_SCORE, RAG_TOP_K } from "./rag-config";

export const RAG_VECTOR_INDEX = "rag_chunks_vector_idx";
export type RagStoreChunk = {
  meta: RagChunkMeta;
  vector: number[];
};

export function hasTursoConfig(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN);
}

export function createRagTursoClient(env: NodeJS.ProcessEnv = process.env): Client {
  if (!hasTursoConfig(env)) throw new Error("Turso is not configured");
  return createClient({ url: env.TURSO_DATABASE_URL!, authToken: env.TURSO_AUTH_TOKEN! });
}

export async function ensureRagSchema(client: Pick<Client, "execute">, dimensions: number) {
  if (!Number.isInteger(dimensions) || dimensions <= 0) throw new Error("Invalid embedding dimensions");
  await client.execute(`CREATE TABLE IF NOT EXISTS rag_chunks (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    text TEXT NOT NULL,
    metadata JSON NOT NULL,
    embedding F32_BLOB(${dimensions}) NOT NULL
  )`);
  await client.execute(`CREATE INDEX IF NOT EXISTS ${RAG_VECTOR_INDEX} ON rag_chunks (libsql_vector_idx(embedding))`);
}

export async function uploadRagChunks(client: Pick<Client, "execute" | "batch">, chunks: RagStoreChunk[], dimensions: number) {
  await ensureRagSchema(client, dimensions);
  if (chunks.some(chunk => chunk.vector.length !== dimensions)) throw new Error("Embedding dimension mismatch");
  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const statements: InStatement[] = chunks.slice(i, i + batchSize).map(({ meta, vector }) => ({
      sql: `INSERT INTO rag_chunks (id, source, title, url, text, metadata, embedding)
        VALUES (?, ?, ?, ?, ?, ?, vector32(?))
        ON CONFLICT(id) DO UPDATE SET source=excluded.source, title=excluded.title,
        url=excluded.url, text=excluded.text, metadata=excluded.metadata, embedding=excluded.embedding`,
      args: [meta.id, meta.sourceName, meta.title, meta.sourceUrl ?? null, meta.text,
        JSON.stringify({ filePath: meta.filePath }), JSON.stringify(vector)],
    }));
    await client.batch(statements, "write");
  }
  const ids = chunks.map(chunk => chunk.meta.id);
  if (ids.length) {
    await client.execute({
      sql: `DELETE FROM rag_chunks WHERE id NOT IN (${ids.map(() => "?").join(",")})`,
      args: ids,
    });
  } else {
    await client.execute("DELETE FROM rag_chunks");
  }
  const count = await client.execute("SELECT count(*) AS count FROM rag_chunks");
  return Number(count.rows[0]?.count ?? 0);
}

export async function retrieveFromTurso(client: Pick<Client, "execute">, vector: number[]): Promise<RankedChunk[]> {
  const result = await client.execute({
    sql: `SELECT rag_chunks.id, rag_chunks.source, rag_chunks.title, rag_chunks.url,
      rag_chunks.text, rag_chunks.metadata,
      1.0 - vector_distance_cos(rag_chunks.embedding, vector32(?)) AS score
      FROM vector_top_k('${RAG_VECTOR_INDEX}', vector32(?), ?)
      JOIN rag_chunks ON rag_chunks.rowid = id
      ORDER BY score DESC`,
    args: [JSON.stringify(vector), JSON.stringify(vector), RAG_TOP_K],
  });
  return result.rows.map(row => {
    const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) as { filePath?: string } : row.metadata as { filePath?: string };
    return {
      id: String(row.id), title: String(row.title), sourceName: String(row.source),
      ...(row.url == null ? {} : { sourceUrl: String(row.url) }), filePath: metadata.filePath ?? "",
      text: String(row.text), score: Number(row.score),
    };
  }).filter(row => row.score >= RAG_MIN_SCORE).slice(0, RAG_TOP_K);
}
