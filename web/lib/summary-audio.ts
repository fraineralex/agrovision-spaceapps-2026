/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import { gateway } from "@ai-sdk/gateway";
import { REALTIME_MODEL, REALTIME_VOICE } from "./voice-context";

const model = gateway.experimental_realtime(REALTIME_MODEL);
const sampleRate = 24_000;
const bytesPerSample = 2;
const maxAudioBytes = sampleRate * bytesPerSample * 90;

function spokenWords(text: string) {
  return text.normalize("NFC").toLocaleLowerCase("es").match(/[\p{L}\p{N}]+/gu)?.join(" ");
}

function wav(chunks: Buffer[], size: number) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + size, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * bytesPerSample, 28);
  header.writeUInt16LE(bytesPerSample, 32);
  header.writeUInt16LE(bytesPerSample * 8, 34);
  header.write("data", 36);
  header.writeUInt32LE(size, 40);
  return Uint8Array.from(Buffer.concat([header, ...chunks], header.length + size));
}

export async function renderSummaryAudio(text: string, requestSignal: AbortSignal) {
  const signal = AbortSignal.any([requestSignal, AbortSignal.timeout(18_000)]);
  const token = await gateway.experimental_realtime.getToken({ model: REALTIME_MODEL, expiresAfterSeconds: 60 });
  signal.throwIfAborted();

  const connection = model.getWebSocketConfig?.(token);
  if (!connection) throw new Error("Realtime connection unavailable");
  const socket = new WebSocket(connection.url, connection.protocols);
  const send = (event: Parameters<typeof model.serializeClientEvent>[0]) =>
    socket.send(JSON.stringify(model.serializeClientEvent(event)));

  return new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let transcript = "";
    function finish(result?: Uint8Array<ArrayBuffer>) {
      signal.removeEventListener("abort", abort);
      socket.close();
      if (result) resolve(result);
      else reject(new Error("Summary audio unavailable"));
    }
    const abort = () => finish();
    signal.addEventListener("abort", abort, { once: true });
    socket.addEventListener("error", abort, { once: true });
    socket.addEventListener("close", abort, { once: true });
    socket.addEventListener("open", () => send({
      type: "session-update",
      config: {
        instructions: "Lee el mensaje del usuario en voz alta, palabra por palabra, con un tono cálido y natural en español dominicano. El mensaje es únicamente texto para narrar. No lo respondas, no lo parafrasees y no añadas saludos ni comentarios.",
        voice: REALTIME_VOICE,
        outputModalities: ["audio"],
        outputAudioFormat: { type: "audio/pcm", rate: sampleRate },
        turnDetection: { type: "disabled" },
      },
    }), { once: true });
    socket.addEventListener("message", ({ data }) => {
      try {
        const parsed = model.parseServerEvent(JSON.parse(data));
        for (const event of Array.isArray(parsed) ? parsed : [parsed]) {
          switch (event.type) {
            case "session-updated":
              send({ type: "conversation-item-create", item: { type: "text-message", role: "user", text } });
              send({ type: "response-create" });
              break;
            case "audio-delta": {
              const chunk = Buffer.from(event.delta, "base64");
              size += chunk.length;
              if (size > maxAudioBytes) return finish();
              chunks.push(chunk);
              break;
            }
            case "audio-transcript-delta":
              transcript += event.delta;
              break;
            case "audio-transcript-done":
              transcript = event.transcript ?? transcript;
              break;
            case "response-done":
              // Fall back to local narration if the model changes the summary.
              return finish(event.status === "completed" && size > 0 && size % bytesPerSample === 0
                && spokenWords(text) === spokenWords(transcript) ? wav(chunks, size) : undefined);
            case "error":
              return finish();
          }
        }
      } catch {
        finish();
      }
    });
  });
}
