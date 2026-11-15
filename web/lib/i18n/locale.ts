/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import type { Locale } from "./messages";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "agrovision:locale";

/** Ignore stale or untrusted persisted values and use the judges' default. */
export function resolveLocale(value: unknown): Locale {
  return value === "es" ? "es" : DEFAULT_LOCALE;
}

/** BCP 47 tags used for formatting and browser speech recognition. */
export function localeTag(locale: Locale): "en-US" | "es-DO" {
  return locale === "es" ? "es-DO" : "en-US";
}
