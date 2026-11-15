/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import { gateway } from "@ai-sdk/gateway";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { TEXT_MODEL, voiceSelection, adviceMetrics, localAdviceText, localVoiceAnswer, plantingCalendar } from "@/lib/voice-context";
import { guard, localTools, readJson } from "@/lib/voice-server";
import { askLocalVoiceModel } from "@/lib/local-voice-model";
import { formatRagContext, ragAnswerSystem, ragSources, retrieveRag, RAG_NO_DATA } from "@/lib/rag";

function compactFarmContext(selection: z.infer<typeof voiceSelection>) {
  const advice = adviceMetrics(selection);
  const crops = advice.ranking.filter(crop => crop.overall !== null).map(crop => ({
    cultivo: crop.crop, cosecha: crop.harvestMonth, agua: crop.plainWords.water, plagas: crop.plainWords.pests,
  }));
  return `Provincia: ${advice.province}; mes de siembra: ${advice.sowMonth}; cultivo anterior: ${advice.previousCrop}; recomendación en pantalla: ${advice.recommendedCrop ?? "sin dato"}.
Opciones evaluadas: ${JSON.stringify(crops)}`;
}
export const maxDuration = 30;
const schema = z.object({ selection: voiceSelection, messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1800) }).strict()).min(1).max(8) }).strict();
export async function POST(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  let input;
  try { input = schema.parse(await readJson(request, 20_000)); }
  catch { return Response.json({ error: "Invalid conversation" }, { status: 400 }); }
  const question = input.messages.findLast(message => message.role === "user")?.content ?? "";
  const calendar = plantingCalendar(question);
  if (calendar) {
    return new Response(calendar.answer, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "data", "Cache-Control": "no-store" } });
  }
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    const answer = await askLocalVoiceModel(input.selection, input.messages, request.signal);
    if (answer) return new Response(answer, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "ai-local", "Cache-Control": "no-store" } });
    return new Response(`Sin conexión con IA. ${localVoiceAnswer(input.selection, question)}`, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "local", "Cache-Control": "no-store" } });
  }
  const recommendation = localAdviceText(input.selection);
  const farm = compactFarmContext(input.selection);
  let ragSystem = `Eres AgroVision, asistente de texto para agricultores dominicanos. Responde a la última pregunta en español sencillo, en 2 a 4 frases. ${farm} Si piden una alternativa, elige otro cultivo de las opciones evaluadas. Usa el historial para entender las preguntas de seguimiento. Sin cifras nuevas: usa herramientas locales si hace falta.
Si no hay dato verificado, di: "${RAG_NO_DATA}".`;
  let sourcesHeader = "[]";
  const budget = AbortSignal.any([request.signal, AbortSignal.timeout(3_000)]);
  const rag = budget.aborted ? null : await Promise.race([
    retrieveRag(question, budget),
    new Promise<null>(resolve => budget.addEventListener("abort", () => resolve(null), { once: true })),
  ]);
  if (rag?.ok) {
    const ctx = formatRagContext(rag.chunks);
    ragSystem = `${ragAnswerSystem(recommendation, ctx)}\n\n${farm}`;
    sourcesHeader = JSON.stringify(ragSources(rag.chunks));
  } else if (rag?.reason === "no_match") {
    ragSystem = `${ragSystem} Si la pregunta pide un dato que no está en las guías, usa la frase de sin dato verificado.`;
  }
  const headers = {
    "X-AgroVision-Mode": "ai",
    "X-AgroVision-Model": TEXT_MODEL,
    "X-AgroVision-Sources": encodeURIComponent(sourcesHeader),
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  } as const;
  const grounded = rag?.ok === true;
  const result = streamText({
    model: gateway(TEXT_MODEL),
    system: ragSystem,
    messages: input.messages,
    ...(grounded ? {} : { tools: localTools(input.selection), stopWhen: stepCountIs(4) }),
    maxOutputTokens: 1024,
    maxRetries: 0,
    abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]),
  });
  if (grounded) {
    let text = "";
    try {
      text = await result.text;
    } catch {
      // A transient text-provider error must not turn a grounded question into HTTP 500.
    }
    if (!text.trim()) {
      text = RAG_NO_DATA;
    }
    return new Response(text, { headers });
  }
  return result.toTextStreamResponse({ headers });
}
