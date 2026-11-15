/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import { test, expect, type Locator } from "@playwright/test";

async function selectCustom(trigger: Locator, option: string | RegExp) {
  await trigger.click();
  await trigger.locator("..").getByRole("option", { name: option }).click();
}

test("browser language, saved choice, explicit URL and in-progress form", async ({ browser }) => {
  const context = await browser.newContext({ locale: "es-DO", baseURL: "http://localhost:3210", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-DO");
  await page.getByRole("button", { name: "Agregar mi finca" }).click();
  const dialog = page.getByRole("dialog", { name: "Cuéntanos de tu finca" });
  await dialog.getByRole("searchbox").fill("Azua");
  await dialog.getByLabel("Idioma").selectOption("en");
  await expect(page).toHaveURL(/\/en$/);
  const englishDialog = page.getByRole("dialog", { name: "Tell us about your farm" });
  await expect(englishDialog.getByRole("searchbox")).toHaveValue("Azua");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await englishDialog.getByRole("button", { name: "Skip" }).click();
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await page.goto("/es");
  await expect(page.getByRole("heading", { name: "¿Qué siembro ahora?" })).toBeVisible();
  await context.close();
});

test("assistant calendar returns the requested language and rejects unsupported locales", async ({ request }) => {
  const selection = { parcelId: "demo-01", month: 1, irrigation: "irrigated", priority: "balanced", previousCrop: "habichuela_roja", crops: "maiz,yuca" };
  for (const [locale, question, expected] of [["en", "When should I plant maize?", /maize/i], ["es", "¿Cuándo siembro maíz?", /maíz/i]] as const) {
    const response = await request.post("/api/voice/chat", { data: { selection, locale, messages: [{ role: "user", content: question }] } });
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["x-agrovision-mode"]).toBe("data");
    expect(await response.text()).toMatch(expected);
  }
  const invalid = await request.post("/api/voice/chat", { data: { selection, locale: "fr", messages: [{ role: "user", content: "When should I plant maize?" }] } });
  expect(invalid.status()).toBe(400);
});

test("assistant text questions follow the selected language", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("tab", { name: "Help" }).click();
  const voice = page.getByRole("region", { name: "Voice assistant" });
  await voice.getByLabel("Question about this field").fill("When should I plant maize?");
  await voice.getByRole("button", { name: "Send" }).click();
  await expect(voice.getByRole("log")).toContainText(/maize/i);
  await page.getByLabel("Language").selectOption("es");
  await expect(page).toHaveURL(/\/es$/);
  const spanishVoice = page.getByRole("region", { name: "Asistente de voz" });
  await spanishVoice.getByLabel("Pregunta sobre esta parcela").fill("¿Cuándo siembro maíz?");
  await spanishVoice.getByRole("button", { name: "Enviar" }).click();
  await expect(spanishVoice.getByRole("log")).toContainText(/maíz/i);
});

test("dictation follows the selected language after switching", async ({ page }) => {
  await page.addInitScript(() => {
    class MockRecognition {
      lang = "";
      onresult = null;
      onerror = null;
      onend = null;
      start() { (window as unknown as { recognitionLanguage: string }).recognitionLanguage = this.lang; }
      stop() {}
      abort() {}
    }
    Object.defineProperty(window, "SpeechRecognition", { value: MockRecognition, configurable: true });
  });
  await page.goto("/en");
  await page.getByRole("button", { name: "Speak", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { recognitionLanguage: string }).recognitionLanguage)).toBe("en-US");
  await page.getByLabel("Language").selectOption("es");
  await expect(page.getByRole("button", { name: "Hablar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hablar", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { recognitionLanguage: string }).recognitionLanguage)).toBe("es-DO");
});

test("recommendation crop and labels switch without changing the selection", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "San Juan", exact: true }).click();
  const advisor = page.locator(".advisor");
  await expect(advisor.getByText("Recomendado")).toBeVisible();
  const cropIcon = advisor.locator(".recommendation-heading .crop-illustration");
  await expect(cropIcon).toBeVisible();
  const spanish = await advisor.locator(".recommendation-heading h2").innerText();
  await page.getByLabel("Idioma").selectOption("en");
  await expect(page).toHaveURL(/\/en$/);
  await expect(advisor.getByText("Recommended")).toBeVisible();
  const english = await advisor.locator(".recommendation-heading h2").innerText();
  const pairs: Record<string, string> = { "Habichuela roja": "Red beans", "Habichuela negra": "Black beans", "Maíz": "Maize", "Arroz": "Rice", "Batata": "Sweet potato", "Yuca": "Cassava", "Plátano": "Plantain", "Guineo": "Banana", "Tomate": "Tomato", "Ají": "Pepper", "Auyama": "Squash" };
  expect(english).toBe(pairs[spanish]);
  await page.getByLabel("Language").selectOption("es");
  await expect(advisor.locator(".recommendation-heading h2")).toHaveText(spanish);
});

