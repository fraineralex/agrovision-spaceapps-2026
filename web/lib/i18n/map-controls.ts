/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import type { Locale } from "./messages";
import { mapMessages } from "./map-messages";

export function mapLibreStrings(locale: Locale) {
  const text = mapMessages[locale];
  return { "Map.Title": text.mapTitle, "NavigationControl.ZoomIn": text.zoomIn, "NavigationControl.ZoomOut": text.zoomOut, "NavigationControl.ResetBearing": text.north, "AttributionControl.MapFeedback": text.feedback, "AttributionControl.ToggleAttribution": text.attributionControl };
}

/** MapLibre creates its controls outside React; keep their accessible labels in sync. */
export function localizeMapControls(container: HTMLElement, locale: Locale) {
  const text = mapMessages[locale];
  const labels: Record<string, string> = {
    ".maplibregl-canvas": text.mapTitle,
    ".maplibregl-ctrl-zoom-in": text.zoomIn,
    ".maplibregl-ctrl-zoom-out": text.zoomOut,
    ".maplibregl-ctrl-compass": text.north,
    ".maplibregl-ctrl-attrib-button": text.attributionControl,
  };
  for (const [selector, label] of Object.entries(labels)) {
    container.querySelectorAll<HTMLElement>(selector).forEach(element => {
      element.setAttribute("aria-label", label);
      if (selector !== ".maplibregl-canvas") element.title = label;
    });
  }
}
