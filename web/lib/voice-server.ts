/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { loadClimate } from "@/lib/location-climate";
import { tool } from "ai";
import { parcelMetrics, rotationMetrics, toolArguments, type VoiceSelection } from "@/lib/voice-context";
import { formatRagContext, ragSources, retrieveRag } from "@/lib/rag";
import { z } from "zod";
// Best-effort per-instance abuse limit; Gateway key budgets remain the global cap.
const requests = new Map<string, { count: number; until: number }>();
export function guard(request: Request): Response | null {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next dev can build request.url with localhost even when Chrome opened 127.0.0.1.
  const host = request.headers.get("host");
  if (origin && origin !== url.origin && (!host || origin !== `${url.protocol}//${host}`)) {
    return Response.json({ error: "Same-origin requests only" }, { status: 403 });
  }
  const now = Date.now();
  for (const [key, value] of requests) if (value.until < now) requests.delete(key);
  const id = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const entry = requests.get(id) ?? { count: 0, until: now + 60_000 };
  requests.set(id, entry);
  if (++entry.count > 30) return Response.json({ error: "Please wait a minute" }, { status: 429 });
  return null;
}
export async function readJson(request: Request, limit = 8192): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing input");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length; if (size > limit) { await reader.cancel(); throw new Error("Input too large"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function selectedMetrics(input:VoiceSelection) {
  const metrics=parcelMetrics(input);
  if (input.parcelId === "location" && input.location) {
    try {const data=await loadClimate(input.location);return {...metrics,climate:data.monthly.find(m=>m.month===input.month)??null,climateSource:data.source};}
    catch {return {...metrics,climate:null,missing:"Clima no disponible en este punto"};}
  }
  return metrics;
}
const searchGuideSchema = z.object({ query: z.string().min(2).max(500) }).strict();

export async function searchGuides(query: string) {
  const result = await retrieveRag(query);
  if (!result.ok) {
    return { chunks: [], sources: [], message: result.message, grounded: false };
  }
  return {
    context: formatRagContext(result.chunks),
    sources: ragSources(result.chunks),
    grounded: true,
  };
}

export function localTools(input: VoiceSelection) {
  return {
    get_parcel_metrics: tool({ description:"Lee métricas de la zona seleccionada, fuentes y límites.",inputSchema:toolArguments,execute:async()=>selectedMetrics(input) }),
    compare_rotations: tool({ description:"Compara rotaciones ilustrativas locales con fuentes y evidencia faltante.",inputSchema:toolArguments,execute:async()=>rotationMetrics(input) }),
    search_guides: tool({
      description: "Busca en guías verificadas del equipo (fuentes, costos 2019, siembra, NASA POWER/GIEWS, mercado). Solo lectura.",
      inputSchema: searchGuideSchema,
      execute: async ({ query }) => searchGuides(query),
    }),
  };
}
