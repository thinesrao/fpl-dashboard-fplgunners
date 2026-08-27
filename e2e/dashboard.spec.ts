import { test, expect } from "@playwright/test";

test("dashboard: cards, expand, search, plate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Current Leader")).toBeVisible();

  await page.getByRole("button", { name: /show top 20/i }).click();

  const search = page.getByPlaceholder(/find manager/i);
  await search.fill("Gunner92");

  // The sample fixture (data/dashboard.json) has exactly one row whose team
  // is "Gunner92" — manager "soo sheng". Assert the search narrows to that
  // row and hides everything else, rather than a specific row count.
  const rows = page.getByTestId("standings-row");
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("soo sheng");
  await expect(rows).toContainText("Gunner92");
  await expect(rows).not.toContainText("Steve Strange");

  await expect(page.getByText("JET CHAN")).toBeVisible();
});
