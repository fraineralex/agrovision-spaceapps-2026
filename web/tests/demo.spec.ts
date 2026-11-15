/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Codex/OpenAI, 2026-11-14; updated for independent section tabs by Claude/Antigravity, 2026-11-14. Frainer review pending. */
import { test,expect,type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function axeSerious(page:Page){ const r=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).exclude(".maplibregl-canvas").analyze(); return r.violations.filter(v=>v.impact==="serious"||v.impact==="critical").map(v=>`${v.id}: ${v.nodes.slice(0,3).map(n=>n.target.join(" ")).join(" | ")}`); }
const rainMock = { source: "open-meteo", kind: "forecast", url: "https://api.open-meteo.com/v1/forecast", fetchedAt: "2026-11-16T12:00:00Z",
  days: ["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21","2026-11-22"].map((date, i) => ({ date, rainMm: i === 3 ? 14 : 0, probPct: i === 3 ? 80 : 10, tMaxC: 31 })) };

test("onboarding and independent sections: recommendations first, rain, market, map, voice and share",async({page})=>{
 test.setTimeout(75_000);
 const errors:string[]=[]; page.on("pageerror",e=>errors.push(e.message));
 await page.route("https://**",r=>r.abort());
 await page.route("**/api/rain**",r=>r.fulfill({json:rainMock}));
 await page.setViewportSize({width:360,height:780});
 await page.clock.setFixedTime(new Date("2026-11-16T14:00:00Z"));
 await page.goto("/");
 const sectionNav=page.getByRole("tablist",{name:/Secciones principales/});
 await expect(sectionNav.getByRole("tab",{name:/Siembra/})).toHaveAttribute("aria-selected","true");
 await expect(page.getByRole("heading",{name:/Elige tu zona/})).toBeVisible();
 await sectionNav.getByRole("tab",{name:/Lluvia/}).click();
 await expect(sectionNav.getByRole("tab",{name:/Lluvia/})).toHaveAttribute("aria-selected","true");
 await page.getByLabel("Provincia para consultar la lluvia").selectOption("San Juan");
 await expect(page.getByRole("list", {name:"Próximos 7 días"})).toContainText("14 mm");
 await page.getByRole("button", {name:"Agregar mi finca", exact:true}).click();
 const ob=page.getByRole("dialog",{name:"Cuéntanos de tu finca"});
 expect(await axeSerious(page)).toEqual([]);
 await ob.getByLabel("Busca un lugar en RD").fill("san juan");
 await ob.getByRole("button",{name:"San Juan",exact:true}).click();
 await ob.getByLabel("Nombre de esta finca").fill("Finca del río");
 await ob.getByRole("button",{name:/Marcar la finca en el mapa/}).click();
 const map=page.getByTestId("farm-picker-map");
 await expect(map).toHaveAttribute("data-ready","true",{timeout:20000});
 await map.scrollIntoViewIfNeeded();
 let bb=(await map.boundingBox())!;
 // Tap two grid cells (multi-select).
 const canvas = map.locator("canvas");
 await canvas.click({ position: { x: 90, y: 220 } });
 await canvas.click({ position: { x: 150, y: 220 } });
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
 for (const [x,y] of [[140,160],[230,160],[230,245],[140,245]]) await canvas.click({ position: { x, y } });
 await expect(page.locator(".picker-draw")).toContainText("4 puntos");
 await ob.getByRole("button",{name:/Cerrar figura/}).click();
 await expect(page.locator(".picker-pieces")).toContainText("Figura dibujada");
 await ob.getByRole("button",{name:/^Listo: /}).click();
 await ob.getByRole("button",{name:/Arroz/}).click();
 await ob.getByRole("button",{name:"Sí",exact:true}).click();
 await ob.getByRole("button",{name:/Listo, ver mi recomendación/}).click();
 await expect(ob).toBeHidden();
 await expect(page.getByRole("tab",{name:/Finca del río/})).toHaveAttribute("aria-selected","true");
 await expect(sectionNav.getByRole("tab",{name:/Siembra/})).toHaveAttribute("aria-selected","true");
 await expect(page.locator(".farm-meta")).toContainText("tareas");
 await expect(page.locator(".recommendation-heading")).toContainText("Después de arroz");
 await expect(page.locator(".recommendation-meta")).toContainText("Cosecha aprox.");
 // Default mode is Agricultor; Supervisor mode unlocks supervision quick bar, GeoJSON export & cost/price details.
 await expect(page.getByRole("button", {name:"Agricultor",exact:true})).toHaveAttribute("aria-pressed", "true");
 await expect(page.getByRole("navigation", {name:"Herramientas de supervisión"})).toBeHidden();
 await page.getByRole("button", {name:"Supervisor",exact:true}).click();
 await expect(page.getByRole("navigation", {name:"Herramientas de supervisión"})).toBeVisible();
 await page.getByRole("button",{name:/¿Para qué sirve Otras opciones/}).click();
 await expect(page.getByRole("region",{name:/Ayuda sobre Otras opciones/})).toBeVisible();
 await page.getByRole("button",{name:"Cerrar ayuda"}).click();
 // Five options: four goals plus keeping the current crop.
 const opts=page.locator(".option-list > li");
 expect(await opts.count()).toBeLessThanOrEqual(5);
 for (const g of ["Menos agua","Precio histórico","Plagas","Sequía"]) await expect(page.locator(".option-list")).toContainText(g);
 // Soil rotation section: why rotating feeds the soil, with FAO sources and no farm measurement claim.
 const soil=page.locator("#rotacion-y-suelo");
 await expect(soil).toContainText("para cuidar la tierra");
 await expect(soil).toContainText("Abono natural");
 await expect(soil.getByRole("link",{name:/FAO/}).first()).toBeVisible();
 await expect(soil).toContainText("no una medición de tu finca");
 const pestSection=page.locator("#plagas-a-vigilar");
 await expect(pestSection).toContainText("Gusano cogollero");
 await expect(pestSection).toContainText("Spodoptera frugiperda");
 await expect(pestSection.getByRole("link").first()).toBeVisible();
 await expect(pestSection).toContainText("No recomendamos pesticidas");
 // Pests are explained from the Dominican guides instead of "no data".
 await expect(page.locator(".option-list")).toContainText("Plagas distintas");
 await expect(page.locator(".option-list")).not.toContainText("Sin datos suficientes");
 await expect(opts.last()).toContainText("Arroz");
 // Share: WhatsApp text fallback link carries the summary.
 const href=await page.getByTestId("wa-link").getAttribute("href");
 expect(decodeURIComponent(href!)).toContain("Finca del río");
 expect(decodeURIComponent(href!)).toContain("Posible lluvia");
 // Sources panel still works.
 await page.locator(".recommendation-hero").getByRole("button",{name:"¿Por qué este cultivo?"}).click();
 await expect(page.getByRole("dialog",{name:/De dónde sale la recomendación/})).toContainText("FAO-56");
 expect(await axeSerious(page)).toEqual([]);
 await page.getByRole("button",{name:/Cerrar/}).click();
 // Independent Lluvia tab (mocked Open-Meteo: Thursday 19 Nov has 14 mm / 80%).
 await sectionNav.getByRole("tab",{name:/Lluvia/}).click();
 await expect(page.locator("#siembra")).toBeHidden();
 await expect(page.locator(".rain-wet")).toContainText("80%");
 expect(await axeSerious(page)).toEqual([]);
 // Venta tab shows the profit calculator and market prices.
 await sectionNav.getByRole("tab", {name:/Venta/}).click();
 await expect(page.locator("#lluvia-esta-semana")).toBeHidden();
 await expect(page.locator("#cuanto-me-deja")).toBeVisible();
 await expect(page.locator("#precio-y-mercado")).toBeVisible();
 await page.getByText("Consultar costos y precios de referencia", {exact:true}).click();
 await page.locator(".profit select").selectOption("habichuela_roja");
 await expect(page.locator(".profit-range")).toContainText("RD$");
 await page.getByLabel("Tareas", {exact:true}).fill("20");
 await expect(page.locator(".profit-lines")).toContainText("20 tareas");
 expect(await axeSerious(page)).toEqual([]);
 // Independent Mapa y clima tab: parcel card, GeoJSON export & FAO drought.
 await sectionNav.getByRole("tab",{name:/Fincas/}).click();
 await expect(page.locator("#cuanto-me-deja")).toBeHidden();
 for (const id of ["tu-finca-en-el-mapa","sequia-y-lluvia"]) await expect(page.locator(`#${id}`)).toBeVisible();
 const downloadEvent = page.waitForEvent("download");
 await page.getByRole("button", {name:"Descargar parcela (GeoJSON)",exact:true}).click();
 expect((await downloadEvent).suggestedFilename()).toMatch(/^parcela-.+\.geojson$/);
 expect(await axeSerious(page)).toEqual([]);
 // Independent Preguntar tab.
 await sectionNav.getByRole("tab",{name:/Ayuda/}).click();
 await expect(page.locator("#tu-finca-en-el-mapa")).toBeHidden();
 await expect(page.getByRole("region", {name:"Asistente de voz"})).toBeVisible();
 expect(await axeSerious(page)).toEqual([]);
 // Switch back to Agricultor + Siembra for clean mobile snapshot check.
 await page.getByRole("button", {name:"Agricultor",exact:true}).click();
 await sectionNav.getByRole("tab",{name:/Siembra/}).click();
 await expect(page.locator("#siembra")).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(() => window.scrollTo(0,0));
 await page.waitForTimeout(180);
 await page.screenshot({path:"test-results/farmer-mobile.png"});
 expect(errors).toEqual([]);
});

