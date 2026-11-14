/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { test,expect } from "@playwright/test";
test("national selection, sourced climate, Spanish comparison and offline reload",async({page,context})=>{
 const errors:string[]=[]; page.on("pageerror",e=>errors.push(e.message));
 await page.route("https://**",r=>r.abort());
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Tu tierra. Tu próxima cosecha."})).toBeVisible();
 await expect(page.getByLabel("Provincia",{exact:true}).locator("option")).toHaveCount(33);
 await expect(page.locator(".climate-val").first()).toHaveText("25.43 °C");
 await page.getByLabel("Provincia",{exact:true}).selectOption({label:"Santiago"});
 await expect(page.locator(".climate-val").first()).not.toHaveText("25.43 °C");
 await expect(page.locator(".climate-val")).toHaveCount(3);
 await page.getByLabel("Buscar provincia").fill("romana");
 await expect(page.getByLabel("Provincia",{exact:true}).locator("option")).toHaveCount(3);
 await page.getByLabel("Provincia",{exact:true}).selectOption({label:"La Romana"});
 await page.getByLabel("Buscar provincia").fill("");
 await expect(page.locator("#map")).toHaveAttribute("data-loaded","true");
 await expect(page.locator("[data-scenario]").first()).not.toHaveAttribute("data-scenario","baseline");
 await page.getByLabel("Prioridad",{exact:true}).selectOption("market");
 await expect(page.locator("[data-scenario]").first()).toHaveAttribute("data-scenario","baseline");
 await page.getByRole("button",{name:"Escuchar resumen"}).click();
 await expect(page.getByRole("log")).toContainText("FAO-56 de 1998");
 await expect(page.getByText("Caso guardado sin conexión")).toBeVisible();
 await expect.poll(()=>page.evaluate(async()=>Boolean(await caches.match("/data/power/-70.200,18.800.json")))) .toBe(true);
 await context.setOffline(true);await page.reload();
 await expect(page.getByRole("heading",{name:"Tu tierra. Tu próxima cosecha."})).toBeVisible();
 await page.getByLabel("Provincia",{exact:true}).selectOption({label:"Santiago"});
 await expect(page.locator(".climate-val")).toHaveCount(3);
 await page.getByText("Explorar áreas de ejemplo · San Juan",{exact:true}).click();
 await page.getByRole("button",{name:"Área B",exact:true}).click();
 await expect(page.getByText("Vegetación observada · área de ejemplo")).toBeVisible();
 await page.screenshot({path:"test-results/offline-desktop.png",fullPage:true});
 expect(errors).toEqual([]);
});
test("voice tools, location validation and honest missing-key fallback",async({request})=>{
 const selection={parcelId:"location",location:{longitude:-70.2,latitude:18.8},priority:"water",month:11,irrigation:"unconfirmed"};
 const setup=await request.post(`/api/voice/setup?${new URLSearchParams(Object.entries(selection).map(([k,v])=>[k,typeof v === "object"?JSON.stringify(v):String(v)]))}`);
 expect(setup.status()).toBe(503);expect(JSON.stringify(await setup.json())).not.toContain("token");
 const chat=await request.post("/api/voice/chat",{data:{selection,messages:[{role:"user",content:"¿Qué sabes del agua?"}]}});
 expect(chat.headers()["x-agrovision-mode"]).toBe("local");expect(await chat.text()).toContain("No tengo conexión con IA");
 const tool=await request.post("/api/voice/tools",{data:{selection,name:"get_parcel_metrics",args:{}}});
 const data=await tool.json();expect(data.climate.temperatureC).toBe(25.43);expect(data.climateSource.period).toBe("2016–2025");expect(data.ndvi.rows).toHaveLength(0);
 expect((await request.post("/api/voice/tools",{data:{selection,name:"run_command",args:{}}})).status()).toBe(400);
 expect((await request.post("/api/voice/chat",{data:{selection:{...selection,location:{longitude:-72,latitude:19}},messages:[{role:"user",content:"hola"}]}})).status()).toBe(400);
 expect((await request.post("/api/voice/chat",{data:"x".repeat(21_000)})).status()).toBe(400);
 expect((await request.get("/api/climate?longitude=-73&latitude=19")).status()).toBe(400);
 expect((await request.post("/api/voice/tools",{headers:{origin:"https://example.org"},data:{selection,name:"compare_rotations",args:{}}})).status()).toBe(403);
});
test("mobile controls fit viewport and text fallback stays Spanish",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto("/");
 await expect(page.locator("[data-scenario]")).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByLabel("Pregunta sobre esta parcela",{exact:true}).fill("¿Puedes predecir mis plagas?");
 await page.getByRole("button",{name:"Enviar →"}).click();
 await expect(page.getByRole("log")).toContainText("no predigo plagas ni rendimiento");
 await page.screenshot({path:"test-results/mobile.png",fullPage:true});
});

test("missing realtime credentials release microphone and preserve text input",async({page,context})=>{
 await context.grantPermissions(["microphone"]);
 await page.addInitScript(()=>{
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const tracks:MediaStreamTrack[]=[];
  Object.assign(window,{testMicTracks:tracks});
  navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await original(constraints);tracks.push(...stream.getTracks());return stream;};
 });
 await page.goto("/");
 await page.getByRole("button",{name:"Iniciar conversación"}).click();
 await expect(page.getByText(/Voz no disponible/)).toBeVisible();
 expect(await page.evaluate(()=>{const tracks=(window as unknown as {testMicTracks:MediaStreamTrack[]}).testMicTracks;return tracks.length>0&&tracks.every(track=>track.readyState==="ended");})).toBe(true);
 await expect(page.getByLabel("Pregunta sobre esta parcela",{exact:true})).toBeEnabled();
});
