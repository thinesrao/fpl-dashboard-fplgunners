import { test, expect } from "@playwright/test";

test("report: poster + caption + copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/report");
  // "本週總榜前五" also appears inside the generated caption text, so scope
  // to the poster graphic (data-testid="poster") to avoid a strict-mode
  // ambiguity between the two.
  await expect(page.getByTestId("poster")).toContainText("本週總榜前五");
  await page.getByRole("button", { name: /copy caption/i }).click();
  await expect(page.getByRole("button", { name: /copied/i })).toBeVisible();
});
