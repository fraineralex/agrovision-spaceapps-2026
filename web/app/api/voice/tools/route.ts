/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { z } from "zod";
import { rotationMetrics, toolArguments, voiceSelection } from "@/lib/voice-context";
import { guard, readJson, selectedMetrics } from "@/lib/voice-server";
const schema = z.object({ selection: voiceSelection, name: z.enum(["get_parcel_metrics", "compare_rotations"]), args: toolArguments }).strict();
export async function POST(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  try {
    const input = schema.parse(await readJson(request));
    return Response.json(input.name === "get_parcel_metrics" ? await selectedMetrics(input.selection) : rotationMetrics(input.selection));
  } catch { return Response.json({ error: "Invalid local tool input" }, { status: 400 }); }
}
