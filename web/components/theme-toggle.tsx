/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending. */
"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const key = "agrovision:theme";
const event = "agrovision:theme-change";
const snapshot = () => document.documentElement.dataset.theme === "sun";
const subscribe = (listener: () => void) => {
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
};

export function ThemeToggle() {
  const sun = useSyncExternalStore(subscribe, snapshot, () => false);
  return <Button type="button" variant="outline" className="theme-toggle" aria-label="Modo sol" aria-pressed={sun} onClick={() => {
    const theme = sun ? "dark" : "sun";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(key, theme); } catch { /* Storage is optional. */ }
    window.dispatchEvent(new Event(event));
  }}>
    {sun ? <Moon aria-hidden="true" data-icon="inline-start" /> : <Sun aria-hidden="true" data-icon="inline-start" />}
    <span>Modo sol</span>
  </Button>;
}
