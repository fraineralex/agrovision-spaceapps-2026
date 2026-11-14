/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. Copies upstream BSD-3-Clause code unchanged. */
import { copyFile, mkdir } from "node:fs/promises";
await mkdir("public/vendor", { recursive: true });
await copyFile("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/vendor/maplibre-gl-worker.mjs");
await copyFile("node_modules/maplibre-gl/LICENSE.txt", "public/vendor/maplibre-LICENSE.txt");
