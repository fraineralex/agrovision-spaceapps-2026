/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([...nextVitals, ...nextTs, globalIgnores([".next/**", "node_modules/**", "public/vendor/**", "public/sw.js", "test-results/**", "playwright-report/**"]) ]);
