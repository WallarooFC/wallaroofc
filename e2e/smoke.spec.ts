import { expect, test } from "@playwright/test";

test("landing page renders the portal heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /secretary portal/i })).toBeVisible();
});