test("recommendation sources switch language while retaining the same evidence links", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "San Juan", exact: true }).click();
  await page.getByRole("button", { name: "¿Por qué este cultivo?" }).click();
  const dialog = page.getByRole("dialog", { name: /De dónde sale la recomendación/ });
  await expect(dialog.getByRole("heading", { name: /El detalle y las fuentes/ })).toBeVisible();
  const linksBefore = await dialog.locator("a[href]").evaluateAll(items => items.map(item => (item as HTMLAnchorElement).href).sort());
  await dialog.getByLabel("Idioma").selectOption("en");
  const english = page.getByRole("dialog", { name: /Where the recommendation/ });
  await expect(english.getByRole("heading", { name: "Details and sources" })).toBeVisible();
  await expect(english.getByRole("heading", { name: /^Water:/ })).toBeVisible();
  await expect(english.getByRole("heading", { name: /^Drought:/ })).toBeVisible();
  await expect(english.getByRole("heading", { name: /^Pests:/ })).toBeVisible();
  await expect(english.getByRole("heading", { name: /^Price:/ })).toBeVisible();
  expect(await english.locator("a[href]").evaluateAll(items => items.map(item => (item as HTMLAnchorElement).href).sort())).toEqual(linksBefore);
  await english.getByLabel("Language").selectOption("es");
  await expect(page.getByRole("dialog", { name: /De dónde sale la recomendación/ }).getByRole("heading", { name: "El detalle y las fuentes" })).toBeVisible();
});

