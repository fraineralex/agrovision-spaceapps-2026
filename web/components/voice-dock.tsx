/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending. */
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { Mic } from "lucide-react";
import type { VoiceSelection } from "@/lib/voice-context";

function AssistantLoading() {
  const text = messages[useLocale()].voice;
  return <p className="voice-loading" role="status">{text.preparingAssistant}</p>;
}
const Assistant = dynamic(() => import("@/components/voice-assistant").then(module => module.VoiceAssistant), {
  ssr: false,
  loading: AssistantLoading,
});

export function VoiceDock({ selection, openWrite }: { selection: VoiceSelection; openWrite: boolean }) {
  const text = messages[useLocale()].voice;
  const dock = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  const [visited, setVisited] = useState(openWrite);
  if (openWrite && !visited) setVisited(true);
  useEffect(() => {
    if (nearby || !dock.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNearby(true);
        observer.disconnect();
      }
    }, { rootMargin: "96px" });
    observer.observe(dock.current);
    return () => observer.disconnect();
  }, [nearby]);

  return <div ref={dock} id="voice-dock" className="voice-dock">
    {openWrite || nearby || visited
      ? <Assistant selection={selection} defaultOpenWrite={openWrite} />
      : <div className="voice-loading"><Mic size={20} aria-hidden="true" /> {text.voiceAssistant}</div>}
  </div>;
}
