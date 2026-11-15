/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending. */
"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { Button } from "@/components/ui/button";

const key = "agrovision:theme";
const event = "agrovision:theme-change";
const snapshot = () => document.documentElement.dataset.theme === "sun";
const subscribe = (listener: () => void) => {
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
};

export function ThemeToggle() {
  const text = messages[useLocale()].common;
  const sun = useSyncExternalStore(subscribe, snapshot, () => false);
  return <Button type="button" variant="outline" className="theme-toggle" aria-label={text.sunlightMode} aria-pressed={sun} onClick={() => {
    const theme = sun ? "dark" : "sun";
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", sun ? "#0b120d" : "#f6f8f4");
    try { localStorage.setItem(key, theme); } catch { /* Storage is optional. */ }
    window.dispatchEvent(new Event(event));
  }}>
    {sun ? <Moon aria-hidden="true" data-icon="inline-start" /> : <Sun aria-hidden="true" data-icon="inline-start" />}
    <span>{text.sunlightMode}</span>
  </Button>;
}
