import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "@/components/Header";
import sample from "@/test/fixtures/dashboard.sample.json";

describe("Header", () => {
  it("shows the English name and hides the live pill when liveGw is null", () => {
    render(<Header meta={sample.meta as any} />);
    expect(screen.getByText("Gunners League")).toBeInTheDocument();
    expect(screen.queryByText(/live/i)).toBeNull();
  });

  it("shows the live pill when liveGw is set", () => {
    render(<Header meta={{ ...sample.meta, liveGw: 2 } as any} />);
    expect(screen.getByText(/live/i)).toBeInTheDocument();
    expect(screen.getByText(/GW2/i)).toBeInTheDocument();
  });
});
