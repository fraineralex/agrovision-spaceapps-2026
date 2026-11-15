/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import { gateway } from "@ai-sdk/gateway";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { TEXT_MODEL, voiceSelection, adviceMetrics, localAdviceText, localVoiceAnswer } from "@/lib/voice-context";
import { guard, localTools, readJson } from "@/lib/voice-server";
import { askLocalVoiceModel } from "@/lib/local-voice-model";
import { formatRagContext, ragAnswerSystem, ragSources, retrieveRag, RAG_NO_DATA } from "@/lib/rag";

function compactFarmContext(selection: z.infer<typeof voiceSelection>) {
  const advice = adviceMetrics(selection);
  return `Finca: ${advice.farm.name}; área: ${advice.farm.area}; provincia: ${advice.province}; mes de siembra: ${advice.sowMonth}; cultivo anterior: ${advice.previousCrop}; recomendación en pantalla: ${advice.recommendedCrop ?? "sin dato"}; frase: ${advice.recommendation}`;
}
export const maxDuration = 30;
const schema = z.object({ selection: voiceSelection, messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1800) }).strict()).min(1).max(8) }).strict();
export async function POST(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  let input;
  try { input = schema.parse(await readJson(request, 20_000)); }
  catch { return Response.json({ error: "Invalid conversation" }, { status: 400 }); }
  const recommendation = localAdviceText(input.selection);
  const lastUser = [...input.messages].reverse().find(m => m.role === "user")?.content.slice(0, 500) ?? "";
  if (!process.env.AI_GATEWAY_API_KEY) {
    const answer = await askLocalVoiceModel(input.selection, input.messages, request.signal);
    if (answer) return new Response(answer, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "ai-local", "Cache-Control": "no-store" } });
    const question = input.messages.findLast(message => message.role === "user")?.content ?? "";
    return new Response(`Sin conexión con IA. ${localVoiceAnswer(input.selection, question)}`, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "local", "Cache-Control": "no-store" } });
  }
  const farm = compactFarmContext(input.selection);
  let ragSystem = `Eres AgroVision, asistente de texto para agricultores dominicanos. Responde en español sencillo, 2 a 4 frases. ${farm} No cambies la recomendación calculada. Sin cifras nuevas: usa herramientas locales si hace falta.
Si no hay dato verificado, di: "${RAG_NO_DATA}".`;
  let sourcesHeader = "[]";
  const rag = await retrieveRag(lastUser);
  if (rag.ok) {
    const ctx = formatRagContext(rag.chunks);
    ragSystem = `${ragAnswerSystem(recommendation, ctx)}\n\n${farm}`;
    sourcesHeader = JSON.stringify(ragSources(rag.chunks));
  } else if (rag.reason === "no_match") {
    ragSystem = `${ragSystem} Si la pregunta pide un dato que no está en las guías, usa la frase de sin dato verificado.`;
  }
  const headers = {
    "X-AgroVision-Mode": "ai",
    "X-AgroVision-Model": TEXT_MODEL,
    "X-AgroVision-Sources": encodeURIComponent(sourcesHeader),
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  } as const;
  const grounded = rag.ok;
  const result = streamText({
    model: gateway(TEXT_MODEL),
    system: ragSystem,
    messages: input.messages,
    ...(grounded ? {} : { tools: localTools(input.selection), stopWhen: stepCountIs(4) }),
    maxOutputTokens: 480,
    abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]),
  });
  if (grounded) {
    let text = await result.text;
    if (!text.trim()) {
      const hint = rag.chunks[0]?.text.replace(/\s+/g, " ").slice(0, 280);
      const names = ragSources(rag.chunks).map(s => s.sourceName).join("; ");
      text = `${hint ? `${hint}… ` : "No pude generar una respuesta a partir de las guías recuperadas."} Consulta las fuentes antes de tomar una decisión.\n\nFuente: ${names}.`;
    }
    return new Response(text, { headers });
  }
  return result.toTextStreamResponse({ headers });
}