for (const province of ["Azua", "La Vega", "Monte Cristi", "Santiago", "Valverde"]) {
 test(`farm picker zooms and supports manual field drawing in ${province}`, async ({ page }) => {
  await page.route("https://**", r => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Agregar mi finca", exact: true }).click();
  const ob = page.getByRole("dialog", { name: "Cuéntanos de tu finca" });
  await ob.getByRole("button", { name: province, exact: true }).click();
  await ob.getByRole("button", { name: /Marcar la finca en el mapa/ }).click();
  const map = page.getByTestId("farm-picker-map");
  await expect(map).toHaveAttribute("data-ready", "true", { timeout: 20000 });
  await expect(ob.getByRole("button", { name: "Ver fincas de San Juan" })).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => (window as unknown as { __farmPicker: { getZoom(): number; getMaxZoom(): number } }).__farmPicker.getZoom())).toBeGreaterThanOrEqual(15);
  expect(await page.evaluate(() => (window as unknown as { __farmPicker: { getMaxZoom(): number } }).__farmPicker.getMaxZoom())).toBe(19);
  await ob.getByRole("button", { name: /Dibujar/ }).click();
  await map.scrollIntoViewIfNeeded();
  const bb = (await map.boundingBox())!;
  for (const [dx, dy] of [[80, 60], [170, 60], [170, 130]]) await page.mouse.click(bb.x + dx, bb.y + dy);
  await ob.getByRole("button", { name: /Cerrar figura/ }).click();
  await expect(page.locator(".picker-pieces")).toContainText("Figura dibujada");
 });
}

