import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HeroCards from "@/components/HeroCards";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

describe("HeroCards", () => {
  it("renders the leader, highest-GW and MOTW values", () => {
    render(<HeroCards data={parseDashboard(sample)} />);
    expect(screen.getByText("Current Leader")).toBeInTheDocument();
    expect(screen.getByText("Steve Strange")).toBeInTheDocument(); // leader name
    expect(screen.getByText(/Chasing the plate/i)).toBeInTheDocument();
  });
});
