/* AI: Claude (Anthropic), 2026-11-14 — share the farm card by WhatsApp (image via Web Share, text fallback). Frainer review pending. See AI_USAGE.md. */
"use client";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/client";
import { shareMessages } from "@/lib/i18n/share-messages";
import type { Locale } from "@/lib/i18n/messages";

export type ShareSummary = { farm: string; place: string; area: string; advice: string; rain?: string; profit?: string; oversupply?: string };

export function shareText(s: ShareSummary, locale: Locale = "es") {
  const text = shareMessages[locale];
  return [`🌱 AgroVision · ${s.farm}`, `📍 ${s.place}${s.area ? ` · ${s.area}` : ""}`, `✅ ${s.advice}`, s.oversupply && `⚠️ ${s.oversupply}`, s.rain && `🌧️ ${s.rain}`, s.profit && `💰 ${s.profit}`, text.disclaimer, `https://agrovision-spaceapps-2026.vercel.app/${locale}`].filter(Boolean).join("\n");
}
export const whatsappUrl = (s: ShareSummary, locale: Locale = "es") => `https://wa.me/?text=${encodeURIComponent(shareText(s, locale))}`;

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" "); let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = t; }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}
export async function renderCard(s: ShareSummary, locale: Locale = "es"): Promise<Blob | null> {
  const text = shareMessages[locale];
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
  const ctx = c.getContext("2d"); if (!ctx) return null;
  ctx.fillStyle = "#f4f5e9"; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#185b3c"; ctx.fillRect(0, 0, c.width, 180);
  ctx.fillStyle = "#fff"; ctx.font = "bold 64px sans-serif"; ctx.fillText("🌱 AgroVision", 60, 115);
  let y = 270; ctx.fillStyle = "#132f26";
  ctx.font = "bold 58px sans-serif"; y = wrap(ctx, s.farm, 60, y, 960, 68);
  ctx.font = "38px sans-serif"; y = wrap(ctx, `📍 ${s.place}${s.area ? ` · ${s.area}` : ""}`, 60, y + 10, 960, 50);
  const block = (label: string, text: string | undefined, color: string) => {
    if (!text) return; y += 30; ctx.fillStyle = color; ctx.font = "bold 36px sans-serif"; ctx.fillText(label, 60, y); y += 50;
    ctx.fillStyle = "#132f26"; ctx.font = "42px sans-serif"; y = wrap(ctx, text, 60, y, 960, 54);
  };
  block(text.recommendation, s.advice, "#185b3c");
  block(text.market, s.oversupply, "#9a6700");
  block(text.rain, s.rain, "#0b57a4");
  block(text.profit, s.profit, "#185b3c");
  ctx.fillStyle = "#4b5563"; ctx.font = "28px sans-serif";
  wrap(ctx, text.footer.replace("{locale}", locale), 60, 1270, 960, 36);
  return await new Promise(r => c.toBlob(b => r(b), "image/png"));
}

export function ShareButton({ summary }: { summary: ShareSummary }) {
  const locale = useLocale();
  const text = shareMessages[locale];
  const [status, setStatus] = useState<"shared" | "opening" | "">("");
  const share = async () => {
    const shareMessage = shareText(summary, locale);
    try {
      const blob = await renderCard(summary, locale);
      const file = blob ? new File([blob], "agrovision-finca.png", { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: shareMessage, title: "AgroVision" }); setStatus("shared"); return; }
      if (navigator.share) { await navigator.share({ text: shareMessage, title: "AgroVision" }); setStatus("shared"); return; }
    } catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
    window.open(whatsappUrl(summary, locale), "_blank", "noopener");
    setStatus("opening");
  };
  return <div className="share">
    <button type="button" className="share-button" onClick={share}><Share2 aria-hidden="true" size={22} /> {text.share}</button>
    <a className="ob-link" href={whatsappUrl(summary, locale)} target="_blank" rel="noreferrer" data-testid="wa-link">{text.textOnly}</a>
    {status && <span role="status">{text[status]}</span>}
  </div>;
}
