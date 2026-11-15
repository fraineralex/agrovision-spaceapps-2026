/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import { gateway } from "@ai-sdk/gateway";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { TEXT_MODEL, voiceSelection, adviceMetrics, localAdviceText, localVoiceAnswer, plainVoiceInstructions, plainVoiceText, plantingCalendar } from "@/lib/voice-context";
import { guard, localTools, readJson } from "@/lib/voice-server";
import { askLocalVoiceModel } from "@/lib/local-voice-model";
import { formatRagContext, ragAnswerSystem, ragSources, retrieveRag, RAG_NO_DATA } from "@/lib/rag";

function compactFarmContext(selection: z.infer<typeof voiceSelection>) {
  const advice = adviceMetrics(selection);
  const crops = advice.ranking.filter(crop => crop.overall !== null).map(crop => ({
    cultivo: crop.crop, cosecha: crop.harvestMonth, agua: crop.plainWords.water, plagas: crop.plainWords.pests,
  }));
  return `Provincia: ${advice.province}; mes de siembra: ${advice.sowMonth}; cultivo anterior: ${advice.previousCrop}; recomendación en pantalla: ${advice.recommendedCrop ?? "sin dato"}.
${selection.parcelId === "location" ? "Para esta ubicación consulta la herramienta de clima; no atribuyas la lluvia a una fuente sin verificarla." : "El clima de esta parcela demo es un reanálisis histórico regional de NASA POWER / MERRA-2 (2016–2025), no GPM IMERG ni pronóstico."} Riego seleccionado: ${selection.irrigation}.
Opciones evaluadas: ${JSON.stringify(crops)}`;
}
export const maxDuration = 30;
const schema = z.object({ selection: voiceSelection, messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1800) }).strict()).min(1).max(8), locale: z.enum(["en", "es"]).default("es") }).strict();
export async function POST(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  let input;
  try { input = schema.parse(await readJson(request, 20_000)); }
  catch { return Response.json({ error: "Invalid conversation" }, { status: 400 }); }
  const question = input.messages.findLast(message => message.role === "user")?.content ?? "";
  const calendar = plantingCalendar(question, input.locale);
  if (calendar) {
    return new Response(calendar.answer, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "data", "Cache-Control": "no-store" } });
  }
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    const answer = await askLocalVoiceModel(input.selection, input.messages, request.signal, input.locale);
    if (answer) return new Response(answer, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "ai-local", "Cache-Control": "no-store" } });
    return new Response(`${input.locale === "en" ? "AI is offline." : "Sin conexión con IA."} ${localVoiceAnswer(input.selection, question, input.locale)}`, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AgroVision-Mode": "local", "Cache-Control": "no-store" } });
  }
  const recommendation = localAdviceText(input.selection, input.locale);
  const farm = compactFarmContext(input.selection);
  const langRule = input.locale === "en"
    ? "Responde siempre en inglés claro y sencillo (2 a 4 frases), incluso si las guías están en español."
    : "Responde en español dominicano sencillo, en 2 a 4 frases.";
  let ragSystem = `Eres AgroVision, asistente de texto para agricultores dominicanos. ${langRule} ${plainVoiceInstructions} ${farm} No inventes fuentes, datos ni pronósticos. Para la lluvia de la parcela demo usa la fuente del contexto de finca, no la de guías generales. No atribuyas una fuente sin evidencia explícita. No infieras necesidades de agua de etiquetas relativas. Si la pregunta contradice la selección, no presentes sus resultados como recomendación para esa situación. Responde solo lo pertinente. Si piden una alternativa, elige otro cultivo de las opciones evaluadas. Usa el historial para entender las preguntas de seguimiento. Sin cifras nuevas: usa herramientas locales si hace falta.
Si no hay dato verificado, di: "${RAG_NO_DATA}".`;
  let sourcesHeader = "[]";
  const budget = AbortSignal.any([request.signal, AbortSignal.timeout(3_000)]);
  const rag = budget.aborted ? null : await Promise.race([
    retrieveRag(question, budget),
    new Promise<null>(resolve => budget.addEventListener("abort", () => resolve(null), { once: true })),
  ]);
  if (rag?.ok) {
    const ctx = formatRagContext(rag.chunks);
    ragSystem = `${ragAnswerSystem(recommendation, ctx)}\n\n${langRule} ${plainVoiceInstructions}\n\n${farm}`;
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
    experimental_transform: () => new TransformStream({
      transform(part, controller) {
        controller.enqueue(part.type === "text-delta" ? { ...part, text: plainVoiceText(part.text) } : part);
      },
    }),
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
