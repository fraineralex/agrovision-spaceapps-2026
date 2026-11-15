/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { apiMessages } from "@/lib/i18n/api-messages";
import { resolveLocale } from "@/lib/i18n/locale";
import { gateway } from "@ai-sdk/gateway";
import { experimental_getRealtimeToolDefinitions } from "ai";
import { REALTIME_MODEL, voiceSelection } from "@/lib/voice-context";
import { guard, localTools } from "@/lib/voice-server";
export const maxDuration = 20;
export function HEAD() {
  return new Response(null, {
    status: process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN ? 204 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  // Query month is encoded as text by URLSearchParams; all other inputs remain strict enums.
  const params = new URL(request.url).searchParams;
  const text = apiMessages[resolveLocale(params.get("locale"))];
  let rawLocation;
  try { rawLocation = params.get("location") ? JSON.parse(params.get("location")!) : undefined; } catch { return Response.json({error:text.invalidLocation},{status:400}); }
  params.delete("locale");
  const selection = voiceSelection.safeParse({ ...Object.fromEntries(params), month: Number(params.get("month")), ...(params.get("location") ? { location: rawLocation } : {}) });
  if (!selection.success) return Response.json({ error: text.invalidSelection }, { status: 400 });
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) return Response.json({ mode: "local", error: text.voiceLocal }, { status: 503 });
  try {
    // Ignore browser-provided session configuration. Never return the server credential.
    const tools = await experimental_getRealtimeToolDefinitions({ tools: localTools(selection.data) });
    const token = await gateway.experimental_realtime.getToken({ model: REALTIME_MODEL, expiresAfterSeconds: 60 });
    return Response.json({ ...token, tools }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: text.voiceUnavailable }, { status: 503 }); }
}
