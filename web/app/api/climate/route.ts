/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { locationSchema } from "@/lib/geography";
import { loadClimate } from "@/lib/location-climate";
import { guard } from "@/lib/voice-server";
export async function GET(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  const params = new URL(request.url).searchParams;
  const result = locationSchema.safeParse({ longitude:Number(params.get("longitude")),latitude:Number(params.get("latitude")) });
  if (!result.success) return Response.json({ error:"Ubicación fuera de RD" },{status:400});
  try { return Response.json(await loadClimate(result.data), { headers:{"Cache-Control":"public, max-age=86400"} }); }
  catch { return Response.json({ error:"Clima no disponible para este punto. No se sustituyeron datos de otra región." },{status:503}); }
}
