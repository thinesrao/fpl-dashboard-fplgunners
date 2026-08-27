import { describe, it, expect } from "vitest";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

describe("parseDashboard", () => {
  it("accepts the sample snapshot and exposes typed fields", () => {
    const d = parseDashboard(sample);
    expect(d.meta.leagueNameEn).toBe("Gunners League");
    expect(d.standings[0].manager).toBe("Steve Strange");
    expect(d.meta.nextGw.number).toBe(2);
  });
  it("rejects a snapshot missing meta.seasonLabel", () => {
    const bad = { ...sample, meta: { ...sample.meta } };
    // @ts-expect-error deleting for test
    delete bad.meta.seasonLabel;
    expect(() => parseDashboard(bad)).toThrow();
  });
});
