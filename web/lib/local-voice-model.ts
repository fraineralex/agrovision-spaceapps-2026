/* AI: Codex (OpenAI), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import "server-only";
import { z } from "zod";
import { adviceMetrics, type VoiceSelection } from "./voice-context";

export type VoiceMessage = { role: "user" | "assistant"; content: string };

const modelResponse = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().trim().min(1) }) })).min(1),
});

export async function askLocalVoiceModel(
  selection: VoiceSelection,
  messages: VoiceMessage[],
  signal: AbortSignal,
) {
  if (process.env.NODE_ENV !== "development" && process.env.AGROVISION_LOCAL_VOICE !== "1") return null;
  const advice = adviceMetrics(selection);
  const evidence = {
    provincia: advice.province,
    mes: advice.sowMonth,
    riego: selection.irrigation,
    cultivoAnterior: advice.previousCrop,
    recomendado: advice.recommendedCrop,
    opciones: advice.ranking.filter(crop => crop.overall !== null).map(crop => {
      const market = advice.market.find(item => item.crop === crop.crop);
      return {
        cultivo: crop.crop,
        cosecha: crop.harvestMonth,
        agua: crop.plainWords.water,
        clima: crop.plainWords.climate,
        plagas: crop.pestPrecautions.slice(0, 1),
        ultimaReferenciaMayorista: market?.latest && { ...market.latest, unidad: market.unit },
      };
    }),
    lluvia: selection.rainAlert,
    ganancia: selection.profitRange,
  };
  try {
    const response = await fetch("http://127.0.0.1:11435/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(24_000)]),
      body: JSON.stringify({
        model: "agrovision-voice",
        stream: false,
        temperature: 0,
        max_tokens: 180,
        chat_template_kwargs: { enable_thinking: false },
        messages: [
          {
            role: "system",
            content: `Eres AgroVision. Contesta la última pregunta en español sencillo en una o dos frases. Usa el historial para entender «esa» u «otra». Si te piden una alternativa, elige solo un cultivo distinto del mencionado y da un motivo de su ficha. Si piden cuándo se cosecha, identifica el cultivo de la conversación y copia el mes exacto de su campo cosecha como una estimación. No calcules otro mes. Usa únicamente los datos de la finca. Los precios son históricos, al por mayor. Si falta el dato, dilo. Datos en JSON: ${JSON.stringify(evidence)}`,
          },
          ...messages.map(message => ({ ...message, content: message.content.slice(0, 1200) })),
        ],
      }),
    });
    if (!response.ok) return null;
    const parsed = modelResponse.safeParse(await response.json());
    return parsed.success ? parsed.data.choices[0].message.content : null;
  } catch {
    return null;
  }
}