test("rain forecast labels and dates switch without changing the measurements", async ({ page }) => {
  const forecast = { source: "open-meteo", kind: "forecast", model: "gfs_global", url: "https://open-meteo.com", fetchedAt: "2026-11-16T12:00:00Z", days: Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-${String(16 + i).padStart(2, "0")}`, rainMm: i === 0 ? 14 : 0, probPct: i === 0 ? 80 : 10, tMaxC: 31 })) };
  await page.clock.setFixedTime(new Date("2026-11-16T14:00:00Z"));
  await page.route("**/api/rain**", route => route.fulfill({ json: forecast }));
  await page.goto("/es");
  await page.getByRole("tab", { name: "Lluvia" }).click();
  await selectCustom(page.getByRole("combobox", { name: "Provincia para consultar la lluvia" }), "San Juan");
  await expect(page.getByRole("list", { name: "Próximos 7 días" })).toContainText("14");
  await expect(page.locator(".rain-summary-pill")).toContainText("80%");
  await page.getByLabel("Idioma").selectOption("en");
  await expect(page.getByRole("heading", { name: "This week's rain" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Next 7 days" })).toContainText("14");
  await expect(page.locator(".rain-summary-pill")).toContainText("80%");
  await expect(page.locator(".rain-summary-pill")).toContainText("Possible rain");
  await page.getByLabel("Language").selectOption("es");
  await expect(page.locator(".rain-summary-pill")).toContainText("Posible lluvia");
});

test("provincial drought card retains sources and measurements when changing language", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "San Juan", exact: true }).click();
  await page.getByRole("tab", { name: "Fincas" }).click();
  const spanish = page.getByRole("region", { name: "Sequía provincial FAO" });
  await expect(spanish).toBeVisible();
  await spanish.getByText(/¿De dónde salen estos datos\?/).click();
  const links = await spanish.locator("a[href]").evaluateAll(items => items.map(item => (item as HTMLAnchorElement).href).sort());
  const rings = await spanish.locator(".mini-ring-arc").evaluateAll(items => items.map(item => item.getAttribute("stroke-dashoffset")));
  await page.getByLabel("Idioma").selectOption("en");
  const english = page.getByRole("region", { name: "FAO provincial drought" });
  await expect(english.getByRole("heading", { name: "Drought alert" })).toBeVisible();
  expect(await english.locator("a[href]").evaluateAll(items => items.map(item => (item as HTMLAnchorElement).href).sort())).toEqual(links);
  expect(await english.locator(".mini-ring-arc").evaluateAll(items => items.map(item => item.getAttribute("stroke-dashoffset")))).toEqual(rings);
});

test("sale calculators retain inputs and results across languages", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("tab", { name: "Venta" }).click();
  const guided = page.locator(".guided-sale");
  await guided.getByLabel("Tareas a sembrar").fill("10");
  await guided.getByRole("button", { name: "Continuar" }).click();
  await guided.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Idioma").selectOption("en");
  await expect(guided.getByText("Do you have irrigation?")).toBeVisible();
  await guided.getByRole("button", { name: "Continue" }).click();
  await guided.getByLabel("Total expenses (RD$)").fill("25000");
  await guided.getByRole("button", { name: "Continue" }).click();
  await guided.getByLabel("Harvest to sell (100-pound quintals)").fill("40");
  await guided.getByRole("button", { name: "Continue" }).click();
  await guided.getByLabel("Offer per quintal (RD$, optional)").fill("700");
  await guided.getByRole("button", { name: "View result" }).click();
  await expect(guided.getByRole("region", { name: "Calculator result" })).toContainText("RD$625");
  await page.getByLabel("Language").selectOption("es");
  await expect(guided.getByRole("region", { name: "Resultado de la calculadora" })).toContainText("RD$625");
  await page.getByText("Ya tengo mis gastos y cosecha").click();
  const budget = page.locator(".sale-budget");
  await budget.getByLabel("Gasto total (RD$)").fill("25000");
  await budget.getByLabel("Cantidad para vender").fill("40");
  await budget.getByLabel("Oferta por quintal (RD$)").fill("700");
  await budget.getByRole("button", { name: "Calcular precio mínimo" }).click();
  await expect(budget.locator(".budget-result")).toContainText("RD$625.00");
  await page.getByLabel("Idioma").selectOption("en");
  await expect(budget.locator(".budget-result")).toContainText("RD$625.00 per quintal");
});

test("alternative crop options switch language while preserving their number", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "San Juan", exact: true }).click();
  const options = page.locator(".options");
  await expect(options.getByRole("heading", { name: "Otras opciones" })).toBeVisible();
  const count = await options.locator(".option").count();
  await page.getByLabel("Idioma").selectOption("en");
  await expect(options.getByRole("heading", { name: "Other options" })).toBeVisible();
  expect(await options.locator(".option").count()).toBe(count);
  await expect(options.getByText("Less water", { exact: false }).first()).toBeVisible();
});

test("historical profit scenario keeps figures and sources when language changes", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "Agregar mi finca", exact: true }).click();
  const setup = page.getByRole("dialog", { name: "Cuéntanos de tu finca" });
  await setup.getByRole("button", { name: "San Juan", exact: true }).click();
  await setup.getByRole("button", { name: "Seguir sin marcar" }).click();
  await setup.getByRole("button", { name: "Habichuela roja", exact: true }).click();
  await setup.getByRole("button", { name: "Sí", exact: true }).click();
  await setup.getByRole("button", { name: "Listo, ver mi recomendación" }).click();
  await page.getByRole("button", { name: "Supervisor", exact: true }).click();
  await page.getByRole("tab", { name: "Venta" }).click();
  await page.getByText("Consultar costos y precios de referencia").click();
  const profit = page.locator(".profit");
  await selectCustom(profit.getByRole("combobox", { name: "Cultivo" }), /Habichuela roja/);
  await profit.getByLabel("Tareas").fill("1");
  await expect(profit.getByRole("heading", { name: "Escenario histórico (precio mayorista)" })).toBeVisible();
  const amounts = await profit.locator(".profit-range strong").allTextContents();
  await profit.getByText(/¿De dónde salen estos números/).click();
  const links = await profit.locator("a[href]").evaluateAll(items => items.map(item => (item as HTMLAnchorElement).href).sort());
  await page.getByLabel("Idioma").selectOption("en");
  await expect(profit.getByRole("heading", { name: "Historical scenario (wholesale price)" })).toBeVisible();
  expect(await profit.locator(".profit-range strong").allTextContents()).toEqual(amounts);
  expect(await profit.locator("a[href]").evaluateAll(items => items.map(item => (item as HTMLAnchorElement).href).sort())).toEqual(links);
});

test("market prices, selected month and sources remain unchanged across languages", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("tab", { name: "Venta" }).click();
  const market = page.locator(".market");
  await selectCustom(market.getByRole("combobox", { name: "Cultivo" }), "Papa");
  const price = await market.locator(".price-big").innerText();
  expect(price).toContain("RD$");
  await market.locator(".season-months button").first().click();
  await market.locator(".sources-fold summary").click();
  const links = await market.locator(".sources-box a[href]").evaluateAll(items => items.map(item => (item as HTMLAnchorElement).href).sort());
  await page.getByLabel("Idioma").selectOption("en");
  await expect(market.getByRole("heading", { name: "Crop price" })).toBeVisible();
  await expect(market.getByRole("combobox", { name: "Crop" })).toContainText("Potato");
  await expect(market.locator(".price-big")).toHaveText(price);
  await expect(market.locator(".season-months button").first()).toHaveAttribute("aria-pressed", "true");
  expect(await market.locator(".sources-box a[href]").evaluateAll(items => items.map(item => (item as HTMLAnchorElement).href).sort())).toEqual(links);
  await expect(market.getByText("Wholesale prices in Santo Domingo, not farm-gate prices.")).toBeVisible();
});

test("farm marking map switches language without losing marked area", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/es");
  await page.getByRole("button", { name: "Agregar mi finca", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Cuéntanos de tu finca" });
  await dialog.getByRole("button", { name: "San Juan", exact: true }).click();
  await dialog.getByRole("button", { name: /Marcar la finca en el mapa/ }).click();
  const map = dialog.getByTestId("farm-picker-map");
  await expect(map).toHaveAttribute("data-ready", "true", { timeout: 25000 });
  await map.locator("canvas").click({ position: { x: 90, y: 150 } });
  await expect(dialog.locator(".picker-total")).toContainText("Marcado:");
  const area = (await dialog.locator(".picker-total strong").innerText()).replace("Marcado: ", "");
  await dialog.getByLabel("Idioma").selectOption("en");
  const english = page.getByRole("dialog", { name: "Tell us about your farm" });
  await expect(english.getByRole("button", { name: "Tap squares" })).toBeVisible();
  await expect(english.locator(".picker-total strong")).toHaveText(`Marked: ${area}`);
  await expect(english.getByTestId("farm-picker-map").locator("canvas")).toHaveAttribute("aria-label", "Map");
  await expect(english.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await english.getByLabel("Language").selectOption("es");
  await expect(dialog.locator(".picker-total strong")).toHaveText(`Marcado: ${area}`);
});

test("map navigation control labels follow the selected language", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("tab", { name: "Fincas" }).click();
  const zoom = page.locator("#map .maplibregl-ctrl-zoom-in");
  await expect(zoom).toHaveAttribute("aria-label", "Acercar mapa", { timeout: 25000 });
  await page.getByLabel("Idioma").selectOption("en");
  await expect(zoom).toHaveAttribute("aria-label", "Zoom in");
  await expect(page.getByRole("region", { name: /Map of the Dominican Republic/ })).toBeVisible();
});

test("WhatsApp text and destination follow the chosen language", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "San Juan", exact: true }).click();
  const link = page.getByTestId("wa-link");
  await expect(link).toBeVisible();
  let href = decodeURIComponent((await link.getAttribute("href")) ?? "");
  expect(href).toContain("Datos aproximados");
  expect(href).toContain("vercel.app/es");
  await page.getByLabel("Idioma").selectOption("en");
  await expect(link).toHaveText("Send text only");
  href = decodeURIComponent((await link.getAttribute("href")) ?? "");
  expect(href).toContain("Approximate data");
  expect(href).toContain("vercel.app/en");
});

test("sale, map, climate and assistant section headings switch both ways", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "San Juan", exact: true }).click();
  await page.getByRole("tab", { name: "Venta" }).click();
  await expect(page.getByRole("heading", { name: "¿Cuánto me deja?" })).toBeVisible();
  await page.getByLabel("Idioma").selectOption("en");
  await expect(page.getByRole("heading", { name: "What could I earn?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Price and market" })).toBeVisible();
  await page.getByRole("tab", { name: "Farms" }).click();
  await expect(page.getByRole("heading", { name: "Your farm on the map" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Drought and rain" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Normal climate in/ }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Help" }).click();
  await expect(page.getByRole("heading", { name: "Ask AgroVision" })).toBeVisible();
  await page.getByLabel("Language").selectOption("es");
  await expect(page.getByRole("heading", { name: "Pregúntale a AgroVision" })).toBeVisible();
});