test("desktop pairs the planting hero with its metrics and keeps sections independent",async({page})=>{
 await page.route("https://**",r=>r.abort());
 await page.route("**/api/rain**",r=>r.fulfill({json:rainMock}));
 await page.addInitScript(()=>{ localStorage.setItem("agrovision:view-mode","supervisor"); localStorage.setItem("agrovision:farms",JSON.stringify([{id:"f1",name:"Conuco 1",province:"San Juan",location:{longitude:-71.23,latitude:18.8},pieces:[],previous:"arroz",irrigation:"irrigated",crops:["habichuela_roja","maiz","arroz"],sowMonth:11,priority:"water"}])); localStorage.setItem("agrovision:activeFarm","f1"); });
 await page.setViewportSize({width:1280,height:800});
 await page.goto("/");
 const sectionNav=page.getByRole("tablist",{name:/Secciones principales/});
 await expect(sectionNav.getByRole("tab",{name:/Siembra/})).toHaveAttribute("aria-selected","true");
 const board=(await page.locator("#siembra").boundingBox())!;
 const decision=(await page.locator(".recommendation-hero").boundingBox())!;
 const metrics=(await page.locator(".metric-tiles").boundingBox())!;
 const opts=(await page.locator(".options").boundingBox())!;
 expect(decision.width).toBeGreaterThan(board.width * .5);
 expect(metrics.x).toBeGreaterThanOrEqual(decision.x + decision.width);
 expect(metrics.y).toBeCloseTo(decision.y, 0);
 expect(metrics.x + metrics.width).toBeLessThanOrEqual(board.x + board.width + 1);
 expect(board.width).toBeGreaterThan(1200);
 expect(opts.y).toBeGreaterThan(decision.y + decision.height);
 await expect(page.locator("#lluvia-esta-semana")).toBeHidden();
 await expect(page.locator("#cuanto-me-deja")).toBeHidden();
 expect(await axeSerious(page)).toEqual([]);
 await page.screenshot({path:"test-results/farmer-desktop.png"});
 await sectionNav.getByRole("tab",{name:/Venta/}).click();
 await expect(page.locator("#siembra")).toBeHidden();
 const sales=(await page.locator("#cuanto-me-deja").boundingBox())!;
 const market=(await page.locator("#precio-y-mercado").boundingBox())!;
 expect(market.x).toBeGreaterThan(sales.x+sales.width-10);
 await sectionNav.getByRole("tab",{name:/Lluvia/}).click();
 await expect(page.locator("#cuanto-me-deja")).toBeHidden();
 await expect(page.locator("#lluvia-esta-semana")).toBeVisible();
});

