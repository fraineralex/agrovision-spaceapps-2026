/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — 7-day rain forecast (Open-Meteo) with NASA POWER recent-days fallback. Frainer review pending. */
import { apiMessages } from "@/lib/i18n/api-messages";
import { resolveLocale } from "@/lib/i18n/locale";
import { locationSchema } from "@/lib/geography";
import { guard } from "@/lib/voice-server";
import { parseOpenMeteo, parsePower, type RainForecast } from "@/lib/rain";
export async function GET(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  const params = new URL(request.url).searchParams;
  const text = apiMessages[resolveLocale(params.get("locale"))];
  const loc = locationSchema.safeParse({ longitude: Number(params.get("longitude")), latitude: Number(params.get("latitude")) });
  if (!loc.success) return Response.json({ error: text.outside }, { status: 400 });
  const { latitude, longitude } = loc.data;
  const om = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max&timezone=America%2FSanto_Domingo&forecast_days=7&models=gfs_global`;
  try {
    const r = await fetch(om, { signal: AbortSignal.timeout(8000) });
    if (r.ok) { const days = parseOpenMeteo(await r.json()); if (days.length) return Response.json({ source: "open-meteo", kind: "forecast", model: "gfs_global", url: om, fetchedAt: new Date().toISOString(), days } satisfies RainForecast, { headers: { "Cache-Control": "public, max-age=3600" } }); }
  } catch { /* fall back to NASA POWER */ }
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "");
  const end = new Date(Date.now() - 2 * 864e5), start = new Date(end.getTime() - 6 * 864e5);
  const power = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M_MAX&community=AG&longitude=${longitude.toFixed(4)}&latitude=${latitude.toFixed(4)}&start=${fmt(start)}&end=${fmt(end)}&format=JSON`;
  try {
    const r = await fetch(power, { signal: AbortSignal.timeout(12000) });
    if (r.ok) { const days = parsePower(await r.json()); if (days.length) return Response.json({ source: "nasa-power", kind: "recent", url: power, fetchedAt: new Date().toISOString(), days } satisfies RainForecast, { headers: { "Cache-Control": "public, max-age=21600" } }); }
  } catch { /* no data */ }
  return Response.json({ error: text.forecast }, { status: 503 });
}
