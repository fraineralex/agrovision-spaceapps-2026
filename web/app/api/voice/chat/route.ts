/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { gateway } from "@ai-sdk/gateway";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { TEXT_MODEL, voiceSelection, voiceInstructions } from "@/lib/voice-context";
import { fallbackExplanation } from "@/lib/explanation";
import { guard, localTools, readJson } from "@/lib/voice-server";
export const maxDuration = 30;
const schema = z.object({ selection: voiceSelection, messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1800) }).strict()).min(1).max(8) }).strict();
export async function POST(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  let input;
  try { input = schema.parse(await readJson(request, 20_000)); }
  catch { return Response.json({ error: "Invalid conversation" }, { status: 400 }); }
  if (!process.env.AI_GATEWAY_API_KEY) return new Response(input.selection.parcelId === "location" ? "No tengo conexión con IA. Las rotaciones son ejemplos FAO-56 de 1998, sin validación local. No dispongo de clima local verificado en este resumen; no predigo plagas ni rendimiento." : fallbackExplanation(input.selection), { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "local", "Cache-Control": "no-store" } });
  const result = streamText({ model: gateway(TEXT_MODEL), system: voiceInstructions(input.selection), messages: input.messages,
    tools: localTools(input.selection), stopWhen: stepCountIs(3), maxOutputTokens: 320,
    abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]),
  });
  return result.toTextStreamResponse({ headers: { "X-AgroVision-Mode": "ai", "Cache-Control": "no-store" } });
}
