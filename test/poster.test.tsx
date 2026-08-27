import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Poster from "@/components/report/Poster";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

describe("Poster", () => {
  it("renders top 5 and the deadline on the poster", () => {
    render(<Poster data={parseDashboard(sample)} angle="steady" />);

    // The sample fixture is early-season data where one manager (Steve
    // Strange) holds the top standings spot, the weekly-top honour, and the
    // season-high honour all at once, so the exact string "Steve Strange"
    // legitimately appears more than once on the poster. Scope the assertion
    // to the top-5 list, mirroring the same real-data collision handled in
    // test/herocards.test.tsx.
    const top5 = screen.getByTestId("poster-top5");
    expect(within(top5).getByText("Steve Strange")).toBeInTheDocument();
    expect(screen.getByText(/MYT/)).toBeInTheDocument();
  });
});
