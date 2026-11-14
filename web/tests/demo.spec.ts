/* AI: Codex/OpenAI, 2026-11-14; updated for the farmer advisor by Claude (Anthropic), 2026-11-14. Frainer review pending. */
import { test,expect,type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function axeSerious(page:Page){ const r=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).exclude(".maplibregl-canvas").analyze(); return r.violations.filter(v=>v.impact==="serious"||v.impact==="critical").map(v=>`${v.id}: ${v.nodes.slice(0,3).map(n=>n.target.join(" ")).join(" | ")}`); }
const rainMock = { source: "open-meteo", kind: "forecast", url: "https://api.open-meteo.com/v1/forecast", fetchedAt: "2026-11-14T12:00:00Z",
  days: ["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21","2026-11-22"].map((date, i) => ({ date, rainMm: i === 3 ? 14 : 0, probPct: i === 3 ? 80 : 10, tMaxC: 31 })) };

test("onboarding: mark farm by tapping, dragging and drawing; then advice, rain, profit and share",async({page})=>{
 const errors:string[]=[]; page.on("pageerror",e=>errors.push(e.message));
 await page.route("https://**",r=>r.abort());
 await page.route("**/api/rain**",r=>r.fulfill({json:rainMock}));
 await page.setViewportSize({width:360,height:780});
 await page.goto("/");
 const ob=page.getByRole("dialog",{name:"Cuéntanos de tu finca"});
 expect(await axeSerious(page)).toEqual([]);
 await ob.getByLabel("O escribe tu provincia").fill("san juan");
 await ob.getByRole("button",{name:"San Juan",exact:true}).click();
 await ob.getByLabel("Nombre de esta finca").fill("Finca del río");
 const map=page.getByTestId("farm-picker-map");
 await expect(map).toHaveAttribute("data-ready","true",{timeout:20000});
 await map.scrollIntoViewIfNeeded();
 let bb=(await map.boundingBox())!;
 // Tap two grid cells (multi-select).
 await page.mouse.click(bb.x+bb.width/2,bb.y+60); await page.mouse.click(bb.x+bb.width/2+60,bb.y+60);
 await expect(page.locator(".picker-total")).toContainText("Marcado: 8,0 tareas");
 // Drag a box to select a range of cells.
 await ob.getByRole("button",{name:/Arrastrar/}).click();
 bb=(await map.boundingBox())!;
 await page.mouse.move(bb.x+30,bb.y+120); await page.mouse.down(); await page.mouse.move(bb.x+150,bb.y+200,{steps:6}); await page.mouse.up();
 const afterBox=await page.locator(".picker-total").innerText();
 expect(afterBox).not.toContain("8,0 tareas");
 // Draw a polygon by tapping corners.
 await ob.getByRole("button",{name:/Dibujar/}).click();
 bb=(await map.boundingBox())!;
 for (const [dx,dy] of [[200,110],[300,110],[300,180],[200,180]]) await page.mouse.click(bb.x+dx,bb.y+dy);
 await expect(page.locator(".picker-draw")).toContainText("4 puntos");
 await ob.getByRole("button",{name:/Cerrar figura/}).click();
 await expect(page.locator(".picker-pieces")).toContainText("Figura dibujada");
 await ob.getByRole("button",{name:/^Listo: /}).click();
 await ob.getByRole("button",{name:/Arroz/}).click();
 await ob.getByRole("button",{name:"Sí",exact:true}).click();
 await ob.getByRole("button",{name:/Listo, ver mi recomendación/}).click();
 await expect(ob).toBeHidden();
 await expect(page.getByRole("tab",{name:/Finca del río/})).toHaveAttribute("aria-selected","true");
 await expect(page.locator(".farm-meta")).toContainText("tareas");
 await expect(page.locator(".verdict-text")).toContainText("después de arroz");
 // Rain alert (mocked Open-Meteo): Thursday 19 Nov has 14 mm.
 await expect(page.getByText(/No riegues el jueves/).first()).toBeVisible();
 // Five options: four goals plus keeping the current crop.
 const opts=page.locator(".option-list > li");
 await expect(opts).toHaveCount(5);
 for (const g of ["Gastar menos agua","Vender a mejor precio","Tener menos plagas","Aguantar la sequía"]) await expect(page.locator(".option-list")).toContainText(g);
 await expect(opts.last()).toContainText("Arroz");
 // All panels are open: map, market, drought and voice visible without clicks.
 for (const id of ["tu-finca-en-el-mapa","cuanto-me-deja","precio-y-mercado","sequia-y-lluvia","voz"]) await expect(page.locator(`#${id}`)).toBeVisible();
 // Profit calculator.
 await expect(page.locator(".profit-range")).toContainText("RD$");
 await page.getByLabel("Tareas").fill("20");
 await expect(page.locator(".profit-lines")).toContainText("20 tareas");
 // Share: WhatsApp text fallback link carries the summary.
 const href=await page.getByTestId("wa-link").getAttribute("href");
 expect(decodeURIComponent(href!)).toContain("Finca del río");
 expect(decodeURIComponent(href!)).toContain("No riegues");
 // Sources panel still works.
 await page.locator(".verdict").getByRole("button",{name:/De dónde sale esto/}).click();
 await expect(page.getByRole("dialog",{name:/De dónde sale la recomendación/})).toContainText("FAO-56");
 expect(await axeSerious(page)).toEqual([]);
 await page.getByRole("button",{name:/Cerrar/}).click();
 expect(await axeSerious(page)).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"test-results/farmer-mobile.png",fullPage:true});
 expect(errors).toEqual([]);
});

