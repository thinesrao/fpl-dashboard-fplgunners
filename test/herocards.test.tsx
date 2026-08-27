import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HeroCards from "@/components/HeroCards";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

describe("HeroCards", () => {
  it("renders the leader, highest-GW and MOTW values", () => {
    render(<HeroCards data={parseDashboard(sample)} />);

    // Manager names can repeat across cards (e.g. early-season data where one
    // manager currently holds every hero stat), so assertions are scoped to
    // each card by its data-testid rather than relying on page-wide unique text.
    const leaderCard = screen.getByTestId("hero-leader");
    expect(within(leaderCard).getByText("Current Leader")).toBeInTheDocument();
    expect(within(leaderCard).getByText("Steve Strange")).toBeInTheDocument(); // leader name
    expect(
      within(leaderCard).getByText(/Chasing the plate/i),
    ).toBeInTheDocument();
  });
});
