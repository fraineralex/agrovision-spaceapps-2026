/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending. */
"use client";

import dynamic from "next/dynamic";
import { Mic } from "lucide-react";
import type { VoiceSelection } from "@/lib/voice-context";

const Assistant = dynamic(() => import("@/components/voice-assistant").then(module => module.VoiceAssistant), {
  ssr: false,
  loading: () => <div className="voice-loading"><Mic size={20} aria-hidden="true" /> Preparando el asistente…</div>,
});

export function VoiceDock({ selection, openWrite }: { selection: VoiceSelection; openWrite: boolean }) {
  return (
    <div id="voice-dock" className="voice-dock">
      <Assistant selection={selection} defaultOpenWrite={openWrite} />
    </div>
  );
}
