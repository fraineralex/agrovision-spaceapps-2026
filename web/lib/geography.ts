/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { z } from "zod";
import { isInCountry } from "./geography-core";

export * from "./geography-core";

export const locationSchema = z.object({ longitude: z.number().finite().min(-72.1).max(-68), latitude: z.number().finite().min(17.4).max(20) }).strict().refine(isInCountry, "Selecciona un punto terrestre de República Dominicana");
