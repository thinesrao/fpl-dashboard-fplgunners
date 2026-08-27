import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CannonLogo from "@/components/CannonLogo";

describe("CannonLogo", () => {
  it("renders an accessible svg mark", () => {
    const { container } = render(<CannonLogo />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-label")).toContain("Gunners");
  });
});