test("finds a municipality and a neighborhood, then saves and renames a farm with its records", async ({page}) => {
 await page.route("https://**", route => route.abort());
 await page.route("**/api/rain**", route => route.fulfill({json: rainMock}));
 await page.goto("/");
 await page.getByRole("tablist",{name:/Secciones principales/}).getByRole("tab",{name:/Fincas/}).click();
 const mapSearch = page.getByLabel("Busca un lugar en RD", {exact:true});
 await mapSearch.fill("ensanche naco");
 await page.getByRole("button", {name:/Ensanche Naco.*Distrito Nacional/}).click();
 await expect(page.getByRole("region", {name:"Elige tu zona"}).locator(".place")).toHaveText("Ensanche Naco · Distrito Nacional");
 await expect(mapSearch).toBeFocused();
 await page.getByRole("button", {name:"Agregar mi finca",exact:true}).click();
 const dialog = page.getByRole("dialog", {name:"Cuéntanos de tu finca"});
 await dialog.getByLabel("Busca un lugar en RD").fill("pedro brand");
 await dialog.getByRole("button", {name:/^Pedro Brand Municipio.*Santo Domingo$/}).click();
 await dialog.getByLabel("Nombre de esta finca").fill("La Lomita");
 await expect(dialog.getByText(/maquinaria|pesticida/i)).toHaveCount(0);
 await dialog.getByRole("button", {name:"Seguir sin marcar"}).click();
 await dialog.getByRole("button", {name:/Listo, ver mi recomendación/}).click();
 await page.reload();
 await expect(page.getByRole("tab", {name:"La Lomita"})).toBeVisible();
 const farms = page.getByRole("navigation", {name:"Mis fincas"});
 await expect(farms).toContainText("Pedro Brand, Santo Domingo");
 await expect(farms.getByText(/maquinaria|pesticida/i)).toHaveCount(0);
 await farms.getByRole("button", {name:"Editar"}).click();
 await dialog.getByLabel("Nombre de esta finca").fill("La Lomita Norte");
 await dialog.getByRole("button", {name:"Guardar cambios"}).click();
 await expect(page.getByRole("tab", {name:"La Lomita Norte"})).toBeVisible();
 await page.getByRole("button", {name:"Supervisor",exact:true}).click();
 await page.reload();
 await expect(page.getByRole("button", {name:"Supervisor",exact:true})).toHaveAttribute("aria-pressed", "true");
 await expect(page.getByRole("tab", {name:"La Lomita Norte"})).toBeVisible();
});

