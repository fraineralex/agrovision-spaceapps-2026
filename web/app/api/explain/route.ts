/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { generateText, Output } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { evidenceStatements, explanationInput, fallbackExplanation } from "@/lib/explanation";
import { getComparison } from "@/lib/data";
export const maxDuration = 20;
export async function POST(request: Request) {
  // Read at most 2 KB, including chunked requests. Never accept geometry or free-form prompts.
  let size = 0;
  let body = "";
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Missing input" }, { status: 400 });
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2048) { await reader.cancel(); return Response.json({ error: "Input too large" }, { status: 413 }); }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  let input;
  try { input = explanationInput.parse(JSON.parse(body)); }
  catch { return Response.json({ error: "Invalid comparison input" }, { status: 400 }); }
  const fallback = () => Response.json({ explanation: fallbackExplanation(input), mode: "deterministic", model: null });
  if (!process.env.AI_GATEWAY_API_KEY) return fallback();
  try {
    const statements = evidenceStatements(input);
    const result = await generateText({
      model: gateway("openai/gpt-4.1-mini"),
      system: "Select the most relevant supplied evidence statement IDs for the selected priority. Include priority, water, gaps and review. You only select IDs: you cannot write facts, change scores or supply numbers.",
      prompt: JSON.stringify({ input, comparison: getComparison(input.month), statements }),
      output: Output.object({ schema: z.object({ statementIds: z.array(z.enum(["priority", "climate", "water", "gaps", "review"])).min(4).max(5) }) }),
      maxOutputTokens: 180,
      abortSignal: AbortSignal.timeout(10_000),
    });
    const ids = [...new Set([...result.output.statementIds, "priority", "water", "gaps", "review"] as const)];
    return Response.json({ explanation: ids.map((id) => statements[id]).join(" "), mode: "ai-generated", model: "openai/gpt-4.1-mini" });
  } catch { return fallback(); }
}
