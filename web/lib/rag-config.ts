/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
export const TEXT_MODEL = "anthropic/claude-haiku-5.5";
export const EMBEDDING_MODEL_PRIMARY = "google/gemini-embedding-2" as const;
export const EMBEDDING_MODEL_FALLBACK = "google/gemini-embedding-001" as const;
export const RAG_TOP_K = 5;
export const RAG_MIN_SCORE = 0.38;
export const RAG_MAX_QUESTION_CHARS = 500;
export const RAG_INDEX_PATH = "data/rag-index.json";