test("farm switcher: add a second farm, switch between them, delete one; saved after reload",async({page})=>{
 await page.route("https://**",r=>r.abort());
 await page.route("**/api/rain**",r=>r.fulfill({json:rainMock}));
 await page.addInitScript(()=>{ if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded","1"); localStorage.setItem("agrovision:farms",JSON.stringify([{id:"f1",name:"Conuco 1",province:"San Juan",location:{longitude:-71.23,latitude:18.8},pieces:[],previous:"arroz",irrigation:"irrigated",crops:["habichuela_roja","maiz","arroz"],sowMonth:11,priority:"water"}])); localStorage.setItem("agrovision:activeFarm","f1"); } });
 await page.setViewportSize({width:360,height:780});
 await page.goto("/");
 const farmTabs=page.getByRole("tablist",{name:"Elige una finca"}).getByRole("tab");
 const sectionNav=page.getByRole("tablist",{name:/Secciones principales/});
 await expect(farmTabs.filter({hasText:"Conuco 1"})).toBeVisible();
 await page.getByRole("button",{name:"Agregar finca"}).click();
 const ob=page.getByRole("dialog",{name:"Cuéntanos de tu finca"});
 await ob.getByRole("button",{name:"Santiago",exact:true}).click();
 await ob.getByLabel("Nombre de esta finca").fill("Conuco 2");
 await ob.getByRole("button",{name:"Seguir sin marcar"}).click();
 await ob.getByRole("button",{name:/Habichuela roja/}).click();
 await ob.getByRole("button",{name:"No, de lluvia"}).click();
 await ob.getByRole("button",{name:/Listo, ver mi recomendación/}).click();
 await expect(farmTabs.filter({hasText:"Conuco 2"})).toHaveAttribute("aria-selected","true");
 await expect(page.locator(".profile-line")).toContainText("Santiago");
 await sectionNav.getByRole("tab",{name:/Lluvia/}).click();
 await expect(page.getByText("Cultivo de lluvia", {exact:true})).toBeVisible();
 await farmTabs.filter({hasText:"Conuco 1"}).click();
 await sectionNav.getByRole("tab",{name:/Siembra/}).click();
 await expect(page.locator(".profile-line")).toContainText("San Juan");
 await page.reload();
 await expect(farmTabs).toHaveCount(2);
 await page.getByRole("button",{name:"Borrar",exact:true}).click();
 await page.getByRole("button",{name:"Sí, borrar"}).click();
 await expect(farmTabs).toHaveCount(1);
});
test("grower can keep an old turn or choose their own irrigation date and use the farm tools offline", async ({page,context}) => {
 await page.clock.setFixedTime(new Date("2026-11-16T14:00:00Z"));
 await page.route("https://**", route => route.abort());
 await page.route("**/api/rain**", route => route.fulfill({ json: rainMock }));
 await page.addInitScript(() => {
   if (localStorage.getItem("agrovision:farms")) return;
   localStorage.setItem("agrovision:farms", JSON.stringify([{ id:"f1", name:"Conuco", province:"San Juan", location:{longitude:-71.23, latitude:18.8}, pieces:[], previous:"habichuela_roja", irrigation:"irrigated", crops:["habichuela_roja","maiz"], sowMonth:11, priority:"water", waterTurn:"2026-11-18" }]));
 });
 await page.goto("/");
 const sectionNav=page.getByRole("tablist",{name:/Secciones principales/});
 await sectionNav.getByRole("tab",{name:/Lluvia/}).click();
 await expect(page.getByRole("radio", {name:"Me dan turno"})).toBeChecked();
 await expect(page.getByLabel("Fecha del turno")).toHaveValue("2026-11-18");
 await page.getByLabel("Fecha del turno").fill("2026-11-19");
 await page.getByRole("button", {name:"Guardar fecha"}).click();
 await expect(page.locator(".turn-summary")).toContainText("Turno asignado");
 await page.getByRole("radio", {name:"Yo elijo"}).check();
 await page.getByRole("button", {name:"Guardar fecha"}).click();
 await expect(page.locator(".turn-summary")).toContainText("Fecha elegida");
 await expect(page.locator(".week-turn")).toContainText("14 mm · 80%");
 await sectionNav.getByRole("tab",{name:/Siembra/}).click();
 await page.getByLabel("Mes para comparar").selectOption("12");
 await page.getByLabel("Cultivo para tu plan").selectOption("maiz");
 await page.getByRole("button", {name:"Guardar plan"}).click();
 await expect(page.getByText("Lista para usar sin internet")).toBeVisible();
 await page.unroute("**/api/rain**");
 await context.setOffline(true);
 await page.reload();
 await expect(page.locator(".saved-plan")).toContainText("Maíz en diciembre");
 await expect(page.getByLabel("Mes para comparar")).toHaveValue("12");
 await sectionNav.getByRole("tab",{name:/Lluvia/}).click();
 await expect(page.getByRole("radio", {name:"Yo elijo"})).toBeChecked();
 await expect(page.getByLabel("Fecha de riego")).toHaveValue("2026-11-19");
 await expect(page.getByText(/Copia guardada · hace 2 h/)).toBeVisible();
 await expect(page.locator(".week-turn")).toContainText("Sin pronóstico actualizado");
 await sectionNav.getByRole("tab",{name:/Venta/}).click();
 await page.getByText("Ya tengo mis gastos y cosecha", {exact:true}).click();
 await page.getByLabel("Gasto total (RD$)").fill("25000");
 await page.getByLabel("Cantidad para vender").fill("40");
 await page.getByLabel("Oferta por quintal (RD$)").fill("600");
 await page.getByRole("button", {name:"Calcular precio mínimo"}).click();
 await expect(page.locator(".budget-result")).toContainText("RD$625.00 por quintal");
 await expect(page.locator(".budget-result")).toContainText("Te faltan RD$1,000");
 await sectionNav.getByRole("tab", {name:"Fincas",exact:true}).click();
 await expect(page.locator("#map .maplibregl-canvas")).toBeVisible();
});
test("voice tools, location validation and honest missing-key fallback",async({request})=>{
 const selection={parcelId:"location",location:{longitude:-70.2,latitude:18.8},priority:"balanced",month:11,irrigation:"unconfirmed"};
 const setup=await request.post(`/api/voice/setup?${new URLSearchParams(Object.entries(selection).map(([k,v])=>[k,typeof v === "object"?JSON.stringify(v):String(v)]))}`);
 expect(setup.status()).toBe(503);expect(JSON.stringify(await setup.json())).not.toContain("token");
 const chat=await request.post("/api/voice/chat",{data:{selection,messages:[{role:"user",content:"¿Qué sabes del agua?"}]}});
 expect(chat.headers()["x-agrovision-mode"]).toBe("local");expect(await chat.text()).toContain("Sin conexión con IA");
 const rainChat=await request.post("/api/voice/chat",{data:{selection:{...selection,rainAlert:"Se prevén 14 mm el jueves."},messages:[{role:"user",content:"¿Va a llover?"}]}});
 expect(await rainChat.text()).toContain("Se prevén 14 mm el jueves.");
 const alternative = await request.post("/api/voice/chat", { data: {
  selection: { ...selection, crops: "maiz,habichuela_roja" },
  messages: [{ role: "user", content: "Además del maíz, ¿qué otra cosa me recomiendas?" }],
 } });
 expect(await alternative.text()).toContain("Otra opción es habichuela roja");
 const sowing = await request.post("/api/voice/chat", { data: {
  selection,
  messages: [{ role: "user", content: "En qué mes me conviene sembrar maíz" }],
 } });
 expect(await sowing.text()).toMatch(/histórico nacional.*abril, mayo y junio/);
 expect(sowing.headers()["x-agrovision-mode"]).toBe("data");
 const tool=await request.post("/api/voice/tools",{data:{selection,name:"get_parcel_metrics",args:{}}});
 const data=await tool.json();expect(data.climate.temperatureC).toBe(25.43);expect(data.climateSource.period).toBe("2016–2025");expect(data.ndvi.rows).toHaveLength(0);
 expect((await request.post("/api/voice/tools",{data:{selection,name:"run_command",args:{}}})).status()).toBe(400);
 expect((await request.post("/api/voice/chat",{data:{selection:{...selection,location:{longitude:-72,latitude:19}},messages:[{role:"user",content:"hola"}]}})).status()).toBe(400);
 expect((await request.post("/api/voice/chat",{data:"x".repeat(21_000)})).status()).toBe(400);
 expect((await request.get("/api/climate?longitude=-73&latitude=19")).status()).toBe(400);
 expect((await request.post("/api/voice/tools",{headers:{origin:"https://example.org"},data:{selection,name:"compare_rotations",args:{}}})).status()).toBe(403);
});
test("missing realtime credentials release microphone and preserve text input",async({page})=>{
 await page.addInitScript(()=>{
  Object.assign(window, { SpeechRecognition: undefined, webkitSpeechRecognition: undefined });
  const tracks:MediaStreamTrack[]=[];
  Object.assign(window,{testMicTracks:tracks});
  navigator.mediaDevices.getUserMedia=async ()=>{
    const context = new AudioContext();
    const stream = context.createMediaStreamDestination().stream;
    const track = stream.getAudioTracks()[0];
    tracks.push(track);
    const stop = track.stop.bind(track);
    track.stop = () => { stop(); if (context.state !== "closed") void context.close(); };
    return stream;
  };
 });
 await page.goto("/");
 await page.locator("#voice-dock").scrollIntoViewIfNeeded();
 await page.getByRole("button",{name:"Hablar",exact:true}).click();
 await expect(page.getByText("La conversación en tiempo real no está disponible. Puedes escribir o escuchar el resumen.")).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>{const tracks=(window as unknown as {testMicTracks:MediaStreamTrack[]}).testMicTracks;return tracks.length>0&&tracks.every(track=>track.readyState==="ended");})).toBe(true);
 await page.getByText("Escribir", {exact:true}).click();
 await expect(page.getByLabel("Pregunta sobre esta parcela",{exact:true})).toBeEnabled();
});

