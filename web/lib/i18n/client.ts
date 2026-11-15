/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";
import { usePathname } from "next/navigation";
import { isLocale, LOCALE_COOKIE, localizedPath, resolveLocale } from "./locale";
import type { Locale } from "./messages";

export function useLocale(): Locale {
  const pathname = usePathname();
  return resolveLocale(pathname.split("/")[1]);
}
export function useChangeLocale() {
  const pathname = usePathname();
  return (locale: Locale) => {
    if (!isLocale(locale)) return;
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const suffix = `${window.location.search}${window.location.hash}`;
    // Native History API is integrated with Next's pathname hooks and keeps in-progress forms mounted.
    window.history.pushState(null, "", `${localizedPath(pathname, locale)}${suffix}`);
  };
}
