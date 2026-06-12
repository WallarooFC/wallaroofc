import { expect, test } from "@playwright/test";

test("unauthenticated visits are redirected to /sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue with microsoft 365/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /email me a sign-in link/i })).toBeVisible();
});

test("magic-link form rejects an email not on the allow-list", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel(/club email/i).fill("stranger@example.com");
  await page.getByRole("button", { name: /email me a sign-in link/i }).click();
  await expect(page.getByRole("alert").filter({ hasText: /access list/i })).toBeVisible();
});
