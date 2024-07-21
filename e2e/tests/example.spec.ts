import { test } from "@playwright/test";

test("making sure this works", async ({ page }) => {
  await page.goto("/dashboard");
});
