/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, resolveLocale } from "./locale";
import type { Locale } from "./messages";

const eventName = "agrovision:locale-change";
let currentLocale: Locale = DEFAULT_LOCALE;
let initialized = false;

function snapshot(): Locale {
  if (!initialized) {
    initialized = true;
    try { currentLocale = resolveLocale(localStorage.getItem(LOCALE_STORAGE_KEY)); } catch { /* Storage is optional. */ }
  }
  return currentLocale;
}
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  const storageListener = (event: StorageEvent) => {
    if (event.key === LOCALE_STORAGE_KEY || event.key === null) {
      currentLocale = resolveLocale(event.newValue);
      listener();
    }
  };
  window.addEventListener("storage", storageListener);
  return () => { window.removeEventListener(eventName, listener); window.removeEventListener("storage", storageListener); };
}
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_LOCALE);
}
export function setLocale(locale: Locale) {
  currentLocale = locale;
  initialized = true;
  try { localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* The current session still switches. */ }
  window.dispatchEvent(new Event(eventName));
}