test("the Spanish summary can pause, resume, stop and restart", async ({ page }) => {
 await page.addInitScript(() => {
  const calls: string[] = [];
  const synthesis = {
   paused: false,
   cancel() { calls.push("cancel"); },
   pause() { this.paused = true; calls.push("pause"); },
   resume() { this.paused = false; calls.push("resume"); },
   getVoices() { return [{ name: "Voz básica", lang: "es-DO" }, { name: "Natural", lang: "es-MX" }]; },
   speak(utterance: { voice?: { name: string } }) { calls.push(`speak:${utterance.voice?.name}`); },
  };
  Object.defineProperty(window, "speechSynthesis", { value: synthesis });
  Object.assign(window, { SpeechSynthesisUtterance: class {}, summaryCalls: calls });
 });
 await page.goto("/");
 await page.locator("#voice-dock").scrollIntoViewIfNeeded();
 await page.getByRole("button", { name: "Oír resumen" }).click();
 const controls = page.getByRole("group", { name: "Controles del resumen" });
 await controls.getByRole("button", { name: "Pausar" }).click();
 await controls.getByRole("button", { name: "Continuar" }).click();
 await controls.getByRole("button", { name: "Reiniciar" }).click();
 await expect(controls.getByRole("button", { name: "Pausar" })).toBeVisible();
 await controls.getByRole("button", { name: "Detener" }).click();
 await expect(controls).toBeHidden();
 const calls = await page.evaluate(() => (window as unknown as { summaryCalls: string[] }).summaryCalls);
 expect(calls.filter(call => call === "speak:Natural")).toHaveLength(2);
 expect(calls).toEqual(expect.arrayContaining(["pause", "resume", "cancel"]));
});

test("summary prefers generated audio and reuses it on restart", async ({ page }) => {
 await page.addInitScript(() => {
   window.Audio = class {
     play = async () => {};
     pause = () => {};
   } as unknown as typeof Audio;
   Object.defineProperty(window, "speechSynthesis", { value: undefined });
   navigator.mediaDevices.getUserMedia = async () => { throw new Error("Unexpected microphone request"); };
 });
 let requests = 0;
 await page.route("**/api/voice/summary", route => {
   requests++;
   expect(route.request().postDataJSON()).toEqual({ text: expect.any(String) });
   return route.fulfill({ status: 200, contentType: "audio/wav", body: Buffer.from("RIFF") });
 });
 await page.goto("/");
 await page.locator("#voice-dock").scrollIntoViewIfNeeded();
 await page.getByRole("button", { name: "Oír resumen" }).click();
 await expect(page.getByText("AI-generated voice")).toBeVisible();
 const controls = page.getByRole("group", { name: "Controles del resumen" });
 await controls.getByRole("button", { name: "Pausar" }).click();
 await expect(page.getByText("Reading paused")).toBeVisible();
 await controls.getByRole("button", { name: "Continuar" }).click();
 await controls.getByRole("button", { name: "Reiniciar" }).click();
 await expect(page.getByText("AI-generated voice")).toBeVisible();
 await controls.getByRole("button", { name: "Detener" }).click();
 await expect(controls).toBeHidden();
 expect(requests).toBe(1);
});

