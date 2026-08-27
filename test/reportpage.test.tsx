import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReportPage from "@/app/report/page";

describe("ReportPage", () => {
  it("renders poster and caption", () => {
    render(ReportPage());

    // "本週總榜前五" legitimately appears twice — once as the poster's
    // section label, once inside the caption body's own top-5 section — so
    // scope the assertion to the poster, mirroring test/poster.test.tsx.
    const poster = screen.getByTestId("poster");
    expect(within(poster).getByText(/本週總榜前五/)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /copy caption/i })
    ).toBeInTheDocument();
  });
});
