import { describe, it, expect } from "vitest";
import { selectAngle, formatDeadlineMYT, buildCaption } from "@/lib/report";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

const base = parseDashboard(sample).report.flags;

describe("selectAngle", () => {
  it("prioritises a broken record above everything", () => {
    expect(selectAngle({ ...base, recordBroken: true, leaderChanged: true })).toBe("record");
  });
  it("picks leader change over a tight gap", () => {
    expect(selectAngle({ ...base, recordBroken: false, leaderChanged: true, gapToSecond: 3 })).toBe("leader");
  });
  it("picks tight when only the gap is small", () => {
    expect(selectAngle({ ...base, recordBroken: false, leaderChanged: false, gapToSecond: 10, weeklyTopScore: 80 })).toBe("tight");
  });
  it("picks haul on a big single-week score", () => {
    expect(selectAngle({ ...base, recordBroken: false, leaderChanged: false, gapToSecond: 40, weeklyTopScore: 121 })).toBe("haul");
  });
  it("falls back to steady", () => {
    expect(selectAngle({ ...base, recordBroken: false, leaderChanged: false, gapToSecond: 40, weeklyTopScore: 70 })).toBe("steady");
  });
});

describe("formatDeadlineMYT", () => {
  it("renders UTC as MYT (+8)", () => {
    // 2026-10-24T17:30:00Z -> 2026-10-25 01:30 MYT
    expect(formatDeadlineMYT("2026-10-24T17:30:00Z")).toBe("Sun 25 Oct · 01:30 MYT");
  });
});

describe("buildCaption", () => {
  it("includes league, all five names, honours and hashtags", () => {
    const d = parseDashboard(sample);
    const cap = buildCaption(d, "steady");
    expect(cap).toContain("FPL Season 6");
    expect(cap).toContain("Steve Strange");
    expect(cap).toContain("賽季最高分紀錄");
    expect(cap).toContain("#FPLSeason6");
    expect(cap).toContain("MYT");
  });
});
