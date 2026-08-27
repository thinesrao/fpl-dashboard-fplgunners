import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Page from "@/app/page";

describe("Page", () => {
  it("renders the composed dashboard", () => {
    render(Page());
    expect(screen.getByText("Gunners League")).toBeInTheDocument();
    expect(screen.getByText("Current Leader")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Classic League/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("JET CHAN")).toBeInTheDocument();
  });
});
