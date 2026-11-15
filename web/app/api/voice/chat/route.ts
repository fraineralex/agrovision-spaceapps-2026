/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import { gateway } from "@ai-sdk/gateway";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";
import { TEXT_MODEL, voiceSelection, voiceInstructions, localVoiceAnswer, plainVoiceText, plantingCalendar } from "@/lib/voice-context";
import { guard, localTools, readJson } from "@/lib/voice-server";
import { askLocalVoiceModel } from "@/lib/local-voice-model";
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
  const result = streamText({ model: gateway(TEXT_MODEL), system: voiceInstructions(input.selection, "question"), messages: input.messages,
    tools: localTools(input.selection), stopWhen: stepCountIs(3), maxOutputTokens: 320,
    experimental_transform: () => new TransformStream({
      transform(part, controller) {
        controller.enqueue(part.type === "text-delta" ? { ...part, text: plainVoiceText(part.text) } : part);
      },
    }),
    abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]),
  });
  return result.toTextStreamResponse({ headers: { "X-AgroVision-Mode": "ai", "Cache-Control": "no-store" } });
}
