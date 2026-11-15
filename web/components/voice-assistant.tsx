/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Codex (OpenAI) and Claude (Anthropic), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useReadAloud } from "@/lib/use-read-aloud";
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, Keyboard, Square, Volume2 } from "lucide-react";
import { experimental_useRealtime as useRealtime } from "@ai-sdk/react";
import { gateway } from "@ai-sdk/gateway";
import { REALTIME_MODEL, voiceInstructions, localAdviceText, type VoiceSelection } from "@/lib/voice-context";
import session from "./voice-session.module.css";
const model = gateway.experimental_realtime(REALTIME_MODEL);
type Message = { role: "user" | "assistant"; content: string };
export function VoiceAssistant({ selection, defaultOpenWrite = false }: { selection: VoiceSelection; defaultOpenWrite?: boolean }) {
  const [notice, setNotice] = useState("");
  const [voiceError, setVoiceError] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [sessionSelection, setSessionSelection] = useState<VoiceSelection>();
  const sessionContext = sessionSelection ?? selection;
  const abort = useRef<AbortController | null>(null);
  const media = useRef<MediaStream | null>(null);
  const orb = useRef<HTMLButtonElement>(null);
  const generation = useRef(0);
  const starting = useRef(false);
  const captureStarted = useRef(false);
  const [requesting, setRequesting] = useState(false);
  const selectionQuery = useMemo(() => new URLSearchParams(Object.entries(sessionContext).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : String(value)])).toString(), [sessionContext]);
  const config = useMemo(() => ({ instructions: voiceInstructions(sessionContext), voice: "coral", outputModalities: ["audio"] as ["audio"], inputAudioTranscription: { model: "gpt-4o-mini-transcribe", language: "es" }, turnDetection: { type: "server-vad" as const, threshold: 0.5, silenceDurationMs: 600, prefixPaddingMs: 300 } }), [sessionContext]);
  const realtime = useRealtime({ model, api: { token: `/api/voice/setup?${selectionQuery}` }, sessionConfig: config, startupTimeoutMs: 15_000,
    onToolCall: async ({ toolCall }) => {
      const response = await fetch("/api/voice/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selection: sessionContext, name: toolCall.toolName, args: toolCall.args }), signal: AbortSignal.timeout(5000) });
      return response.ok ? response.json() : { error: "Local evidence unavailable. Say you do not know." };
    },
    onError: () => { stopVoice("Se cortó la voz. Intenta de nuevo o escribe."); },
  });
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
  useEffect(() => () => { generation.current++; abort.current?.abort(); releaseMedia(); window.speechSynthesis?.cancel(); }, []);
  const summary = useReadAloud();
  function interrupt() {
    summary.stop();
    abort.current?.abort(); window.speechSynthesis?.cancel();
    setBusy(false);
  }
  async function startVoice() {
    if (starting.current) return;
    interrupt();
    setNotice("");
    setVoiceError(false);
    setRequesting(true);
    // Keep the session on its starting farm and month while the page remains interactive.
    setSessionSelection(selection);
    starting.current = true;
    const attempt = ++generation.current;
    try {
      if (!navigator.onLine) throw new Error("Offline");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone unavailable");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (attempt !== generation.current) { stream.getTracks().forEach(track => track.stop()); return; }
      media.current = stream;
      await realtime.connect({ stream });
    } catch (error) {
      if (attempt !== generation.current) return;
      releaseMedia();
      setVoiceError(true);
      const name = error instanceof Error ? error.name : "";
      setNotice(name === "NotAllowedError" ? "Permite el micrófono en tu navegador." : !navigator.onLine ? "Sin internet. Puedes escuchar el resumen." : name === "NotFoundError" ? "No encontramos un micrófono." : "No se pudo iniciar la voz. Intenta de nuevo o escribe.");
    } finally {
      if (attempt === generation.current) { starting.current = false; setRequesting(false); }
    }
  }
  function stopVoice(message: string, failed = true) {
    generation.current++;
    starting.current = false;
    setRequesting(false);
    realtime.disconnect();
    releaseMedia();
    window.speechSynthesis?.cancel();
    setNotice(message);
    setVoiceError(failed);
  }
  async function send(text: string) {
    if (!text.trim()) return;
    setDraft("");
    if (realtime.status === "connected") {
      try { realtime.sendTextMessage(text); return; }
      catch { stopVoice("Se cortó la voz. Puedes escribir."); }
    }
    interrupt(); setBusy(true);
    const conversation = [...messages.filter(message => message.content.trim()), { role: "user" as const, content: text.slice(0, 1800) }].slice(-7);
    setMessages([...conversation, { role: "assistant", content: "" }]);
    const controller = new AbortController(); abort.current = controller;
    let answer = "";
    try {
      const response = await fetch("/api/voice/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selection, messages: conversation }), signal: controller.signal });
      if (!response.ok || !response.body) throw new Error("Unavailable");
      const reader = response.body.getReader(); const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
        if (controller.signal.aborted) return;
        answer += chunk;
        setMessages([...conversation, { role: "assistant", content: answer }]);
        if (done) break;
      }
      if (!answer.trim()) throw new Error("Empty answer");
    } catch {
      if (!controller.signal.aborted) {
        setMessages([...conversation, { role: "assistant", content: `Resumen sin conexión. ${localAdviceText(selection)}` }]);
      }
    } finally { if (abort.current === controller) { abort.current = null; setBusy(false); } }
  }
  const active = requesting || realtime.status === "connecting" || realtime.status === "connected";
  const orbState = !active ? "idle" : realtime.isPlaying ? "speaking" : realtime.isCapturing ? "listening" : "connecting";
  const voiceStatus = { idle: notice, connecting: "Conectando…", listening: "Escuchando…", speaking: "Hablando…" }[orbState];
  const hangUp = () => stopVoice("Micrófono apagado.", false);
  return <section id="voz" className="voice-compact" aria-label="Asistente de voz">
    <button ref={orb} type="button" className={session.orb} data-state={orbState} aria-label={active ? "Colgar" : "Hablar"} title={active ? "Toca para colgar" : "Hablar con AgroVision"} onClick={active ? hangUp : startVoice}
      onKeyDown={event => { if (active && event.key === "Escape") { event.preventDefault(); hangUp(); } }}>
      {active ? <Square aria-hidden="true"/> : <AudioLines aria-hidden="true"/>}
    </button>
    <p className={voiceError && !active ? session.error : "sr-only"} role="status">{voiceStatus}</p>
    <div hidden={active}>
    <div className="voice-bar-head">
      <strong><AudioLines aria-hidden="true" size={18}/> Asistente rápido de voz y texto</strong>
      <span>Toca Hablar o consulta por escrito</span>
    </div>
    {(realtime.messages.length > 0 || messages.length > 0) && <details className="visual-details"><summary>Ver conversación</summary><div className="voice-compact-log" tabIndex={0} role="log" aria-live="polite" aria-label="Transcripción de la conversación">
      {realtime.messages.map(message => <p key={message.id}><strong>{message.role === "user" ? "Tú" : "AgroVision"}: </strong>{message.parts.filter(part => part.type === "text").map((part, index) => <span key={index}>{part.type === "text" ? part.text : ""}</span>)}</p>)}
      {messages.map((message, index) => <p key={index}><strong>{message.role === "user" ? "Tú" : "AgroVision"}: </strong>{message.content || "Pensando…"}</p>)}
    </div></details>}
    <div className="voice-alternatives">
      <details className="visual-details" open={defaultOpenWrite ? true : undefined}><summary><Keyboard aria-hidden="true"/> Escribir</summary><form className="voice-form" onSubmit={event => { event.preventDefault(); void send(draft); }}><input aria-label="Pregunta sobre esta parcela" placeholder="Tu pregunta (ej.: ¿Qué me conviene sembrar ahora?)" value={draft} maxLength={1800} onChange={event => setDraft(event.target.value)}/><button disabled={busy || !draft.trim()}>Enviar</button></form></details>
      {!active && <button type="button" className="link-button" onClick={() => { interrupt(); summary.read(localAdviceText(selection)); }}><Volume2 aria-hidden="true"/> Oír resumen</button>}
      {summary.reading && <div><p role="status">{summary.reading.status}</p><p>{summary.reading.text}</p>{summary.reading.status === "Leyendo resumen…" && <button type="button" className="link-button" onClick={summary.stop}>Detener lectura</button>}</div>}
      <details className="visual-details voice-privacy"><summary>Sobre el micrófono</summary><p>Durante la conversación se envía audio a AI Gateway. AgroVision no guarda grabaciones.</p></details>
    </div>
    </div>
  </section>;
}
