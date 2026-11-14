/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { test, expect } from "@playwright/test";

test("local data, parcel selection, priority, NASA sample and offline reload", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${message.text()} ${message.location().url}`); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Compare what comes next." })).toBeVisible();
  await expect(page.getByText("Offline case saved")).toBeVisible();
  await expect(page.locator(".parcel-marker")).toHaveCount(3);
  await expect(page.locator("#map")).toHaveAttribute("data-loaded", "true");
  await expect(page.locator("#map")).toHaveAttribute("data-rendered-parcels", "3");
  await page.getByRole("button", { name: "Select Demo area B", exact: true }).click();
  await expect(page.getByLabel("Choose a demo area")).toHaveValue("demo-02");
  await page.getByLabel("Declared water access").selectOption("rainfed");
  await expect(page.getByText(/does not establish rainfed suitability/)).toBeVisible();
  await expect(page.locator("[data-scenario]").first()).not.toHaveAttribute("data-scenario", "baseline");
  await page.getByLabel("Your priority").selectOption("market");
  await expect(page.locator("[data-scenario]").first()).toHaveAttribute("data-scenario", "baseline");
  await page.getByLabel("Climate month").selectOption("1");
  await page.getByRole("button", { name: "NDVI", exact: true }).click();
  await expect(page.getByText(/MODIS Terra · 8-day visualization/)).toBeVisible();
  await page.getByRole("button", { name: "Explain comparison" }).click();
  await expect(page.getByText("Deterministic explanation · no AI generation", { exact: true })).toBeVisible();
  // Wait until runtime chunks and worker requests settle before cutting all networking.
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match("/data/MODIS_Terra_NDVI_8Day.png")))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Compare what comes next." })).toBeVisible();
  await expect(page.locator(".parcel-marker")).toHaveCount(3);
  await expect(page.locator("#map")).toHaveAttribute("data-loaded", "true");
  await expect(page.locator("#map")).toHaveAttribute("data-rendered-parcels", "3");
  await page.getByLabel("Choose a demo area").selectOption("demo-03");
  await page.getByRole("button", { name: "Explain comparison" }).click();
  await expect(page.getByText("Deterministic offline explanation · no AI generation", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/offline-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("endpoint validates size, trusted enums and missing-key fallback", async ({ request }) => {
  const valid = { priority: "water", month: 11, irrigation: "unconfirmed" };
  const response = await request.post("/api/explain", { data: valid });
  expect(response.status()).toBe(200);
  expect((await response.json()).mode).toBe("deterministic");
  expect((await request.post("/api/explain", { data: { ...valid, geometry: [0, 0] } })).status()).toBe(400);
  expect((await request.post("/api/explain", { data: "x".repeat(3000) })).status()).toBe(413);
});

test("mobile comparison fits viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("[data-scenario]")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator("#map")).toHaveAttribute("data-loaded", "true");
  await expect(page.locator("#map")).toHaveAttribute("data-rendered-parcels", "3");
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
