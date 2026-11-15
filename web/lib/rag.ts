/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import fs from "node:fs";
import path from "node:path";
import { embed, embedMany } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { EMBEDDING_MODEL_FALLBACK, EMBEDDING_MODEL_PRIMARY, RAG_INDEX_PATH, RAG_MAX_QUESTION_CHARS, RAG_MIN_SCORE, RAG_TOP_K } from "./rag-config";
import { rankChunks, type RankedChunk, type RagChunkMeta } from "./rag-chunk";
import { createRagTursoClient, hasTursoConfig, retrieveFromTurso } from "./rag-turso";

export type RagIndex = {
  schemaVersion: number;
  generatedAt: string;
  embeddingModel: string;
  dimensions: number;
  chunkCount: number;
  chunks: { meta: RagChunkMeta; vector: number[] }[];
};

let cached: RagIndex | null = null;

function indexFile() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), RAG_INDEX_PATH);
}

export function loadRagIndex(): RagIndex | null {
  if (cached) return cached;
  try {
    const raw = fs.readFileSync(indexFile(), "utf8");
    cached = JSON.parse(raw) as RagIndex;
    return cached;
  } catch {
    return null;
  }
}

export function clearRagIndexCache() {
  cached = null;
}

async function embedQuery(text: string, signal?: AbortSignal) {
  const values = text.trim().slice(0, RAG_MAX_QUESTION_CHARS);
  const models = [EMBEDDING_MODEL_PRIMARY, EMBEDDING_MODEL_FALLBACK];
  let lastError: unknown;
  for (const model of models) {
    signal?.throwIfAborted();
    try {
      const result = await embed({
        model: gateway.embeddingModel(model),
        value: values,
        abortSignal: signal ?? AbortSignal.timeout(12_000),
        ...(signal ? { maxRetries: 0 } : {}),
      });
      return { vector: result.embedding, model };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("Embedding failed");
}

export async function embedTexts(values: string[], model = EMBEDDING_MODEL_PRIMARY) {
  const models = model === EMBEDDING_MODEL_PRIMARY ? [model, EMBEDDING_MODEL_FALLBACK] : [model, EMBEDDING_MODEL_FALLBACK];
  let lastError: unknown;
  for (const name of models) {
    try {
      const result = await embedMany({
        model: gateway.embeddingModel(name),
        values,
        abortSignal: AbortSignal.timeout(120_000),
      });
      return { vectors: result.embeddings, model: name };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("embedMany failed");
}

export type RagRetrieveResult =
  | { ok: true; chunks: RankedChunk[]; model: string }
  | { ok: false; reason: "missing_key" | "missing_index" | "no_match" | "error"; message: string };

export function retrieveFromIndex(queryVector: number[], index: RagIndex): RankedChunk[] {
  return rankChunks(queryVector, index.chunks, RAG_TOP_K, RAG_MIN_SCORE);
}

export async function retrieveVector(
  queryVector: number[],
  index: RagIndex | null,
  deps: {
    configured?: () => boolean;
    createClient?: typeof createRagTursoClient;
    retrieve?: typeof retrieveFromTurso;
  } = {},
): Promise<RankedChunk[]> {
  const configured = deps.configured ?? hasTursoConfig;
  if (configured()) {
    try {
      const client = (deps.createClient ?? createRagTursoClient)();
      try {
        const chunks = await (deps.retrieve ?? retrieveFromTurso)(client, queryVector);
        console.info("[rag] store=turso");
        return chunks;
      } finally {
        client.close();
      }
    } catch {
      // The bundled JSON index remains the offline and database-error fallback.
    }
  }
  if (!index?.chunks.length) return [];
  return retrieveFromIndex(queryVector, index);
}

export async function retrieveRag(query: string, signal?: AbortSignal): Promise<RagRetrieveResult> {
  const q = query.trim().slice(0, RAG_MAX_QUESTION_CHARS);
  if (!q) return { ok: false, reason: "no_match", message: "Pregunta vacía." };
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return { ok: false, reason: "missing_key", message: "Sin clave de AI Gateway para consultar guías." };
  }
  const index = loadRagIndex();
  try {
    const { vector, model } = await embedQuery(q, signal);
    const ranked = await retrieveVector(vector, index);
    if (!ranked.length && !index?.chunks.length) {
      return { ok: false, reason: "missing_index", message: "Índice de guías no disponible." };
    }
    if (!ranked.length) {
      return { ok: false, reason: "no_match", message: "No tengo ese dato verificado en las guías cargadas." };
    }
    return { ok: true, chunks: ranked, model: index?.embeddingModel ?? model };
  } catch {
    return { ok: false, reason: "error", message: "No pude consultar las guías ahora mismo." };
  }
}

export function formatRagContext(chunks: RankedChunk[], maxChars = 7_000) {
  let size = 0;
  const parts: string[] = [];
  for (const [i, c] of chunks.entries()) {
    const text = c.text.length > 1_200 ? `${c.text.slice(0, 1_200)}…` : c.text;
    const block = `[${i + 1}] (${c.sourceName}) ${c.title}\n${text}`;
    if (size + block.length > maxChars) break;
    parts.push(block);
    size += block.length;
  }
  return parts.join("\n\n");
}

export function ragSources(chunks: RankedChunk[]) {
  const seen = new Set<string>();
  return chunks
    .filter(c => {
      const key = `${c.sourceName}|${c.filePath}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
  .map(c => ({ id: c.id, title: c.title, sourceName: c.sourceName, sourceUrl: c.sourceUrl, filePath: c.filePath, score: c.score }));
}

export const RAG_NO_DATA =
  'No tengo ese dato verificado. Consulta a tu técnico agrícola o a IDIAF.';

export function ragAnswerSystem(recommendation: string, context: string) {
  return `Eres AgroVision, asistente para agricultores dominicanos. Responde en español dominicano sencillo, 2 a 4 frases cortas.
Usa las guías y las opciones evaluadas para la finca. No inventes cifras, dosis, precios ni fechas.
La recomendación de la pantalla es "${recommendation}". Si piden una alternativa, elige un cultivo distinto entre las opciones evaluadas y explica el motivo.
Si el contexto no responde la pregunta, di exactamente: "${RAG_NO_DATA}" y sugiere consultar al técnico.
Termina con una línea "Fuente: " listando los nombres de fuente usados (sin URLs largas).

CONTEXTO DE GUÍAS:
${context}

RECOMENDACIÓN YA CALCULADA (no modificar):
${recommendation}`;
}
