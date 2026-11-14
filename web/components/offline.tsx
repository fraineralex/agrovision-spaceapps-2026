/* AI: Codex/OpenAI, 2026-11-14; wording simplified by Claude (Anthropic), 2026-11-14. Frainer review pending. */
"use client";
import { useEffect, useState } from "react";
export function OfflineStatus() {
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").then(async () => {
      const registration = await navigator.serviceWorker.ready;
      const assets = performance.getEntriesByType("resource").map((item) => item.name).filter((url) => new URL(url).origin === location.origin && !url.includes("/api/"));
      registration.active?.postMessage({ type: "CACHE_ASSETS", assets });
      navigator.serviceWorker.addEventListener("message", (event) => { if (event.data === "OFFLINE_READY") setReady(true); });
    }).catch(() => undefined);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online && !ready) return null;
  return <span aria-live="polite" className="offline-pill"><i className="status-dot" />{online ? "Lista para usar sin internet" : "Sin internet: usando datos guardados"}</span>;
}
