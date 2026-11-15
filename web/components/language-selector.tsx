/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";
import { useEffect } from "react";
import { localeTag } from "@/lib/i18n/locale";
import { useChangeLocale, useLocale } from "@/lib/i18n/client";
import { isLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";

export function LanguageSelector() {
  const locale = useLocale();
  const changeLocale = useChangeLocale();
  useEffect(() => {
    document.documentElement.lang = localeTag(locale);
    document.title = messages[locale].common.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", messages[locale].common.description);
  }, [locale]);
  return <select aria-label={messages[locale].common.language} className="language-selector" value={locale} onChange={event => { if (isLocale(event.target.value)) changeLocale(event.target.value); }}>
    <option value="en">EN</option>
    <option value="es">ES</option>
  </select>;
}
