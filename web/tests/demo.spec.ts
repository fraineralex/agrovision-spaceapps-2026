/* AI: Codex/OpenAI, 2026-11-14; updated for the farmer advisor by Claude (Anthropic), 2026-11-14. Frainer review pending. */
import { test,expect } from "@playwright/test";
test("first visit onboarding leads to personalized advice that changes with answers",async({page})=>{
 const errors:string[]=[]; page.on("pageerror",e=>errors.push(e.message));
 await page.route("https://**",r=>r.abort());
 await page.setViewportSize({width:360,height:780});
 await page.goto("/");
 const ob=page.getByRole("dialog",{name:"Cuéntanos de tu finca"});
 await expect(ob).toBeVisible();
 await ob.getByRole("button",{name:"Empezar"}).click();
 await ob.getByLabel("O escribe tu provincia").fill("san juan");
 await ob.getByRole("button",{name:"San Juan",exact:true}).click();
 await ob.getByRole("button",{name:/Arroz/}).click();
 await ob.getByRole("button",{name:/Sí, tengo riego/}).click();
 await ob.getByRole("button",{name:/Seguir/}).click();
 await ob.getByRole("button",{name:/Este mes/}).click();
 await ob.getByRole("button",{name:"Ver mi recomendación"}).click();
 await expect(ob).toBeHidden();
 await expect(page.locator(".profile-line")).toContainText("San Juan");
 const verdict=page.locator(".verdict-text");
 await expect(verdict).toContainText("después de arroz");
 await expect(page.locator(".market .price-big")).toContainText("RD$");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // Saved answers: a reload skips onboarding; "Cambiar" reopens it.
 await page.reload();
 await expect(page.locator(".profile-line")).toContainText("San Juan");
 await expect(ob).toBeHidden();
 await page.getByRole("button",{name:"Cambiar"}).click();
 await expect(ob).toBeVisible();
 await ob.getByRole("button",{name:"Saltar"}).click();
 await page.getByRole("button",{name:"Escuchar resumen"}).click();
 await expect(page.getByRole("log")).toContainText("Conviene sembrar");
 await page.screenshot({path:"test-results/farmer-mobile.png",fullPage:true});
 expect(errors).toEqual([]);
});
test("voice tools, location validation and honest missing-key fallback",async({request})=>{
 const selection={parcelId:"location",location:{longitude:-70.2,latitude:18.8},priority:"water",month:11,irrigation:"unconfirmed"};
 const setup=await request.post(`/api/voice/setup?${new URLSearchParams(Object.entries(selection).map(([k,v])=>[k,typeof v === "object"?JSON.stringify(v):String(v)]))}`);
 expect(setup.status()).toBe(503);expect(JSON.stringify(await setup.json())).not.toContain("token");
 const chat=await request.post("/api/voice/chat",{data:{selection,messages:[{role:"user",content:"¿Qué sabes del agua?"}]}});
 expect(chat.headers()["x-agrovision-mode"]).toBe("local");expect(await chat.text()).toContain("Sin conexión con IA");
 const tool=await request.post("/api/voice/tools",{data:{selection,name:"get_parcel_metrics",args:{}}});
 const data=await tool.json();expect(data.climate.temperatureC).toBe(25.43);expect(data.climateSource.period).toBe("2016–2025");expect(data.ndvi.rows).toHaveLength(0);
 expect((await request.post("/api/voice/tools",{data:{selection,name:"run_command",args:{}}})).status()).toBe(400);
 expect((await request.post("/api/voice/chat",{data:{selection:{...selection,location:{longitude:-72,latitude:19}},messages:[{role:"user",content:"hola"}]}})).status()).toBe(400);
 expect((await request.post("/api/voice/chat",{data:"x".repeat(21_000)})).status()).toBe(400);
 expect((await request.get("/api/climate?longitude=-73&latitude=19")).status()).toBe(400);
 expect((await request.post("/api/voice/tools",{headers:{origin:"https://example.org"},data:{selection,name:"compare_rotations",args:{}}})).status()).toBe(403);
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
 await page.getByRole("dialog",{name:"Cuéntanos de tu finca"}).getByRole("button",{name:"Saltar"}).click();
 await page.getByRole("button",{name:"Iniciar conversación"}).click();
 await expect(page.getByText(/No se pudo iniciar la voz|Se cortó la conversación/)).toBeVisible();
 expect(await page.evaluate(()=>{const tracks=(window as unknown as {testMicTracks:MediaStreamTrack[]}).testMicTracks;return tracks.length>0&&tracks.every(track=>track.readyState==="ended");})).toBe(true);
 await expect(page.getByLabel("Pregunta sobre esta parcela",{exact:true})).toBeEnabled();
});
