/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import { z } from "zod";
import { rotationMetrics, toolArguments, voiceSelection } from "@/lib/voice-context";
import { guard, readJson, searchGuides, selectedMetrics } from "@/lib/voice-server";
const searchArgs = z.object({ query: z.string().min(2).max(500) }).strict();
const schema = z.object({
  selection: voiceSelection,
  name: z.enum(["get_parcel_metrics", "compare_rotations", "search_guides"]),
  args: z.union([toolArguments, searchArgs]),
}).strict();
export async function POST(request: Request) {
  const blocked = guard(request); if (blocked) return blocked;
  try {
    const input = schema.parse(await readJson(request));
    if (input.name === "get_parcel_metrics") return Response.json(await selectedMetrics(input.selection));
    if (input.name === "compare_rotations") return Response.json(rotationMetrics(input.selection));
  const args = searchArgs.parse(input.args);
  return Response.json(await searchGuides(args.query));
  } catch { return Response.json({ error: "Invalid local tool input" }, { status: 400 }); }
}
