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
