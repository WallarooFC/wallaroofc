import { expect, test } from "@playwright/test";

test("portal root redirects to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});

test("sign-in page exposes magic link and microsoft entry points", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: /email me a sign-in link/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /microsoft 365/i })).toBeVisible();
});
