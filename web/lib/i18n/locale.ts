/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import type { Locale } from "./messages";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "agrovision-locale";
export const LOCALE_STORAGE_KEY = "agrovision:locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}
export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
export function localeTag(locale: Locale): "en-US" | "es-DO" {
  return locale === "es" ? "es-DO" : "en-US";
}
/** Respect quality weights, regional tags, and exclusions in Accept-Language. */
export function browserLocale(header: string | null): Locale {
  const choices = (header ?? "").split(",").map((part, index) => {
    const [tag, ...parameters] = part.trim().split(";");
    const quality = parameters.find(p => /^\s*q\s*=/i.test(p));
    const q = quality ? Number(quality.split("=")[1]) : 1;
    return { lang: tag.toLowerCase().split("-")[0], q, index };
  }).filter(item => Number.isFinite(item.q) && item.q > 0 && item.q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const item of choices) if (isLocale(item.lang)) return item.lang;
  return DEFAULT_LOCALE;
}
export function localizedPath(pathname: string, locale: Locale): string {
  const rest = pathname.replace(/^\/(?:en|es)(?=\/|$)/, "");
  return `/${locale}${rest || ""}`;
}
