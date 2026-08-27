import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ChampionPlate from "@/components/ChampionPlate";
import champions from "@/data/champions.json";

describe("ChampionPlate", () => {
  it("engraves the reigning champion", () => {
    render(<ChampionPlate champion={champions[0] as any} />);
    expect(screen.getByText("JET CHAN")).toBeInTheDocument();
    expect(screen.getByText(/RisingGunner2026/)).toBeInTheDocument();
    expect(screen.getByText(/Malaysia Rank 30th/)).toBeInTheDocument();
  });
});
