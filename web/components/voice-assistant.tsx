/* AI: Codex/OpenAI with Impeccable, 2026-11-15. Application composition and shared UI; Frainer review pending. See AI_USAGE.md. */
/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Codex (OpenAI) and Claude (Anthropic), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { AudioLines, ChevronDown, Keyboard, MessageCircle, Mic, Send, Square, Volume2 } from "lucide-react";
import { experimental_useRealtime as useRealtime } from "@ai-sdk/react";
import { gateway } from "@ai-sdk/gateway";
import { useLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import { messages as i18nMessages } from "@/lib/i18n/messages";
import { useReadAloud } from "@/lib/use-read-aloud";
import { REALTIME_MODEL, REALTIME_VOICE, voiceInstructions, localAdviceText, localVoiceAnswer, plainVoiceText, type VoiceSelection } from "@/lib/voice-context";
import session from "./voice-session.module.css";
const model = gateway.experimental_realtime(REALTIME_MODEL);
type Dictation = {
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type DictationWindow = Window & { SpeechRecognition?: new () => Dictation; webkitSpeechRecognition?: new () => Dictation };

type RagSource = { id: string; title: string; sourceName: string; sourceUrl?: string; filePath: string; score?: number };
type Message = { role: "user" | "assistant"; content: string; sources?: RagSource[] };
type VoiceTextKey = keyof typeof i18nMessages.en.voice;
export function VoiceAssistant({ selection, defaultOpenWrite = false }: { selection: VoiceSelection; defaultOpenWrite?: boolean }) {
  const locale = useLocale();
  const text = i18nMessages[locale].voice;
  const [notice, setNotice] = useState<VoiceTextKey | "">("");
  const [voiceError, setVoiceError] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [dictatedAnswer, setDictatedAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sessionSelection, setSessionSelection] = useState<VoiceSelection>();
  const sessionContext = sessionSelection ?? selection;
  const [pendingConnection, setPendingConnection] = useState<number | null>(null);
  const connectedAttempt = useRef<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const media = useRef<MediaStream | null>(null);
  const dictation = useRef<Dictation | null>(null);
  const [dictating, setDictating] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const summary = useReadAloud();
  const summaryState = summary.reading?.phase === "paused" ? "paused" : summary.reading && ["loading", "playing"].includes(summary.reading.phase) ? "playing" : "idle";
  const toggleSummaryPause = summary.togglePause;
  const orb = useRef<HTMLButtonElement>(null);
  const voicePanel = useRef<HTMLElement>(null);
  const generation = useRef(0);
  const starting = useRef(false);
  const captureStarted = useRef(false);
  const [requesting, setRequesting] = useState(false);
  const selectionQuery = useMemo(() => new URLSearchParams(Object.entries(sessionContext).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : String(value)])).toString(), [sessionContext]);
  const config = useMemo(() => ({ instructions: voiceInstructions(sessionContext, "call", locale), voice: REALTIME_VOICE, outputModalities: ["audio"] as ["audio"], inputAudioTranscription: { model: "gpt-4o-mini-transcribe", language: locale }, turnDetection: { type: "server-vad" as const, threshold: 0.5, silenceDurationMs: 600, prefixPaddingMs: 300 } }), [sessionContext, locale]);
  const realtime = useRealtime({ model, api: { token: `/api/voice/setup?${selectionQuery}&locale=${locale}` }, sessionConfig: config, startupTimeoutMs: 15_000,
    onToolCall: async ({ toolCall }) => {
      const response = await fetch("/api/voice/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selection: sessionContext, name: toolCall.toolName, args: toolCall.args }), signal: AbortSignal.timeout(5000) });
      return response.ok ? response.json() : { error: "Local evidence unavailable. Say you do not know." };
    },
    onError: error => {
      if (media.current && error.name !== "AbortError") fallbackToDictation();
    },
  });
  const connectVoice = useEffectEvent(async (attempt: number) => {
    const stream = media.current;
    if (!stream || generation.current !== attempt || connectedAttempt.current === attempt) return;
    connectedAttempt.current = attempt;
    try {
      const availability = await fetch("/api/voice/setup", { method: "HEAD", cache: "no-store" });
      if (generation.current !== attempt) return;
      if (!availability.ok) {
        fallbackToDictation();
        return;
      }
      await realtime.connect({ stream });
    } catch (error) {
      if (generation.current !== attempt) return;
      if (error instanceof Error && error.name === "AbortError") {
        stopVoice("micOff", false);
      } else {
        fallbackToDictation();
      }
    } finally {
      if (generation.current === attempt) {
        starting.current = false;
        setRequesting(false);
      }
    }
  });
  useEffect(() => {
    // Wait for the SDK to commit the store for the selected farm before connecting.
    if (pendingConnection !== null) void connectVoice(pendingConnection);
  }, [pendingConnection]);

  useEffect(() => {
    // The SDK's connect() opens transport. Capture starts once the server accepts the session.
    if (realtime.status === "connected" && media.current && !captureStarted.current) {
      captureStarted.current = true;
      try { realtime.startAudioCapture(media.current); }
      catch { realtime.disconnect(); releaseMedia(); }
    }
    if ((realtime.status === "disconnected" || realtime.status === "error") && !starting.current) releaseMedia();
  }, [realtime]);
  const { isCapturing, isPlaying } = realtime;
  useEffect(() => {
    const button = orb.current;
    const stream = media.current;
    if (!button || !stream || !isCapturing || isPlaying || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    void context.resume().catch(() => undefined);
    const samples = new Float32Array(analyser.fftSize);
    let frame = 0;
    let level = 0;
    const update = () => {
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
      const target = Math.min(1, Math.max(0, rms - 0.012) * 7);
      level += (target - level) * (target > level ? 0.42 : 0.15);
      button.style.setProperty("--voice-level", level.toFixed(3));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      button.style.removeProperty("--voice-level");
      source.disconnect();
      void context.close().catch(() => undefined);
    };
  }, [isCapturing, isPlaying]);
  function releaseMedia() {
    media.current?.getTracks().forEach(track => track.stop()); media.current = null;
    captureStarted.current = false;
  }
  useEffect(() => () => { generation.current++; abort.current?.abort(); releaseMedia(); dictation.current?.abort(); window.speechSynthesis?.cancel(); }, []);
  function interrupt() {
    abort.current?.abort(); stopSummary();
    setBusy(false);
  }
  async function startVoice() {
    if (starting.current) return;
    setDrawerOpen(true);
    interrupt();
    setNotice("");
    setVoiceError(false);
    const browser = window as DictationWindow;
    if (navigator.onLine && (browser.SpeechRecognition || browser.webkitSpeechRecognition)) {
      fallbackToDictation();
      return;
    }
    setRequesting(true);
    // Keep the session on its starting farm and month while the page remains interactive.
    starting.current = true;
    const attempt = ++generation.current;
    try {
      if (!navigator.onLine) throw new Error("Offline");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone unavailable");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (attempt !== generation.current) { stream.getTracks().forEach(track => track.stop()); return; }
      media.current = stream;
      setSessionSelection(selection);
      setPendingConnection(attempt);
    } catch (error) {
      if (attempt !== generation.current) return;
      starting.current = false;
      setRequesting(false);
      releaseMedia();
      setVoiceError(true);
      const name = error instanceof Error ? error.name : "";
      setNotice(name === "NotAllowedError" ? "allowMic" : !navigator.onLine ? "offline" : name === "NotFoundError" ? "noMic" : "voiceStartError");
    }
  }
  function stopVoice(message: VoiceTextKey | "", failed = true) {
    generation.current++;
    starting.current = false;
    setRequesting(false);
    setPendingConnection(null);
    releaseMedia();
    realtime.disconnect();
    const recognition = dictation.current;
    dictation.current = null;
    recognition?.abort();
    setDictating(false);
    stopSummary();
    setNotice(message);
    setVoiceError(failed);
  }
  const priorLocale = useRef(locale);
  const stopForLanguageChange = useEffectEvent(() => { stopVoice("", false); interrupt(); });
  useEffect(() => {
    if (priorLocale.current !== locale) { priorLocale.current = locale; stopForLanguageChange(); }
  }, [locale]);
  function fallbackToDictation() {
    stopVoice("", false);
    const browser = window as DictationWindow;
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError(true);
      setNotice("realtimeUnavailable");
      return;
    }
    const recognition = new Recognition();
    dictation.current = recognition;
    recognition.lang = localeTag(locale);
    let completed = false;
    recognition.onresult = event => {
      if (dictation.current !== recognition || completed) return;
      const text = event.results[0]?.[0]?.transcript;
      if (!text?.trim()) return;
      completed = true;
      dictation.current = null;
      setDictating(false);
      void send(text, true);
    };
    recognition.onerror = event => {
      if (dictation.current !== recognition) return;
      completed = true;
      setVoiceError(true);
      setNotice(event.error === "not-allowed" ? "allowMic" : "dictationError");
    };
    recognition.onend = () => {
      if (dictation.current !== recognition) return;
      dictation.current = null;
      setDictating(false);
      if (!completed) {
        setVoiceError(true);
        setNotice("noQuestion");
      }
    };
    try {
      setDictating(true);
      recognition.start();
      voicePanel.current?.scrollIntoView({ block: "nearest" });
    } catch {
      stopVoice("dictationUnavailable");
    }
  }
  function stopSummary() {
    utteranceRef.current = null;
    window.speechSynthesis?.cancel();
    summary.stop();
  }
  function speak(text: string) {
    const synthesis = window.speechSynthesis;
    if (!synthesis) {
      setVoiceError(true);
      setNotice("speechUnavailable");
      return;
    }
    const spoken = plainVoiceText(text);
    if (!spoken) return;
    stopSummary();
    if (synthesis.paused) synthesis.resume();
    const utterance = new SpeechSynthesisUtterance(spoken);
    const voices = synthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith(locale));
    const natural = (voice: SpeechSynthesisVoice) => /natural|neural|premium|enhanced|google|online/i.test(voice.name);
    const regional = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase() === localeTag(locale).toLowerCase();
    utterance.voice = voices.find(voice => natural(voice) && regional(voice))
      ?? voices.find(natural) ?? voices.find(regional) ?? voices[0] ?? null;
    utterance.lang = utterance.voice?.lang ?? localeTag(locale);
    utterance.rate = 0.95;
    utteranceRef.current = utterance;
    const finish = () => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
    };
    utterance.onend = finish;
    utterance.onerror = () => {
      if (utteranceRef.current !== utterance) return;
      finish();
      setVoiceError(true);
      setNotice("speechError");
    };
    synthesis.speak(utterance);
  }
  function playSummary() {
    setDrawerOpen(true);
    interrupt();
    void summary.read(localAdviceText(selection, locale));
  }
  async function send(text: string, readAnswer = false) {
    if (!text.trim()) return;
    setDraft("");
    if (!readAnswer && realtime.status === "connected") {
      try { realtime.sendTextMessage(text); return; }
      catch { stopVoice("voiceDisconnected"); }
    }
    interrupt(); setBusy(true);
    setDictatedAnswer(readAnswer);
    const conversation = [...messages.filter(message => message.content.trim()), { role: "user" as const, content: text.slice(0, 1800) }].slice(-7);
    setMessages([...conversation, { role: "assistant", content: "" }]);
    const controller = new AbortController(); abort.current = controller;
    let answer = "";
    let sources: RagSource[] = [];
    try {
      const response = await fetch("/api/voice/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selection, messages: conversation, locale }), signal: controller.signal });
      if (!response.ok || !response.body) throw new Error("Unavailable");
      const sourcesHeader = response.headers.get("X-AgroVision-Sources");
      if (sourcesHeader) {
        try { sources = JSON.parse(decodeURIComponent(sourcesHeader)) as RagSource[]; } catch { sources = []; }
      }
      const reader = response.body.getReader(); const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
        if (controller.signal.aborted) return;
        answer += chunk;
        setMessages([...conversation, { role: "assistant", content: answer, sources: sources.length ? sources : undefined }]);
        if (done) break;
      }
      if (!answer.trim()) throw new Error("Empty answer");
      if (readAnswer && !controller.signal.aborted) speak(answer);
    } catch {
      if (!controller.signal.aborted) {
        const fallback = localVoiceAnswer(selection, text, locale);
        setMessages([...conversation, { role: "assistant", content: fallback }]);
        if (readAnswer) speak(fallback);
      }
    } finally { if (abort.current === controller) { abort.current = null; setBusy(false); } }
  }
  const active = dictating || requesting || realtime.status === "connecting" || realtime.status === "connected";
  const orbState = !active ? "idle" : realtime.isPlaying ? "speaking" : (dictating || realtime.isCapturing) ? "listening" : "connecting";
  const isSpeakingOrListening = active || summaryState !== "idle" || (busy && dictatedAnswer);
  const voiceStatus = { idle: busy && dictatedAnswer ? text.preparingAnswer : summaryState === "playing" ? text.hearSummary : summaryState === "paused" ? text.pause : notice ? text[notice] : "", connecting: text.connecting, listening: text.listening, speaking: text.speaking }[orbState];
  const hasConversation = realtime.messages.length > 0 || messages.length > 0 || isSpeakingOrListening || Boolean(notice);
  const hangUp = () => stopVoice("micOff", false);
  return <>
    {defaultOpenWrite && <section ref={voicePanel} id="voz" className="voice-compact" aria-label={text.voiceAssistant}>
      <div className="voice-bar-head">
        <h2><AudioLines aria-hidden="true" size={21}/> {text.quickAssistant}</h2>
        <span>{text.tapSpeak}</span>
      </div>
      {voiceError && !active && notice && <p className={session.error} role="status">{text[notice]}</p>}
      {(realtime.messages.length > 0 || messages.length > 0) && (
        <div className="voice-compact-log" tabIndex={0} role="log" aria-live="polite" aria-label={text.transcript}>
          {realtime.messages.map(message => (
            <div key={message.id} className={`voice-msg-bubble ${message.role === "user" ? "user" : "assistant"}`}>
              <strong>{message.role === "user" ? text.you : "AgroVision"}</strong>
              <p>{message.parts.filter(part => part.type === "text").map((part, index) => <span key={index}>{part.type === "text" ? part.text : ""}</span>)}</p>
            </div>
          ))}
          {messages.map((message, index) => (
            <div key={index} className={`voice-msg-bubble ${message.role === "user" ? "user" : "assistant"}`}>
              <strong>{message.role === "user" ? text.you : "AgroVision"}</strong>
              <p>{message.content || text.thinking}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="rag-sources" role="list" aria-label={text.consultedSources}>
                  {message.sources.map(source => (
                    <a key={source.id} className="rag-source-chip" role="listitem" href={source.sourceUrl ?? "#"} target={source.sourceUrl ? "_blank" : undefined} rel={source.sourceUrl ? "noreferrer" : undefined} title={source.filePath}>{source.sourceName}</a>
                  ))}
                </div>
              )}
              {message.role === "assistant" && message.content && !busy && (
                <button type="button" className="voice-inline-speak" onClick={() => speak(message.content)}><Volume2 size={14} aria-hidden="true"/> {text.hearAnswer}</button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="voice-alternatives">
        <details className="visual-details voice-write-box" open={defaultOpenWrite ? true : undefined}>
          <summary><Keyboard aria-hidden="true" size={16}/> {text.write}</summary>
          <form className="voice-form" onSubmit={event => { event.preventDefault(); void send(draft); }}>
            <input aria-label={text.questionLabel} placeholder={text.questionPlaceholder} value={draft} maxLength={1800} onChange={event => setDraft(event.target.value)}/>
            <button disabled={busy || !draft.trim()}><Send size={15} aria-hidden="true"/> {text.send}</button>
          </form>
        </details>
        <div className="voice-action-row">
          <button type="button" className="voice-action-pill" onClick={active ? hangUp : startVoice}>
            {active ? <Square size={15} aria-hidden="true"/> : <Mic size={15} aria-hidden="true"/>}
            {active ? text.hangUp : text.speak}
          </button>
          <button type="button" className="voice-action-pill" onClick={playSummary}><Volume2 size={15} aria-hidden="true"/> {text.hearSummary}</button>
          {summaryState !== "idle" && (
            <div role="group" aria-label={text.summaryControls} style={{ display: "contents" }}>
              <button type="button" className="voice-action-pill" onClick={toggleSummaryPause}>{summaryState === "paused" ? text.resume : text.pause}</button>
              <button type="button" className="voice-action-pill" onClick={playSummary}>{text.restart}</button>
              <button type="button" className="voice-action-pill" onClick={stopSummary}>{text.stop}</button>
            </div>
          )}
        </div>
        {summary.reading && summaryState !== "idle" && (
          <p className="voice-drawer-hint" role="status">
            {summary.reading.generated ? `${text.generated} · ` : ""}{summary.reading.status}
          </p>
        )}
        <details className="visual-details voice-privacy"><summary>{text.aboutMic}</summary><p>{text.privacy}</p></details>
      </div>
    </section>}

    <div className="voice-floating-shell" aria-live="polite">
      {drawerOpen && hasConversation && (
        <aside className="voice-live-drawer" aria-label={locale === "en" ? "Live voice chat" : "Chat de voz en vivo"}>
          <div className="voice-drawer-head">
            <span className={`voice-drawer-status ${orbState}`}>
              <i className="voice-status-dot" aria-hidden="true"/>
              {voiceStatus || (locale === "en" ? "AgroVision Assistant" : "Asistente AgroVision")}
            </span>
            <button type="button" className="voice-drawer-close" onClick={() => setDrawerOpen(false)} aria-label={locale === "en" ? "Hide floating chat" : "Ocultar chat desplegable"} title={locale === "en" ? "Minimize chat" : "Minimizar chat"}>
              <ChevronDown size={16} aria-hidden="true"/>
            </button>
          </div>
          <div className="voice-drawer-body">
            {realtime.messages.length === 0 && messages.length === 0 && summaryState === "idle" && (
              <p className="voice-drawer-hint">
                {orbState === "listening" ? (locale === "en" ? "Listening… ask about your farm, rain or market." : "Te escucho… haz tu pregunta sobre tu finca, lluvia o mercado.") : orbState === "speaking" ? (locale === "en" ? "AgroVision is answering aloud…" : "AgroVision está respondiendo en voz alta…") : orbState === "connecting" ? (locale === "en" ? "Connecting microphone to AgroVision…" : "Conectando micrófono con AgroVision…") : notice ? text[notice] : text.tapSpeak}
              </p>
            )}
            {summaryState !== "idle" && realtime.messages.length === 0 && messages.length === 0 && (
              <div className="voice-msg-bubble assistant">
                <strong>{locale === "en" ? "AgroVision (summary)" : "AgroVision (resumen)"}</strong>
                <p>{localAdviceText(selection, locale)}</p>
              </div>
            )}
            {realtime.messages.map(message => (
              <div key={message.id} className={`voice-msg-bubble ${message.role === "user" ? "user" : "assistant"}`}>
                <strong>{message.role === "user" ? text.you : "AgroVision"}</strong>
                <p>{message.parts.filter(part => part.type === "text").map((part, index) => <span key={index}>{part.type === "text" ? part.text : ""}</span>)}</p>
              </div>
            ))}
            {messages.map((message, index) => (
              <div key={index} className={`voice-msg-bubble ${message.role === "user" ? "user" : "assistant"}`}>
                <strong>{message.role === "user" ? text.you : "AgroVision"}</strong>
                <p>{message.content || text.thinking}</p>
              </div>
            ))}
          </div>
          <div className="voice-drawer-foot">
            {dictating && <button type="button" className="voice-drawer-btn" onClick={() => dictation.current?.stop()}>{text.finishQuestion}</button>}
            {active && <button type="button" className="voice-drawer-btn danger" onClick={hangUp}><Square size={13} aria-hidden="true"/> {text.hangUp}</button>}
            {summaryState !== "idle" && (
              <>
                <button type="button" className="voice-drawer-btn" onClick={toggleSummaryPause}>{summaryState === "paused" ? text.resume : text.pause}</button>
                <button type="button" className="voice-drawer-btn danger" onClick={stopSummary}>{text.stop}</button>
              </>
            )}
            {!active && summaryState === "idle" && (
              <form className="voice-drawer-form" onSubmit={event => { event.preventDefault(); void send(draft); }}>
                <input aria-label={locale === "en" ? "Write in floating chat" : "Escribir en chat desplegable"} placeholder={locale === "en" ? "Write here…" : "Escribe aquí…"} value={draft} maxLength={1800} onChange={event => setDraft(event.target.value)}/>
                <button type="submit" disabled={busy || !draft.trim()} aria-label={text.send}><Send size={14} aria-hidden="true"/></button>
              </form>
            )}
          </div>
        </aside>
      )}
      <div className="voice-fab-row">
        {hasConversation && !drawerOpen && (
          <button type="button" className="voice-drawer-chip" onClick={() => setDrawerOpen(true)} aria-label={locale === "en" ? "Open voice chat" : "Abrir chat de voz"}>
            <MessageCircle size={16} aria-hidden="true"/>
            <span>{isSpeakingOrListening ? (voiceStatus || (locale === "en" ? "Live" : "En vivo")) : (locale === "en" ? "View chat" : "Ver chat")}</span>
          </button>
        )}
        <button ref={orb} type="button" className={session.orb} data-state={orbState} aria-label={active ? text.hangUp : text.speak} title={active ? text.tapHangUp : text.speakAgrovision} onClick={active ? hangUp : startVoice}
          onKeyDown={event => { if (active && event.key === "Escape") { event.preventDefault(); hangUp(); } }}>
          {active ? <Square aria-hidden="true"/> : <AudioLines aria-hidden="true"/>}
        </button>
      </div>
    </div>
  </>;
}
