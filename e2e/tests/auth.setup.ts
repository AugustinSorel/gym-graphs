import { test as setup } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

const user = {
  email: process.env.E2E_GITHUB_USER_EMAIL,
  password: process.env.E2E_GITHUB_USER_PASSWORD,
};

setup("authenticate", async ({ page }) => {
  if (!user.email) {
    throw new Error("e2e github user email is missing");
  }

  if (!user.password) {
    throw new Error("e2e github user password is missing");
  }

  await page.goto("https://gym-graphs.vercel.app");

  await page
    .locator('[href="/dashboard"]', { hasText: "get started" })
    .first()
    .click();

  await page.waitForURL((url) => url.pathname.startsWith("/sign-in"));

  await page.locator("button", { hasText: "github" }).first().click();

  await page.getByLabel("Username or email address").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("https://gym-graphs.vercel.app/dashboard");

  await page.context().storageState({ path: authFile });
});
