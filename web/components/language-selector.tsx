/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";

import { useEffect } from "react";
import { useLocale, setLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import { messages, type Locale } from "@/lib/i18n/messages";

export function LanguageSelector() {
  const locale = useLocale();
  const text = messages[locale].common;
  useEffect(() => {
    document.documentElement.lang = localeTag(locale);
    document.title = text.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", text.description);
  }, [locale, text]);
  return <select aria-label={text.language} className="language-selector" value={locale} onChange={event => setLocale(event.target.value as Locale)}>
    <option value="en">EN</option>
    <option value="es">ES</option>
  </select>;
}