test("the voice button sends a dictated question without waiting for realtime setup", async ({ page }) => {
 const errors: string[] = [];
 page.on("pageerror", error => errors.push(error.message));
 const setupMethods: string[] = [];
 await page.route(/\/api\/voice\/setup(?:\?|$)/, route => {
  setupMethods.push(route.request().method());
  return route.fulfill({ status: 204 });
 });
 await page.route("**/api/voice/chat", route => {
  expect(route.request().postDataJSON().messages.at(-1).content).toBe("¿Qué siembro?");
  return route.fulfill({ body: "Este es tu resumen." });
 });
 await page.addInitScript(() => {
  navigator.mediaDevices.getUserMedia = async () => new MediaStream();
  Object.assign(window, { SpeechRecognition: class {
   onresult?: (event: unknown) => void;
   onend?: () => void;
   start() { setTimeout(() => { this.onresult?.({ results: [[{ transcript: "¿Qué siembro?" }]] }); this.onend?.(); }, 0); }
   abort() {}
  } });
 });
 await page.goto("/");
 await page.locator("#voice-dock").scrollIntoViewIfNeeded();
 const response = page.waitForResponse("**/api/voice/chat");
 await page.getByRole("button", { name: "Hablar", exact: true }).click();
 expect((await response).ok()).toBe(true);
 await expect(page.getByRole("button", { name: "Hablar", exact: true })).toBeVisible();
 await expect(page.getByRole("region", { name: "Respuesta a tu pregunta" })).toContainText("Este es tu resumen.");
 await expect(page.getByRole("button", { name: "Oír respuesta", exact: true })).toBeVisible();
 expect(setupMethods).toEqual([]);
 expect(errors).toEqual([]);
});

test("the voice button stays outside the main workspace content", async ({page}) => {
 await page.setViewportSize({width:360,height:780});
 await page.addInitScript(() => {
   Object.assign(window, { SpeechRecognition: undefined, webkitSpeechRecognition: undefined });
   navigator.mediaDevices.getUserMedia = () => new Promise(() => {});
 });
 await page.goto("/");
 await page.locator("#voice-dock").scrollIntoViewIfNeeded();
 const start = page.getByRole("button", {name:"Hablar",exact:true});
 await start.click();
 const voice = page.getByRole("region", {name:"Asistente de voz"});
 const stop = voice.getByRole("button", {name:"Colgar",exact:true});
 await expect(voice.getByRole("status")).toHaveText("Conectando…");
 await expect(voice.getByText("Escribir", {exact:true})).toBeHidden();
 await expect(voice.getByText("Sobre el micrófono", {exact:true})).toBeHidden();
 await expect(page.getByRole("dialog")).toHaveCount(0);
 await page.getByRole("tablist",{name:/Secciones principales/}).getByRole("tab",{name:/Venta/}).click();
 const panel = (await page.locator("#panel-venta").boundingBox())!;
 const button = (await stop.boundingBox())!;
 expect(button.y).toBeGreaterThanOrEqual(panel.y + panel.height);
 expect(await axeSerious(page)).toEqual([]);
 await page.screenshot({path:"test-results/voice-mobile.png"});
 await stop.click();
 await expect(voice.getByRole("status")).toHaveText("Micrófono apagado.");
 await expect(voice.getByText("Escribir", {exact:true})).toBeVisible();
 await expect(start).toBeFocused();
});

