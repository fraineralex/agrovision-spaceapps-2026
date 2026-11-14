
// AI: Codex/OpenAI, 2026-11-14; Frainer review pending.
import { test, expect } from "@playwright/test";
test("satellite parcel click opens its own card and keeps Esri at farm zoom",async({page})=>{
 const errors:string[]=[];
 const imageryRequests:string[]=[];
 page.on("pageerror",error=>errors.push(error.message));
 page.on("request",request=>{if(request.url().includes("World_Imagery/MapServer/tile/"))imageryRequests.push(request.url());});
 await page.route("https://**",route=>route.abort());
 await page.goto("/");
 await expect(page.locator("#map")).toHaveAttribute("data-loaded","true");
 await page.getByRole("button",{name:"Parcelas San Juan",exact:true}).click();
 await expect.poll(async()=>Number(await page.locator("#map").getAttribute("data-rendered-parcels"))).toBeGreaterThan(0);
 // The center of this view (-71.26, 18.79) lies inside sj-unit-0290.
 await page.waitForTimeout(1200);
 const map=page.locator("#map");const box=await map.boundingBox();
 if(!box)throw new Error("Map bounds missing");
 await map.click({position:{x:box.width/2,y:box.height/2}});
 const card=page.getByRole("article",{name:"Ficha de parcela"});
 await expect(card).toContainText("Parcela aproximada 290");
 await card.getByText("Vegetación observada y límites",{exact:true}).click();
 await expect(card).toContainText("Copernicus Sentinel-2");
 await expect(card.locator("meter")).toHaveCount(35);
 await expect.poll(()=>imageryRequests.some(url=>/\/tile\/1[5-9]\//.test(url))).toBe(true);
 await page.screenshot({path:"test-results/satellite-parcel.png",fullPage:true});
 expect(errors).toEqual([]);
});

test("parcel recommendation is simple and evidence stays collapsed",async({page})=>{
 await page.route("https://**",route=>route.abort());
 await page.goto("/");
 await page.getByLabel("Provincia",{exact:true}).selectOption({label:"San Juan"});
 const recommendation=page.getByRole("region",{name:"Recomendación para la parcela"});
 await expect(recommendation).toContainText("Considera habichuela → maíz");
 await expect(page.locator(".farmer-pillar")).toHaveCount(12);
 await expect(page.getByText(/Estimación preliminar: 433.152/)).not.toBeVisible();
 const card=page.locator('[data-scenario="habichuela_maiz"]');
 await expect(card.getByRole("img",{name:/Plagas: Favorable/})).toBeVisible();
 await card.getByText("Ver detalles",{exact:true}).click();
 await expect(card).toContainText("433.152 mm/secuencia");
 await expect(card).toContainText("Santo Domingo");
 await expect(card).toContainText("IDIAF");
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"test-results/farmer-recommendation.png",fullPage:true});
});