test("desktop uses two columns with the map near the top",async({page})=>{
 await page.route("https://**",r=>r.abort());
 await page.route("**/api/rain**",r=>r.fulfill({json:rainMock}));
 await page.addInitScript(()=>{ localStorage.setItem("agrovision:farms",JSON.stringify([{id:"f1",name:"Conuco 1",province:"San Juan",location:{longitude:-71.23,latitude:18.8},pieces:[],previous:"arroz",irrigation:"irrigated",crops:["habichuela_roja","maiz","arroz"],sowMonth:11,priority:"water"}])); localStorage.setItem("agrovision:activeFarm","f1"); });
 await page.setViewportSize({width:1280,height:800});
 await page.goto("/");
 const map=(await page.locator("#tu-finca-en-el-mapa").boundingBox())!; const adv=(await page.locator(".verdict").boundingBox())!;
 expect(map.x).toBeGreaterThan(adv.x+adv.width-10);
 expect(map.y).toBeLessThan(800);
 expect(await axeSerious(page)).toEqual([]);
});

test("farm switcher: add a second farm, switch between them, delete one; saved after reload",async({page})=>{
 await page.route("https://**",r=>r.abort());
 await page.route("**/api/rain**",r=>r.fulfill({json:rainMock}));
 await page.addInitScript(()=>{ if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded","1"); localStorage.setItem("agrovision:farms",JSON.stringify([{id:"f1",name:"Conuco 1",province:"San Juan",location:{longitude:-71.23,latitude:18.8},pieces:[],previous:"arroz",irrigation:"irrigated",crops:["habichuela_roja","maiz","arroz"],sowMonth:11,priority:"water"}])); localStorage.setItem("agrovision:activeFarm","f1"); } });
 await page.setViewportSize({width:360,height:780});
 await page.goto("/");
 await expect(page.getByRole("tab",{name:/Conuco 1/})).toBeVisible();
 await page.getByRole("button",{name:"Agregar finca"}).click();
 const ob=page.getByRole("dialog",{name:"Cuéntanos de tu finca"});
 await ob.getByRole("button",{name:"Santiago",exact:true}).click();
 await ob.getByLabel("Nombre de esta finca").fill("Conuco 2");
 await ob.getByRole("button",{name:"Saltar este paso"}).click();
 await ob.getByRole("button",{name:/Habichuela roja/}).click();
 await ob.getByRole("button",{name:"No, de lluvia"}).click();
 await ob.getByRole("button",{name:/Listo, ver mi recomendación/}).click();
 await expect(page.getByRole("tab",{name:/Conuco 2/})).toHaveAttribute("aria-selected","true");
 await expect(page.locator(".profile-line")).toContainText("Santiago");
 await page.getByRole("tab",{name:/Conuco 1/}).click();
 await expect(page.locator(".profile-line")).toContainText("San Juan");
 await page.reload();
 await expect(page.getByRole("tab")).toHaveCount(2);
 await page.getByRole("button",{name:"Borrar",exact:true}).click();
 await page.getByRole("button",{name:"Sí, borrar"}).click();
 await expect(page.getByRole("tab")).toHaveCount(1);
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
