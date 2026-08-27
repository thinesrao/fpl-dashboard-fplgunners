import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import Standings from "@/components/Standings";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

const rows = parseDashboard(sample).standings;

describe("Standings", () => {
  it("shows 3 rows by default and expands to all", async () => {
    render(<Standings rows={rows} totalCount={126} />);
    expect(screen.getAllByTestId("standings-row")).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: /show top 20/i }));
    expect(screen.getAllByTestId("standings-row")).toHaveLength(rows.length);
  });

  it("filters by search query", async () => {
    render(<Standings rows={rows} totalCount={126} />);
    await userEvent.type(screen.getByPlaceholderText(/find manager/i), "gunner");
    const shown = screen.getAllByTestId("standings-row");
    expect(shown).toHaveLength(1);
    expect(within(shown[0]).getByText(/Gunner92/)).toBeInTheDocument();
  });
});
