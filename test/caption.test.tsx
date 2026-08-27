import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Caption from "@/components/report/Caption";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

describe("Caption", () => {
  it("copies the caption to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<Caption data={parseDashboard(sample)} />);
    await userEvent.click(screen.getByRole("button", { name: /copy caption/i }));
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).toContain("FPL Season 6");
  });
});
