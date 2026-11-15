/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
"use client";

import { useEffect, useRef, useState } from "react";

export function useReadAloud() {
  const current = useRef<SpeechSynthesisUtterance | null>(null);
  const [reading, setReading] = useState<{ text: string; status: string } | null>(null);

  function cancel() {
    if (!current.current) return;
    current.current = null;
    window.speechSynthesis?.cancel();
  }

  useEffect(() => cancel, []);

  function read(text: string) {
    cancel();
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setReading({ text, status: "Voz no disponible" });
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    current.current = utterance;
    utterance.lang = "es-DO";
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item => item.lang === "es-DO") ?? voices.find(item => item.lang.startsWith("es"));
    if (voice) utterance.voice = voice;
    function finish(status: string) {
      if (current.current !== utterance) return;
      current.current = null;
      setReading({ text, status });
    }
    utterance.onend = () => finish("Lectura terminada");
    utterance.onerror = event => finish(event.error === "interrupted" || event.error === "canceled" ? "Lectura detenida" : "Voz no disponible");
    setReading({ text, status: "Leyendo resumen…" });
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    cancel();
    setReading(value => value ? { ...value, status: "Lectura detenida" } : null);
  }

  return { reading, read, stop };
}
