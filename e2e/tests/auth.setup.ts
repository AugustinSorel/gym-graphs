import { test as setup, expect } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

const authFile = "e2e/.auth/user.json";

const user = {
  email: process.env.E2E_GOOGLE_USER_EMAIL,
  password: process.env.E2E_GOOGLE_USER_PASSWORD,
};

setup("authentication", async ({ page }) => {
  if (!user.email) {
    throw new Error("user google user email is missing form env");
  }

  if (!user.password) {
    throw new Error("user google user password is missing form env");
  }

  // Perform authentication steps. Replace these actions with your own.
  await page.goto("https://github.com/login");
  await page.getByLabel("Username or email address").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("https://github.com/");
  await expect(
    page.getByRole("button", { name: "View profile and more" }),
  ).toBeVisible();

  await page.context().storageState({ path: authFile });
});
