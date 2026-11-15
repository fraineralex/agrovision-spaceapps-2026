/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import { messages, type Locale } from "@/lib/i18n/messages";

type Phase = "loading" | "playing" | "paused" | "finished" | "stopped" | "unavailable";
type Reading = { text: string; locale: Locale; phase: Phase; generated: boolean };
type Playback = { pause: () => void; resume: () => void; dispose: () => void };


export function useReadAloud() {
  const locale = useLocale();
  const current = useRef<{ controller: AbortController; playback?: Playback } | null>(null);
  const cached = useRef<{ text: string; locale: Locale; audio: Blob } | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);

  function cancel() {
    const attempt = current.current;
    current.current = null;
    attempt?.controller.abort();
    attempt?.playback?.dispose();
  }

  useEffect(() => cancel, [locale]);

  async function read(text: string) {
    cancel();
    const controller = new AbortController();
    const attempt: NonNullable<typeof current.current> = { controller };
    current.current = attempt;

    function finish(phase: Phase, generated = false) {
      if (current.current !== attempt) return;
      cancel();
      setReading({ text, locale, phase, generated });
    }

    const saved = cached.current?.text === text && cached.current.locale === locale ? cached.current.audio : undefined;
    if (saved || navigator.onLine) {
      setReading({ text, locale, phase: "loading", generated: false });
      try {
        let audio = saved;
        if (!audio) {
          const response = await fetch("/api/voice/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, locale }),
            signal: controller.signal,
          });
          if (!response.ok || response.headers.get("Content-Type") !== "audio/wav") throw new Error("Audio unavailable");
          audio = await response.blob();
        }
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(audio);
        const player = new Audio(url);
        attempt.playback = {
          pause: () => player.pause(),
          resume: () => { void player.play().catch(() => finish("unavailable")); },
          dispose: () => {
            player.onended = player.onerror = null;
            player.pause();
            URL.revokeObjectURL(url);
          },
        };
        player.onended = () => finish("finished", true);
        await player.play();
        if (controller.signal.aborted) return;
        player.onerror = () => {
          if (cached.current?.audio === audio) cached.current = null;
          finish("unavailable");
        };
        cached.current = { text, locale, audio };
        setReading({ text, locale, phase: "playing", generated: true });
        return;
      } catch {
        if (controller.signal.aborted) return;
        attempt.playback?.dispose();
        attempt.playback = undefined;
      }
    }

    const synthesis = window.speechSynthesis;
    if (!synthesis || !window.SpeechSynthesisUtterance) {
      finish("unavailable");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith(locale));
    const natural = (voice: SpeechSynthesisVoice) => /natural|neural|premium|enhanced|google|online/i.test(voice.name);
    const regional = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase() === localeTag(locale).toLowerCase();
    utterance.voice = voices.find(voice => natural(voice) && regional(voice))
      ?? voices.find(natural) ?? voices.find(regional) ?? voices[0] ?? null;
    utterance.lang = utterance.voice?.lang ?? localeTag(locale);
    utterance.rate = 0.95;
    utterance.onend = () => finish("finished");
    utterance.onerror = event => finish(event.error === "interrupted" || event.error === "canceled" ? "stopped" : "unavailable");
    attempt.playback = {
      pause: () => synthesis.pause(),
      resume: () => synthesis.resume(),
      dispose: () => {
        utterance.onend = utterance.onerror = null;
        synthesis.cancel();
      },
    };
    if (synthesis.paused) synthesis.resume();
    setReading({ text, locale, phase: "playing", generated: false });
    synthesis.speak(utterance);
  }

  function stop() {
    cancel();
    setReading(value => value ? { ...value, phase: "stopped" } : null);
  }

  function togglePause() {
    if (!reading || !current.current?.playback) return;
    if (reading.phase === "playing") {
      current.current.playback.pause();
      setReading({ ...reading, phase: "paused" });
    } else if (reading.phase === "paused") {
      current.current.playback.resume();
      setReading({ ...reading, phase: "playing" });
    }
  }

  return { reading: reading?.locale === locale ? { ...reading, status: messages[locale].reading[reading.phase] } : null, read, stop, togglePause };
}
