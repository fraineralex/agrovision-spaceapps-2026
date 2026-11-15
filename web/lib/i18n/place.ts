/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import { homeDetailsMessages } from "./home-details-messages";
import type { Locale } from "./messages";
export function placeKind(kind: string, locale: Locale): string {
  const values = homeDetailsMessages[locale].kinds;
  return values[kind as keyof typeof values] ?? kind;
}
