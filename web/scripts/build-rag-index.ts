/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
import fs from "node:fs";
import path from "node:path";
import { corpusDocs } from "../lib/rag-corpus";
import { chunkDocument, type RagChunkMeta } from "../lib/rag-chunk";
import { EMBEDDING_MODEL_PRIMARY, RAG_INDEX_PATH } from "../lib/rag-config";
import { embedTexts } from "../lib/rag";

function roundVector(v: number[], digits = 5) {
  const f = 10 ** digits;
  return v.map(x => Math.round(x * f) / f);
}

function readBody(doc: (typeof corpusDocs)[number]): string {
  const raw = fs.readFileSync(doc.absolutePath, "utf8");
  if (doc.filePath.endsWith(".json")) {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (doc.id === "market-insights") {
      return marketInsightsText(data);
    }
    if (doc.id === "fao-giews") {
      return faoGiewsText(data);
    }
    if (doc.id === "farmer-pillars") {
      return JSON.stringify(data.waterClimate ?? data, null, 2);
    }
    return JSON.stringify(data, null, 2);
  }
  return raw;
}

function marketInsightsText(data: Record<string, unknown>) {
  const lines: string[] = [];
  const limits = data.limits;
  if (Array.isArray(limits)) lines.push("Límites: " + limits.join(" "));
  const sources = data.sources as Record<string, string> | undefined;
  if (sources) lines.push("Fuentes de precios y costos: " + JSON.stringify(sources));
  const crops = data.crops as Record<string, Record<string, unknown>> | undefined;
  if (crops) {
    for (const [id, crop] of Object.entries(crops)) {
      const parts = [
        `Cultivo ${id}`,
        crop.sowing ? `Siembra nacional (meses): ${JSON.stringify(crop.sowing)}` : "",
        crop.cost2019 ? `Costo 2019 por tarea (riego): ${JSON.stringify(crop.cost2019)}` : "",
        crop.latest ? `Precio mayorista reciente: ${JSON.stringify(crop.latest)}` : "",
        crop.bestSellMonths ? `Mejores meses de venta (índice): ${JSON.stringify(crop.bestSellMonths)}` : "",
      ].filter(Boolean);
      lines.push(parts.join(". "));
    }
  }
  return lines.join("\n\n");
}

function faoGiewsText(data: Record<string, unknown>) {
  const lines: string[] = [];
  const limits = data.limits;
  if (Array.isArray(limits)) lines.push(String(limits.join(" ")));
  const provinces = data.provinces as Array<Record<string, unknown>> | undefined;
  if (provinces) {
    for (const p of provinces) {
      const asi = p.asi as { value?: number; date?: string } | undefined;
      const vhi = (p.weightedVhi ?? p.vhi) as { value?: number; date?: string } | undefined;
      lines.push(
        `Provincia ${p.name}: ASI ${asi?.value ?? "?"} (${asi?.date ?? "?"}), VHI ${vhi?.value ?? "?"} (${vhi?.date ?? "?"}). ${p.summary ?? ""}`,
      );
    }
  }
  return lines.join("\n");
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("AI_GATEWAY_API_KEY is required to build the RAG index.");
    process.exit(1);
  }
  const metas: RagChunkMeta[] = [];
  for (const doc of corpusDocs) {
    if (!fs.existsSync(doc.absolutePath)) {
      console.warn("Skip missing:", doc.filePath);
      continue;
    }
    const body = readBody(doc);
    metas.push(...chunkDocument(doc, body));
  }
  if (!metas.length) {
    console.error("No chunks produced.");
    process.exit(1);
  }
  const texts = metas.map(m => m.text);
  const batch = 16;
  const vectors: number[][] = [];
  let modelUsed: string = EMBEDDING_MODEL_PRIMARY;
  for (let i = 0; i < texts.length; i += batch) {
    const slice = texts.slice(i, i + batch);
    const { vectors: batchVectors, model } = await embedTexts(slice);
    modelUsed = model;
    vectors.push(...batchVectors);
    console.log(`Embedded ${Math.min(i + batch, texts.length)}/${texts.length} (${model})`);
  }
  const chunks = metas.map((meta, i) => ({
    meta,
    vector: roundVector(vectors[i] ?? []),
  }));
  const out = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    embeddingModel: modelUsed,
    dimensions: chunks[0]?.vector.length ?? 0,
    chunkCount: chunks.length,
    chunks,
  };
  const outPath = path.join(process.cwd(), RAG_INDEX_PATH);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out));
  const mb = Buffer.byteLength(JSON.stringify(out), "utf8") / (1024 * 1024);
  console.log(`Wrote ${out.chunkCount} chunks to ${outPath} (${mb.toFixed(2)} MB, model ${modelUsed})`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});