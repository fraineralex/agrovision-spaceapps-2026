/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/voice/chat": ["./data/rag-index.json"],
    "/api/voice/tools": ["./data/rag-index.json"],
  },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};
export default nextConfig;
