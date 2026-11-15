/* AI: OpenAI Codex, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
export const apiMessages = {
  en: { outside: "Location outside the Dominican Republic", forecast: "Forecast unavailable now.", climate: "Climate data are unavailable for this location. Data from another region were not substituted.", invalidLocation: "Invalid location", invalidSelection: "Invalid selection", voiceLocal: "Voice unavailable; local text is ready", voiceUnavailable: "Voice unavailable; try text" },
  es: { outside: "Ubicación fuera de RD", forecast: "Pronóstico no disponible ahora.", climate: "Clima no disponible para este punto. No se sustituyeron datos de otra región.", invalidLocation: "Ubicación inválida", invalidSelection: "Selección inválida", voiceLocal: "Voz no disponible; el texto local está listo", voiceUnavailable: "Voz no disponible; intenta escribir" },
} as const;
