/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
"use client";
import { useEffect, useState } from "react";
export function OfflineStatus() {
  const [status, setStatus] = useState("Local demo data");
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").then(async () => {
      const registration = await navigator.serviceWorker.ready;
      const assets = performance.getEntriesByType("resource").map((item) => item.name).filter((url) => new URL(url).origin === location.origin && !url.includes("/api/"));
      registration.active?.postMessage({ type: "CACHE_ASSETS", assets });
      navigator.serviceWorker.addEventListener("message", (event) => { if (event.data === "OFFLINE_READY") setStatus("Offline case saved"); });
    }).catch(() => setStatus("Local data · offline reload unavailable"));
  }, []);
  return <span aria-live="polite"><i className="status-dot" />{status}</span>;
}
