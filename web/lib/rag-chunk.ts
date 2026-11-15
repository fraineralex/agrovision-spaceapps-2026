/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import type { CorpusDoc } from "./rag-corpus";

export type RagChunkMeta = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl?: string;
  filePath: string;
  text: string;
};

export const CHUNK_TARGET_CHARS = 2_400;
export const CHUNK_MIN_CHARS = 1_600;
export const CHUNK_MAX_CHARS = 3_200;
export const CHUNK_OVERLAP_CHARS = 400;

function normalize(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\t/g, " ").replace(/ +/g, " ").trim();
}

function splitBlocks(text: string) {
  const blocks = normalize(text).split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  return blocks.length ? blocks : [normalize(text)];
}

export function chunkDocument(doc: CorpusDoc, body: string, chunkIdPrefix = doc.id): RagChunkMeta[] {
  const blocks = splitBlocks(body);
  const chunks: RagChunkMeta[] = [];
  let buffer = "";
  let index = 0;
  const flush = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    chunks.push({
      id: `${chunkIdPrefix}-${String(index++).padStart(3, "0")}`,
      title: doc.title,
      sourceName: doc.sourceName,
      sourceUrl: doc.sourceUrl,
      filePath: doc.filePath,
      text: trimmed,
    });
  };
  for (const block of blocks) {
    const next = buffer ? `${buffer}\n\n${block}` : block;
    if (next.length <= CHUNK_MAX_CHARS) {
      buffer = next;
      if (buffer.length >= CHUNK_TARGET_CHARS) {
        flush(buffer);
        buffer = buffer.slice(-CHUNK_OVERLAP_CHARS);
      }
      continue;
    }
    if (buffer) flush(buffer);
    buffer = "";
    if (block.length <= CHUNK_MAX_CHARS) {
      buffer = block;
      continue;
    }
    let start = 0;
    while (start < block.length) {
      const end = Math.min(block.length, start + CHUNK_TARGET_CHARS);
      flush(block.slice(start, end));
      if (end >= block.length) break;
      start = Math.max(start + CHUNK_TARGET_CHARS - CHUNK_OVERLAP_CHARS, end - CHUNK_OVERLAP_CHARS);
    }
  }
  if (buffer.length >= CHUNK_MIN_CHARS || !chunks.length) flush(buffer);
  else if (buffer) {
    const last = chunks[chunks.length - 1];
    if (last) last.text = `${last.text}\n\n${buffer}`.trim();
    else flush(buffer);
  }
  return chunks;
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

export type RankedChunk = RagChunkMeta & { score: number };

export function rankChunks(
  query: number[],
  entries: { meta: RagChunkMeta; vector: number[] }[],
  k: number,
  minScore: number,
): RankedChunk[] {
  return entries
    .map(entry => ({ ...entry.meta, score: cosineSimilarity(query, entry.vector) }))
    .filter(row => row.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}