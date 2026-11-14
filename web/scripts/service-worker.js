/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
const CACHE = "agrovision-case-__VERSION__";
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch("/data/manifest.json");
    const manifest = await response.json();
    const assetList = await (await fetch("/offline-assets.json")).json();
    await cache.addAll([...assetList, "/", "/data/manifest.json", ...manifest.files.map((file) => `/data/${file}`)]);
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith("agrovision-case-") && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_ASSETS") return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const assets = event.data.assets.filter((url) => new URL(url).origin === self.location.origin);
    await Promise.all(assets.map(async (url) => { try { await cache.add(url); } catch { /* An optional asset may disappear during a build. */ } }));
    event.source?.postMessage("OFFLINE_READY");
  })());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      return (await cache.match(event.request)) || (event.request.mode === "navigate" ? await cache.match("/") : undefined) || Response.error();
    }
  })());
});
