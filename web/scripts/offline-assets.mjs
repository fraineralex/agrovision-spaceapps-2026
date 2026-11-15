/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
async function list(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? list(path.join(folder, entry.name)) : path.join(folder, entry.name)))).flat();
}
const files = (await list(".next/static")).filter((file) => /\.(js|css|woff2?)$/.test(file)).sort();
const assets = files.map((file) => "/" + file.replaceAll(path.sep, "/").replace(/^\.next\//, "_next/"));
assets.push("/icon.svg", "/images/san-juan-valley-enhanced.png", "/vendor/maplibre-gl-worker.mjs", "/vendor/maplibre-LICENSE.txt", "/data/places-do.json");
const version = createHash("sha256").update(JSON.stringify(assets)).update(await readFile("public/data/manifest.json")).update(await readFile("public/data/places-do.json")).digest("hex").slice(0, 16);
await writeFile("public/offline-assets.json", JSON.stringify(assets));
const template = await readFile("scripts/service-worker.js", "utf8");
await writeFile("public/sw.js", template.replace("__VERSION__", version));
console.log(`Offline shell: ${assets.length} local assets; version ${version}`);