for (const fixture of [
  { id: "ramon", name: "Ramón", province: "San Juan", location: { longitude: -71.23, latitude: 18.8 }, irrigation: "irrigated", previous: "habichuela_roja", crops: ["habichuela_roja", "maiz", "ajo"], declaredTareas: 10 },
  { id: "carmen", name: "Carmen", province: "La Vega", location: { longitude: -70.74, latitude: 18.91 }, irrigation: "rainfed", previous: "papa", crops: ["papa", "cebolla"], declaredTareas: 8 },
  { id: "arroz", name: "Arroz de Monte Cristi", province: "Monte Cristi", location: { longitude: -71.60, latitude: 19.73 }, irrigation: "irrigated", previous: "arroz", crops: ["arroz", "maiz"], declaredTareas: 40 }
]) {
  test("farmer decision and sale for " + fixture.name, async ({ page }) => {
    test.setTimeout(75_000);
    await page.route("https://**", route => route.abort());
    await page.route("**/api/climate**", route => route.fulfill({ status: 503, json: {} }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.setFixedTime(new Date("2026-11-16T14:00:00Z"));
    await page.addInitScript(farm => {
      localStorage.setItem("agrovision:farms", JSON.stringify([{ ...farm, pieces: [], sowMonth: 11, priority: "water" }]));
      localStorage.setItem("agrovision:activeFarm", farm.id);
    }, fixture);
    await page.goto("/");
    const verdict = page.locator(".recommendation-hero");
    await expect(verdict.locator(".recommendation-heading h2")).not.toContainText(fixture.previous === "papa" ? /^Papa/ : fixture.previous === "arroz" ? /^Arroz/ : /^Habichuela roja/);
    await expect(verdict.locator(".recommendation-meta")).toContainText("2027");
    const tiles = (await page.locator(".metric-tiles").boundingBox())!;
    expect(tiles.y + tiles.height).toBeLessThanOrEqual(844 - 58);
    expect(await axeSerious(page)).toEqual([]);
    if (fixture.id === "ramon") {
      await page.evaluate(() => Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true }));
      await verdict.getByRole("button", { name: "Oír resumen" }).click();
      await expect(page.locator(".decision-reading").getByRole("status")).toHaveText("Voice unavailable");
      const source = verdict.getByRole("button", { name: "¿Por qué este cultivo?" });
      await source.click();
      const dialog = page.getByRole("dialog", { name: /De dónde sale/ });
      const close = dialog.getByRole("button", { name: /Cerrar/ });
      await expect(close).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.locator("a").last()).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(source).toBeFocused();
    }
    await page.getByRole("tab", { name: "Venta", exact: true }).click();
    await expect(page.getByRole("link", { name: "Ver precios del mercado" })).toBeVisible();
    await expect(page.getByLabel("Tareas a sembrar")).toHaveValue(fixture.declaredTareas.toFixed(2));
    for (let step = 0; step < 3; step++) await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel("Cómo quieres indicar el gasto").selectOption("estimate");
    if (fixture.id === "carmen") {
      await expect(page.getByText("No hay datos de secano.", { exact: true })).toBeVisible();
      await page.getByLabel("Cómo quieres indicar el gasto").selectOption("known");
      await page.getByLabel("Gasto total (RD$)").filter({ visible: true }).fill("25000");
    }
    if (fixture.id === "ramon") await expect(page.getByLabel("Semilla (RD$)")).not.toHaveValue("");
    await page.getByRole("button", { name: "Continuar" }).click();
    if (fixture.id !== "ramon") await page.getByLabel(/Cosecha para vender/).fill("100");
    await page.getByRole("button", { name: "Continuar" }).click();
    if (fixture.id === "arroz") await page.locator(".guided-sale").getByLabel(/Oferta por quintal/).fill("4000");
    await page.getByRole("button", { name: "Ver resultado" }).click();
    await expect(page.getByRole("region", { name: "Resultado de la calculadora" })).toContainText("por quintal para no perder");
    expect(await axeSerious(page)).toEqual([]);
    if (fixture.id === "ramon") await page.screenshot({ path: "test-results/calculator-after-390.png" });
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test("farmer screens at " + viewport.width, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route("https://**", route => route.abort());
    await page.goto("/");
    await page.getByRole("button", { name: "Agregar mi finca", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Cuéntanos de tu finca" });
    await dialog.getByRole("button", { name: "San Juan", exact: true }).click();
    await dialog.getByRole("button", { name: /Marcar la finca en el mapa/ }).click();
    await expect(page.getByTestId("farm-picker-map")).toHaveAttribute("data-ready", "true", { timeout: 20000 });
    const done = dialog.getByRole("button", { name: /^Listo/ });
    await expect(done).toBeInViewport();
    await page.screenshot({ path: "test-results/map-after-" + viewport.width + ".png" });
    await dialog.getByRole("button", { name: "Ver fincas de San Juan" }).click();
    await expect(dialog.getByText(/Contornos aproximados por satélite/)).toBeVisible();
    await done.click();
    await dialog.getByRole("button", { name: "Habichuela roja", exact: true }).click();
    await dialog.getByRole("button", { name: "Sí", exact: true }).click();
    await dialog.getByRole("button", { name: /Listo, ver mi recomendación/ }).click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: "test-results/siembra-after-" + viewport.width + ".png" });
    await page.getByRole("tab", { name: "Venta", exact: true }).click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: "test-results/calculator-start-after-" + viewport.width + ".png" });
  });
}


test("Modo sol persists, and the bottom tabs support arrow keys", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Modo sol" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sun");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const siembra = page.getByRole("tab", { name: "Siembra" });
  await siembra.focus();
  await page.keyboard.press("ArrowRight");
  const lluvia = page.getByRole("tab", { name: "Lluvia" });
  await expect(lluvia).toHaveAttribute("aria-selected", "true");
  await expect(lluvia).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Lluvia" })).toBeVisible();
  expect(await axeSerious(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
