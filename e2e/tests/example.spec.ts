import { test } from "@playwright/test";

test("making sure this works", async ({ page }) => {
  await page.goto("https://gym-graphs.vercel.app");

  await page
    .locator('[href="/dashboard"]', { hasText: "get started" })
    .first()
    .click();

  await page.waitForURL((url) => url.pathname.startsWith("/dashboard"));
});
