/* AI: Codex/OpenAI, 2026-11-14; conversational voice UI by Claude (Anthropic), 2026-11-14. Frainer review pending. */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { experimental_useRealtime as useRealtime } from "@ai-sdk/react";
import { gateway } from "@ai-sdk/gateway";
import { REALTIME_MODEL, voiceInstructions, localAdviceText, type VoiceSelection } from "@/lib/voice-context";
import { FarmIcon } from "@/components/farm-icon";
const model = gateway.experimental_realtime(REALTIME_MODEL);
type Message = { role: "user" | "assistant"; content: string };
export function VoiceAssistant({ selection }: { selection: VoiceSelection }) {
  const [notice, setNotice] = useState("Habla con naturalidad. Te respondemos en español.");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("Disponibilidad de IA por comprobar");
  const [readAloud, setReadAloud] = useState(true);
  const abort = useRef<AbortController | null>(null);
  const media = useRef<MediaStream | null>(null);
  const vad = useRef<{ context: AudioContext; timer: ReturnType<typeof setInterval> | null } | null>(null);
  const generation = useRef(0);
  const starting = useRef(false);
  const greeted = useRef(false);
  const [level, setLevel] = useState(0);
  const selectionQuery = useMemo(() => new URLSearchParams(Object.entries(selection).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : String(value)])).toString(), [selection]);
  const config = useMemo(() => ({ instructions: voiceInstructions(selection), voice: "coral", outputModalities: ["audio"] as ["audio"], inputAudioTranscription: { model: "gpt-4o-mini-transcribe", language: "es" }, turnDetection: { type: "server-vad" as const, threshold: 0.5, silenceDurationMs: 600, prefixPaddingMs: 300 } }), [selection]);
  const realtime = useRealtime({ model, api: { token: `/api/voice/setup?${selectionQuery}` }, sessionConfig: config, startupTimeoutMs: 15_000,
    onToolCall: async ({ toolCall }) => {
      const response = await fetch("/api/voice/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selection, name: toolCall.toolName, args: toolCall.args }), signal: AbortSignal.timeout(5000) });
      return response.ok ? response.json() : { error: "Local evidence unavailable. Say you do not know." };
    },
    onError: () => { releaseMedia(); setNotice("Se cortó la conversación de voz. Revisa tu internet y toca Hablar otra vez, o escribe tu pregunta."); },
  });
  // connect() initiates transport; only the SDK status confirms a live session.
  useEffect(() => {
    if (realtime.status === "disconnected" && media.current) releaseMedia();
    // Like a phone call: once connected, AgroVision speaks first with a short greeting.
    if (realtime.status === "connected" && !greeted.current) { greeted.current = true; realtime.requestResponse(); }
    if (realtime.status !== "connected") greeted.current = false;
  },[realtime.status, realtime]);
  const controls = useRef(realtime);
  useEffect(() => { controls.current = realtime; }, [realtime]);
  function releaseMedia() {
    if (vad.current) { if (vad.current.timer) clearInterval(vad.current.timer); void vad.current.context.close(); vad.current = null; }
    media.current?.getTracks().forEach(track => track.stop()); media.current = null;
  }
  useEffect(() => () => { generation.current++; abort.current?.abort(); releaseMedia(); window.speechSynthesis?.cancel(); }, []);
  function interrupt() {
    abort.current?.abort(); window.speechSynthesis?.cancel();
    if (realtime.status === "connected") { realtime.cancelResponse(); realtime.stopPlayback(); }
    setBusy(false);
  }
  async function startVoice() {
    if (starting.current) return;
    interrupt(); starting.current = true; const attempt = ++generation.current;
    try {
      if (!navigator.onLine) throw new Error("Offline");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone unavailable");
      // Warm the audio context inside the user gesture; SDK manages streaming PCM and playback.
      const context = new AudioContext(); vad.current = { context, timer: null }; await context.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (attempt !== generation.current) { stream.getTracks().forEach(track => track.stop()); void context.close(); return; }
      media.current = stream;
      const analyser = context.createAnalyser(); analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize); let sustained = 0;
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
        sustained = rms > 0.08 ? sustained + 1 : 0;
        setLevel(Math.min(1, rms * 8));
        // Local VAD cuts queued playback immediately; Gateway VAD owns turn completion.
        if (sustained === 3 && controls.current.isPlaying) { controls.current.cancelResponse(); controls.current.stopPlayback(); }
      }, 70);
      vad.current = { context, timer };
      await realtime.connect({ stream });

    } catch (error) {
      releaseMedia();
      const name = error instanceof Error ? error.name : "";
      setNotice(name === "NotAllowedError" ? "No diste permiso al micrófono. Toca el candado junto a la dirección web, permite el micrófono y vuelve a tocar Hablar." : !navigator.onLine ? "Sin internet: la voz necesita conexión. Puedes escuchar el resumen." : name === "NotFoundError" ? "No encontramos micrófono en este equipo." : "No se pudo iniciar la voz. Toca Hablar otra vez o escribe tu pregunta.");
    }
    finally { starting.current = false; }
  }
  function stopVoice() { generation.current++; realtime.disconnect(); releaseMedia(); interrupt(); setNotice("Micrófono apagado. Puedes escribir tu pregunta."); }
  function localSummary() { return localAdviceText(selection); }
  function speak(text: string) {
    if (!readAloud || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-DO";
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item => item.lang === utterance.lang) ?? voices.find(item => item.lang.startsWith(utterance.lang.slice(0, 2)));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }
  async function send(text: string) {
    if (!text.trim()) return;
    setDraft("");
    if (realtime.status === "connected") { interrupt(); realtime.sendTextMessage(text); return; }
    interrupt(); setBusy(true);
    const conversation = [...messages.filter(message => message.content.trim()), { role: "user" as const, content: text.slice(0, 1800) }].slice(-7);
    setMessages([...conversation, { role: "assistant", content: "" }]);
    const controller = new AbortController(); abort.current = controller;
    let answer = ""; let sentence = "";
    try {
      const response = await fetch("/api/voice/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selection, messages: conversation }), signal: controller.signal });
      if (!response.ok || !response.body) throw new Error("Unavailable");
      setMode(response.headers.get("X-AgroVision-Mode") === "ai" ? "Texto de IA · AI Gateway · voz del navegador" : "Resumen local · sin IA · voz del navegador");
      const reader = response.body.getReader(); const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
        answer += chunk; sentence += chunk;
        setMessages([...conversation, { role: "assistant", content: answer }]);
        // Speak completed phrases while text continues streaming. Never wait for the full answer.
        const phrases = sentence.match(/^([\s\S]*?[.!?](?:\s|$))([\s\S]*)$/);
        if (phrases) { speak(phrases[1]); sentence = phrases[2]; }
        if (done) break;
      }
      if (!answer.trim()) throw new Error("Empty answer");
      speak(sentence);
    } catch {
      if (!controller.signal.aborted) {
        const local = localSummary();
        setMessages([...conversation, { role: "assistant", content: local }]);
        setMode("Resumen local · sin IA · voz del navegador"); speak(local);
      }
    } finally { if (abort.current === controller) { abort.current = null; setBusy(false); } }
  }
  const active = realtime.status === "connecting" || realtime.status === "connected";
  return <section className="card voice-card" aria-label="Asistente de voz">
    <div className="voice-intro"><span className="step-label">4 · PREGÚNTALE A AGROVISION</span><h2>Pregunta con tu voz</h2><p>Voz generada por IA. Solo explica la evidencia disponible.</p></div>
    <div className="voice-actions">
      <button className={`voice-orb ${realtime.isPlaying ? "speaking" : active ? "listening" : ""}`} style={{ ["--lvl" as string]: String(realtime.isPlaying ? 0.6 : level) }} onClick={active ? stopVoice : startVoice} aria-label={active ? "Terminar conversación" : "Iniciar conversación"}>
        <span className="orb-core"><FarmIcon name={active ? "stop" : "mic"} size={44}/></span>
      </button>
      <strong className="orb-label">{realtime.status === "connecting" ? "Conectando…" : realtime.isPlaying ? "AgroVision está hablando… (háblale para interrumpir)" : realtime.status === "connected" ? "Te escucho… habla cuando quieras" : "Toca para hablar"}</strong>
      {active && <button className="secondary-action" onClick={stopVoice}><FarmIcon name="stop"/>Colgar</button>}
    </div>
    <p role="status">{realtime.status === "connected" ? "Micrófono encendido. Habla de nuevo para interrumpir." : realtime.status === "connecting" ? "Conectando micrófono…" : notice}</p>
    <div className="voice-transcript" role="log" aria-label="Transcripción de la conversación" aria-live="polite">
      {realtime.messages.map(message => <p key={message.id}><strong>{message.role === "user" ? "Tú" : "AgroVision"}: </strong>{message.parts.filter(part => part.type === "text").map((part, index) => <span key={index}>{part.type === "text" ? part.text : ""}</span>)}</p>)}
      {messages.map((message, index) => <p key={index}><strong>{message.role === "user" ? "Tú" : "AgroVision"}: </strong>{message.content || "Pensando…"}</p>)}
    </div>
    <form className="voice-form" onSubmit={event => { event.preventDefault(); void send(draft); }}><input aria-label="Pregunta sobre esta parcela" placeholder="Pregunta sobre esta parcela…" value={draft} maxLength={1800} onChange={event => setDraft(event.target.value)}/><button disabled={busy || !draft.trim()}>Enviar →</button></form>
    <div className="voice-bottom"><button className="secondary-action" onClick={() => { interrupt(); const text = localSummary(); setMessages([{ role: "assistant", content: text }]); setMode("Resumen local · sin IA · voz del navegador"); speak(text); }}><FarmIcon name="sound"/>Escuchar resumen</button><label><input type="checkbox" checked={readAloud} onChange={event => { setReadAloud(event.target.checked); window.speechSynthesis?.cancel(); }}/> Leer en voz alta</label></div>
    <small>{realtime.status === "connected" ? "Voz de IA · Vercel AI Gateway" : mode}. La conversación requiere conexión y permiso de micrófono. Con el micrófono encendido se envía audio a AI Gateway. La aplicación no guarda grabaciones; el proveedor aplica sus políticas de datos.</small>
  </section>;
}
