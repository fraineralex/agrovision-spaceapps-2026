/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import { test, expect } from "@playwright/test";

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
  await voice.getByText("View conversation").click();
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
  await expect(advisor.getByText("Te conviene sembrar")).toBeVisible();
  const cropIcon = advisor.locator(".recommendation-heading .crop-illustration");
  await expect(cropIcon).toBeVisible();
  const spanish = await advisor.locator(".recommendation-heading h2").innerText();
  await page.getByLabel("Idioma").selectOption("en");
  await expect(page).toHaveURL(/\/en$/);
  await expect(advisor.getByText("Consider planting")).toBeVisible();
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
  await page.getByLabel("Provincia para consultar la lluvia").selectOption("San Juan");
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
