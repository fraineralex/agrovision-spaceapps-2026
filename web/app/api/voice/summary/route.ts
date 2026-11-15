/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import { z } from "zod";
import { guard, readJson } from "@/lib/voice-server";
import { renderSummaryAudio } from "@/lib/summary-audio";

export const maxDuration = 25;

const input = z.object({ text: z.string().trim().min(1).max(1400) }).strict();

export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;

  const summary = input.safeParse(await readJson(request, 4096).catch(() => null));
  if (!summary.success) return Response.json({ error: "Invalid summary" }, { status: 400 });
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) return new Response(null, { status: 503 });

  try {
    const audio = await renderSummaryAudio(summary.data.text, request.signal);
    return new Response(audio, {
      headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
