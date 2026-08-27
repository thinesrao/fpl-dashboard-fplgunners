# FPL Gunners Dashboard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the FPL Gunners league dashboard as a statically-rendered Next.js app on Vercel (no sleeping), showing standings + two award cards + the Champion's Plate, plus a Gameweek Report generator for the Facebook 戰報 — fed by a JSON snapshot the existing Python pipeline commits.

**Architecture:** The Python pipeline keeps computing into Google Sheets, then a new standalone step reads those sheets + the FPL API and emits `data/dashboard.json`, committed to the repo. A gated-hourly GitHub Action only rebuilds when a gameweek goes final. Next.js imports the committed JSON at build time and renders 100% static; the pipeline's commit triggers the Vercel redeploy. No runtime database.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, zod, next/font, next/og (poster image), Vitest + React Testing Library (unit/component), Playwright (E2E); Python 3.11 + pytest (pipeline).

**Spec:** `docs/superpowers/specs/2026-08-27-fpl-dashboard-redesign-design.md`

**Visual references (source of truth for markup/styling — port from these):**
- Dashboard: `docs/superpowers/mockups/dashboard.html`
- Gameweek Report: `docs/superpowers/mockups/gw-report.html`

## Global Constraints

- **Palette B — Electric Mint (committed dark), exact tokens:** `--bg:#08090c` · `--surface:#12141a` · `--surface-2:#171a22` · `--line:#242835` · `--text:#e7ecef` · `--muted:#828d9c` · `--faint:#5a6472` · `--mint:#2bfca4` · `--mint-ink:#04120b` · `--gold:#ffb020` · `--hot:#ff3dae`. Logo colour `#EF0107` (brand mark only).
- **Fonts:** Archivo (display), Barlow (body/data), Playfair Display (plate engraving), Noto Sans TC (Chinese). Load via `next/font`.
- **Language:** English UI; real Chinese league name shown as subtitle and on the plate/report.
- **Deadline formatting:** always **MYT (UTC+8)**, e.g. `Sat 25 Oct · 01:30 MYT`.
- **No runtime data fetch in v1** — page is statically rendered from committed JSON.
- **Claude does no Vercel work** — the user creates the Vercel project and imports the repo after the code is complete.
- **Data commits from CI** use the Action's `GITHUB_TOKEN`; no secrets in the frontend bundle.
- Follow the repo's existing conventions; keep files focused (< 400 lines typical).

---

## File Structure

**Frontend (new, at repo root):**
```
package.json, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts, playwright.config.ts
app/
  layout.tsx                fonts + <html>/<body> + metadata
  globals.css               Tailwind import + palette tokens
  page.tsx                  dashboard (server component; imports data)
  report/
    page.tsx                report generator screen
    opengraph-image.tsx     next/og poster PNG (CJK font embedded)
components/
  CannonLogo.tsx            inline SVG mark
  Header.tsx                logo + titles + (Phase 2) live pill
  HeroCards.tsx             3 status cards
  Standings.tsx             'use client' — search + expand + plate badge
  ChampionPlate.tsx         SVG medallion
  report/
    Poster.tsx              shareable card (shared by report page + og image)
    Caption.tsx             'use client' — variant tabs, copy, Web Share
lib/
  types.ts                  zod schemas + inferred types
  data.ts                   load + validate dashboard.json / champions.json
  report.ts                 caption angles, angle selection, MYT deadline
data/
  dashboard.json            pipeline output (committed); sample committed initially
  champions.json            manual (one entry per season)
test/
  fixtures/dashboard.sample.json
e2e/
  dashboard.spec.ts, report.spec.ts
```

**Pipeline (new Python, alongside existing `data_pipeline.py`):**
```
snapshot/
  __init__.py
  build.py                  pure: sheets+bootstrap dicts -> dashboard dict
  flags.py                  pure: compute report flags + weeklyTop
  gate.py                   pure: should_rebuild(bootstrap, existing_meta)
  io.py                     thin I/O: read sheets, fetch bootstrap, write json
build_snapshot.py           entry point (gate -> build -> write)
tests/
  test_build.py, test_flags.py, test_gate.py
  fixtures/*.json
.github/workflows/run_fpl_pipeline.yml   (modified)
```

---

## Phase 0 — Scaffold

### Task 1: Initialize Next.js app + test tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `vitest.config.ts`, `test/setup.ts`, `.gitignore` (append)
- Create: `data/dashboard.json`, `data/champions.json`, `test/fixtures/dashboard.sample.json`

**Interfaces:**
- Produces: a runnable Next.js app at repo root; `npm test` runs Vitest; sample `data/dashboard.json` conforming to §7 of the spec.

- [ ] **Step 1: Scaffold Next.js**

Run (non-interactive):
```bash
npx create-next-app@latest . --ts --app --tailwind --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
```
If it refuses because the directory isn't empty, scaffold in `/tmp/fpl-web` with the same flags and copy `app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `next-env.d.ts`, `eslint.config.mjs` into the repo root. Confirm Tailwind v4 (`@tailwindcss/postcss` in devDependencies).

- [ ] **Step 2: Add test tooling**

Run:
```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event zod
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./test/setup.ts"], globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

Create `test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Create the sample data files**

Create `data/dashboard.json` and copy it to `test/fixtures/dashboard.sample.json` (identical). Use real GW1 values:
```json
{
  "meta": {
    "leagueId": 1022594,
    "leagueName": "🏆 槍迷之家超級聯賽 🏆",
    "leagueNameEn": "Gunners League",
    "seasonLabel": "Season 6",
    "managerCount": 126,
    "lastFinishedGw": 1,
    "lastUpdatedUtc": "2026-08-27T21:40:00Z",
    "liveGw": null,
    "nextGw": { "number": 2, "deadlineUtc": "2026-08-30T10:00:00Z" }
  },
  "standings": [
    { "rank": 1, "lastRank": 0, "entryId": 4778037, "manager": "Steve Strange", "team": "The Marvel 11", "gwPoints": 96, "total": 96 },
    { "rank": 2, "lastRank": 0, "entryId": 1, "manager": "Liang Arsenal", "team": "liang", "gwPoints": 86, "total": 86 },
    { "rank": 3, "lastRank": 0, "entryId": 2, "manager": "soo sheng", "team": "Gunner92", "gwPoints": 83, "total": 83 },
    { "rank": 4, "lastRank": 0, "entryId": 3, "manager": "Cheong Chee Poi", "team": "northlondonforever94", "gwPoints": 82, "total": 82 },
    { "rank": 5, "lastRank": 0, "entryId": 4, "manager": "Yuen Khai Khoo", "team": "Ødeparfum", "gwPoints": 81, "total": 81 }
  ],
  "highestGw": { "manager": "Steve Strange", "team": "The Marvel 11", "score": 96, "gw": 1, "runnersUp": [] },
  "mostMotw": { "manager": "Steve Strange", "team": "The Marvel 11", "wins": 1, "lastWinGw": 1, "runnersUp": [] },
  "weeklyTop": { "manager": "Steve Strange", "team": "The Marvel 11", "score": 96, "gw": 1 },
  "report": { "flags": { "recordBroken": false, "leaderChanged": false, "prevLeader": "", "gapToSecond": 10, "weeklyTopScore": 96 } }
}
```

Create `data/champions.json`:
```json
[
  { "season": "2025/26", "manager": "JET CHAN", "team": "RisingGunner2026", "totalPoints": 2431, "nationalRank": "Malaysia Rank 30th" }
]
```

- [ ] **Step 4: Smoke test the build**

Run:
```bash
npm run build
```
Expected: build succeeds (default scaffold page). Then `npm test` (no tests yet → Vitest exits 0 with "no test files"; acceptable).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app, test tooling, sample data"
```

---

## Phase 1 — Data & report logic (pure, TDD)

### Task 2: Types + data loader

**Files:**
- Create: `lib/types.ts`, `lib/data.ts`, `test/data.test.ts`

**Interfaces:**
- Produces:
  - `Dashboard`, `Champion`, `Manager`, `HighestGw`, `MostMotw`, `WeeklyTop`, `Meta`, `ReportFlags` types.
  - `parseDashboard(json: unknown): Dashboard` — throws `ZodError` on invalid input.
  - `getDashboard(): Dashboard` — reads & validates `data/dashboard.json`.
  - `getChampions(): Champion[]` — reads & validates `data/champions.json`, newest first.
  - `getReigningChampion(): Champion` — `getChampions()[0]`.

- [ ] **Step 1: Write the failing test**

Create `test/data.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/data.test.ts`
Expected: FAIL — cannot find module `@/lib/types`.

- [ ] **Step 3: Implement `lib/types.ts`**

```ts
import { z } from "zod";

export const ManagerSchema = z.object({
  rank: z.number(), lastRank: z.number(), entryId: z.number(),
  manager: z.string(), team: z.string(), gwPoints: z.number(), total: z.number(),
});
const RunnerScore = z.object({ manager: z.string(), score: z.number() });
const RunnerWins = z.object({ manager: z.string(), wins: z.number() });

export const HighestGwSchema = z.object({
  manager: z.string(), team: z.string(), score: z.number(), gw: z.number(),
  runnersUp: z.array(RunnerScore),
});
export const MostMotwSchema = z.object({
  manager: z.string(), team: z.string(), wins: z.number(), lastWinGw: z.number(),
  runnersUp: z.array(RunnerWins),
});
export const WeeklyTopSchema = z.object({
  manager: z.string(), team: z.string(), score: z.number(), gw: z.number(),
});
export const ReportFlagsSchema = z.object({
  recordBroken: z.boolean(), leaderChanged: z.boolean(), prevLeader: z.string(),
  gapToSecond: z.number(), weeklyTopScore: z.number(),
});
export const MetaSchema = z.object({
  leagueId: z.number(), leagueName: z.string(), leagueNameEn: z.string(),
  seasonLabel: z.string(), managerCount: z.number(), lastFinishedGw: z.number(),
  lastUpdatedUtc: z.string(), liveGw: z.number().nullable(),
  nextGw: z.object({ number: z.number(), deadlineUtc: z.string() }),
});
export const DashboardSchema = z.object({
  meta: MetaSchema, standings: z.array(ManagerSchema),
  highestGw: HighestGwSchema, mostMotw: MostMotwSchema,
  weeklyTop: WeeklyTopSchema, report: z.object({ flags: ReportFlagsSchema }),
});
export const ChampionSchema = z.object({
  season: z.string(), manager: z.string(), team: z.string(),
  totalPoints: z.number(), nationalRank: z.string(),
});

export type Manager = z.infer<typeof ManagerSchema>;
export type HighestGw = z.infer<typeof HighestGwSchema>;
export type MostMotw = z.infer<typeof MostMotwSchema>;
export type WeeklyTop = z.infer<typeof WeeklyTopSchema>;
export type ReportFlags = z.infer<typeof ReportFlagsSchema>;
export type Meta = z.infer<typeof MetaSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
export type Champion = z.infer<typeof ChampionSchema>;

export const parseDashboard = (json: unknown): Dashboard => DashboardSchema.parse(json);
export const parseChampions = (json: unknown): Champion[] => z.array(ChampionSchema).parse(json);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/data.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Implement `lib/data.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import { parseDashboard, parseChampions, type Dashboard, type Champion } from "./types";

const read = (rel: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));

export const getDashboard = (): Dashboard => parseDashboard(read("data/dashboard.json"));
export const getChampions = (): Champion[] => parseChampions(read("data/champions.json"));
export const getReigningChampion = (): Champion => getChampions()[0];
```

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/data.ts test/data.test.ts
git commit -m "feat: zod-validated dashboard/champions data layer"
```

### Task 3: Report logic — MYT deadline, angle selection, caption

**Files:**
- Create: `lib/report.ts`, `test/report.test.ts`

**Interfaces:**
- Consumes: `Dashboard` from `lib/types`.
- Produces:
  - `type AngleId = "record" | "leader" | "tight" | "haul" | "steady"`
  - `ANGLES: Angle[]` where `Angle = { id: AngleId; label: string; icon: string; when: (f: ReportFlags) => boolean; }`
  - `selectAngle(f: ReportFlags): AngleId` — first `ANGLES` entry whose `when` is true (priority order record›leader›tight›haul›steady).
  - `formatDeadlineMYT(iso: string): string` — e.g. `"Sat 25 Oct · 01:30 MYT"`.
  - `posterHighlight(d: Dashboard, id: AngleId): string`
  - `buildCaption(d: Dashboard, id: AngleId): string`
  - `TIGHT_GAP = 15`, `BIG_HAUL = 100` (thresholds).

- [ ] **Step 1: Write the failing test**

Create `test/report.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/report.test.ts`
Expected: FAIL — cannot find module `@/lib/report`.

- [ ] **Step 3: Implement `lib/report.ts`**

```ts
import type { Dashboard, ReportFlags } from "./types";

export type AngleId = "record" | "leader" | "tight" | "haul" | "steady";
export const TIGHT_GAP = 15;
export const BIG_HAUL = 100;

export interface Angle {
  id: AngleId; label: string; icon: string; when: (f: ReportFlags) => boolean;
}
export const ANGLES: Angle[] = [
  { id: "record", label: "新紀錄",     icon: "🔥", when: (f) => f.recordBroken },
  { id: "leader", label: "榜首易主",   icon: "👑", when: (f) => f.leaderChanged },
  { id: "tight",  label: "競爭白熱化", icon: "⚔️", when: (f) => f.gapToSecond <= TIGHT_GAP },
  { id: "haul",   label: "神級單週",   icon: "💥", when: (f) => f.weeklyTopScore >= BIG_HAUL },
  { id: "steady", label: "標準戰報",   icon: "🏆", when: () => true },
];
export const selectAngle = (f: ReportFlags): AngleId =>
  (ANGLES.find((a) => a.when(f)) ?? ANGLES[ANGLES.length - 1]).id;

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function formatDeadlineMYT(iso: string): string {
  const t = new Date(new Date(iso).getTime() + 8 * 3600 * 1000); // shift to UTC+8, read as UTC parts
  const p = (n: number) => String(n).padStart(2, "0");
  return `${DAYS[t.getUTCDay()]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} · ${p(t.getUTCHours())}:${p(t.getUTCMinutes())} MYT`;
}

const intro = (d: Dashboard, id: AngleId): string => {
  const f = d.report.flags, gw = d.meta.lastFinishedGw, t = d.standings;
  switch (id) {
    case "record": return `各位經理人，GW${gw} 寫下歷史！🔥\n${d.highestGw.manager} 轟下 ${d.highestGw.score} 分，刷新本季單週最高分紀錄。以下是本週總榜前五 👇`;
    case "leader": return `各位經理人，GW${gw} 榜首易主！👑\n${t[0].manager} 本週強勢登頂，取代 ${f.prevLeader} 成為新的領頭羊。完整前五名如下 👇`;
    case "tight":  return `各位經理人，GW${gw} 落幕，冠軍之爭進入白熱化！⚔️\n榜首與第二名僅差 ${f.gapToSecond} 分，誰都有機會。本週前五名 👇`;
    case "haul":   return `各位經理人，GW${gw} 有人火力全開！💥\n${d.weeklyTop.manager} 單週狂砍 ${d.weeklyTop.score} 分，冠絕全聯賽。本週前五名 👇`;
    default:       return `各位經理人，GW${gw} 正式落幕！本週排位再度洗牌，一起看看誰站上了高位 👇`;
  }
};
export function posterHighlight(d: Dashboard, id: AngleId): string {
  const f = d.report.flags, t = d.standings;
  switch (id) {
    case "record": return `🔥 新紀錄誕生！${d.highestGw.manager} 改寫本季最高分`;
    case "leader": return `👑 榜首易主！${t[0].manager} 登上本季新王座`;
    case "tight":  return `⚔️ 冠軍懸念！榜首僅領先 ${f.gapToSecond} 分`;
    case "haul":   return `💥 火力全開！${d.weeklyTop.manager} 單週 ${d.weeklyTop.score} 分`;
    default:       return `🏆 GW${d.meta.lastFinishedGw} 戰報 · 本週排位出爐`;
  }
}
const MEDALS = ["🥇","🥈","🥉","4️⃣","5️⃣"];
export function buildCaption(d: Dashboard, id: AngleId): string {
  const m = d.meta, s = m.seasonLabel.replace(/\D/g, "");
  const rows = d.standings.slice(0, 5).map((r, i) => `${MEDALS[i]} ${r.manager}　${r.total}`).join("\n");
  const deadline = formatDeadlineMYT(m.nextGw.deadlineUtc);
  const url = `https://${new URL(`https://x`).host && ""}`; // replaced below
  return [
`${m.leagueName} ｜ FPL ${m.seasonLabel}`,
`📢 Gameweek ${m.lastFinishedGw} 戰報`, ``,
intro(d, id), ``,
`🏅 本週總榜前五`, rows, ``,
`⭐ 本週焦點`,
`✨ 單週最高分 — ${d.weeklyTop.manager}（${d.weeklyTop.score} 分）`,
`📈 賽季最高分紀錄 — ${d.highestGw.manager}（${d.highestGw.score} 分）`, ``,
`📊 完整數據與獎項排行`, DASHBOARD_URL, ``,
`⏰ 下一個截止時間`,
`🗓️ Gameweek ${m.nextGw.number} ｜ ${deadline}`,
`記得在死線前排好陣容，別讓分數溜走！`, ``,
`#槍迷之家超級聯賽第${["零","一","二","三","四","五","六","七","八","九","十"][Number(s)] ?? s}季 #FPLSeason${s} #FPL`,
  ].join("\n");
}
export const DASHBOARD_URL = "https://fplgunners.vercel.app"; // TODO(config): set to the live domain at deploy time
```
> Note: remove the dead `url` line — it was scaffolding. Final `buildCaption` must reference `DASHBOARD_URL` only. (Clean it before running Step 4.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/report.test.ts`
Expected: PASS (all cases). If the hashtag season line fails, verify `seasonLabel` is `"Season 6"` in the fixture.

- [ ] **Step 5: Commit**

```bash
git add lib/report.ts test/report.test.ts
git commit -m "feat: report angle selection, MYT deadline, caption builder"
```

---

## Phase 2 — Design system & logo

### Task 4: Global styles, fonts, CannonLogo

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`
- Create: `components/CannonLogo.tsx`, `test/cannon.test.tsx`

**Interfaces:**
- Produces: CSS custom properties (Global Constraints tokens) available app-wide; `<CannonLogo className?/>` rendering the inline SVG mark; fonts exposed as CSS vars `--font-archivo`, `--font-barlow`, `--font-playfair`, `--font-noto-tc`.

- [ ] **Step 1: Write the failing test**

Create `test/cannon.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/cannon.test.tsx`
Expected: FAIL — cannot find `@/components/CannonLogo`.

- [ ] **Step 3: Implement CannonLogo**

Port the SVG from `docs/superpowers/mockups/dashboard.html` (the `<svg class="cannon">` block — breech, barrel, muzzle, trail, wheel ring + 6 spokes + hub). `components/CannonLogo.tsx`:
```tsx
export default function CannonLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 152 74" role="img" aria-label="Gunners League" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 28 Q4 28 4 37 Q4 46 14 46 L44 45 L44 29 Z" fill="#EF0107"/>
      <path d="M100 30 L146 33 L146 41 L100 46 Z" fill="#EF0107"/>
      <rect x="143" y="31" width="7" height="12" rx="2" fill="#EF0107"/>
      <path d="M46 52 Q26 66 8 60 Q25 64 44 50 Z" fill="#EF0107"/>
      <circle cx="72" cy="40" r="30" fill="none" stroke="#EF0107" strokeWidth="6"/>
      <g stroke="#EF0107" strokeWidth="5" strokeLinecap="round">
        <line x1="72" y1="40" x2="72" y2="13"/><line x1="72" y1="40" x2="95" y2="27"/>
        <line x1="72" y1="40" x2="95" y2="53"/><line x1="72" y1="40" x2="72" y2="67"/>
        <line x1="72" y1="40" x2="49" y2="53"/><line x1="72" y1="40" x2="49" y2="27"/>
      </g>
      <circle cx="72" cy="40" r="9" fill="none" stroke="#EF0107" strokeWidth="5"/>
      <circle cx="72" cy="40" r="3" fill="#EF0107"/>
    </svg>
  );
}
```

- [ ] **Step 4: Set up fonts + tokens**

`app/layout.tsx` — load fonts via `next/font/google` (Archivo, Barlow, Playfair_Display, Noto_Sans_TC) exposing CSS variables, set `<html lang="en">`, apply `--bg`/`--text` to body, and metadata `{ title: "Gunners League", description: "..." }`.

`app/globals.css` — after `@import "tailwindcss";`, add `:root { --bg:#08090c; --surface:#12141a; --surface-2:#171a22; --line:#242835; --text:#e7ecef; --muted:#828d9c; --faint:#5a6472; --mint:#2bfca4; --mint-ink:#04120b; --gold:#ffb020; --hot:#ff3dae; }` and set `body { background: var(--bg); color: var(--text); }` plus the fixed radial-glow background from the mockup. Map fonts to Tailwind via `@theme` (`--font-display`, `--font-body`, etc.).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run test/cannon.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx components/CannonLogo.tsx test/cannon.test.tsx
git commit -m "feat: palette tokens, fonts, cannon logo"
```

---

## Phase 3 — Dashboard components & page

### Task 5: Header

**Files:**
- Create: `components/Header.tsx`, `test/header.test.tsx`

**Interfaces:**
- Consumes: `Meta` from `lib/types`, `CannonLogo`.
- Produces: `<Header meta={Meta} />` — renders `meta.leagueNameEn`, `meta.leagueName` subtitle, and a live pill only when `meta.liveGw !== null`.

- [ ] **Step 1: Write the failing test**
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "@/components/Header";
import sample from "@/test/fixtures/dashboard.sample.json";

it("shows the English name and hides the live pill when liveGw is null", () => {
  render(<Header meta={sample.meta as any} />);
  expect(screen.getByText("Gunners League")).toBeInTheDocument();
  expect(screen.queryByText(/live/i)).toBeNull();
});
```
- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/header.test.tsx` → FAIL (missing module).
- [ ] **Step 3: Implement `components/Header.tsx`** — port the `.topbar` markup from `docs/superpowers/mockups/dashboard.html`; render `<CannonLogo/>`, `<h1>{meta.leagueNameEn}</h1>`, subtitle `{meta.leagueName} · Classic League`, and `{meta.liveGw !== null && <LivePill gw={meta.liveGw}/>}`. Style with Tailwind + tokens.
- [ ] **Step 4: Run to verify it passes** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: dashboard header"`

### Task 6: HeroCards

**Files:**
- Create: `components/HeroCards.tsx`, `test/herocards.test.tsx`

**Interfaces:**
- Consumes: `Dashboard`.
- Produces: `<HeroCards data={Dashboard} />` — three cards: Current Leader (`standings[0]`, with a "Chasing the plate" chip), Highest GW (`highestGw`), Most MOTW (`mostMotw`).

- [ ] **Step 1: Write the failing test**
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HeroCards from "@/components/HeroCards";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

it("renders the leader, highest-GW and MOTW values", () => {
  render(<HeroCards data={parseDashboard(sample)} />);
  expect(screen.getByText("Current Leader")).toBeInTheDocument();
  expect(screen.getByText("Steve Strange")).toBeInTheDocument(); // leader name
  expect(screen.getByText(/Chasing the plate/i)).toBeInTheDocument();
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement `components/HeroCards.tsx`** — port `.heroes`/`.card` markup from the mockup; three cards with eyebrow, big number, name, meta; mint/hot/gold accent glows; the leader card includes the plate chip.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: hero status cards"`

### Task 7: Standings (client — search + expand + plate badge)

**Files:**
- Create: `components/Standings.tsx`, `test/standings.test.tsx`

**Interfaces:**
- Consumes: `Manager[]`.
- Produces: `<Standings rows={Manager[]} totalCount={number} />` — `'use client'`. Shows top 3 by default; a button toggles to top 20; a search box filters by manager/team (case-insensitive) over all rows and hides the toggle while searching; rank ≤3 gets podium classes; the rank-1 row shows a "Chasing the plate" badge; movement column renders `NEW` when `lastRank===0`, else `▲n`/`▼n`/`–`.

- [ ] **Step 1: Write the failing test**
```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import Standings from "@/components/Standings";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

const rows = parseDashboard(sample).standings;

it("shows 3 rows by default and expands to all", async () => {
  render(<Standings rows={rows} totalCount={126} />);
  expect(screen.getAllByTestId("standings-row")).toHaveLength(3);
  await userEvent.click(screen.getByRole("button", { name: /show top 20/i }));
  expect(screen.getAllByTestId("standings-row")).toHaveLength(rows.length);
});

it("filters by search query", async () => {
  render(<Standings rows={rows} totalCount={126} />);
  await userEvent.type(screen.getByPlaceholderText(/find manager/i), "gunner");
  const shown = screen.getAllByTestId("standings-row");
  expect(shown).toHaveLength(1);
  expect(within(shown[0]).getByText(/Gunner92/)).toBeInTheDocument();
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement `components/Standings.tsx`** — `'use client'`; `useState` for `expanded` and `query`; derive the visible list (query ? filtered all : expanded ? all : first 3); each row `data-testid="standings-row"`; port markup/classes from the mockup `.standings` block including the plate badge and movement helper. (With only 5 sample rows, "top 20" shows all 5 — the length assertion uses `rows.length`.)
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: standings with search, expand, plate badge"`

### Task 8: ChampionPlate

**Files:**
- Create: `components/ChampionPlate.tsx`, `test/plate.test.tsx`

**Interfaces:**
- Consumes: `Champion`.
- Produces: `<ChampionPlate champion={Champion} />` — the SVG medallion; renders champion `manager`, `team`, `season`, and `nationalRank`; the floral ring built from a rose motif repeated around the circle (14×).

- [ ] **Step 1: Write the failing test**
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ChampionPlate from "@/components/ChampionPlate";
import champions from "@/data/champions.json";

it("engraves the reigning champion", () => {
  render(<ChampionPlate champion={champions[0] as any} />);
  expect(screen.getByText("JET CHAN")).toBeInTheDocument();
  expect(screen.getByText(/RisingGunner2026/)).toBeInTheDocument();
  expect(screen.getByText(/Malaysia Rank 30th/)).toBeInTheDocument();
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement `components/ChampionPlate.tsx`** — port the `.plate` markup + the floral-ring generator from `docs/superpowers/mockups/dashboard.html`. Generate the 14 rose groups + leaves at module scope (deterministic, no runtime JS needed — compute the transforms in the component body and render `<g>` elements), so it works server-rendered. Fields come from props: `season`, `manager`, `team`, `totalPoints`, `nationalRank`.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: champion plate medallion"`

### Task 9: Compose the dashboard page

**Files:**
- Modify: `app/page.tsx`
- Create: `test/page.test.tsx`

**Interfaces:**
- Consumes: `getDashboard`, `getReigningChampion`, `Header`, `HeroCards`, `Standings`, `ChampionPlate`.
- Produces: the `/` route — server component composing header → note → hero → standings → plate.

- [ ] **Step 1: Write the failing test**
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Page from "@/app/page";

it("renders the composed dashboard", () => {
  render(Page());
  expect(screen.getByText("Gunners League")).toBeInTheDocument();
  expect(screen.getByText("Current Leader")).toBeInTheDocument();
  expect(screen.getByText(/Classic League/)).toBeInTheDocument();
  expect(screen.getByText("JET CHAN")).toBeInTheDocument();
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement `app/page.tsx`**
```tsx
import { getDashboard, getReigningChampion } from "@/lib/data";
import Header from "@/components/Header";
import HeroCards from "@/components/HeroCards";
import Standings from "@/components/Standings";
import ChampionPlate from "@/components/ChampionPlate";

export default function Page() {
  const data = getDashboard();
  const champion = getReigningChampion();
  return (
    <main className="wrap">
      <Header meta={data.meta} />
      <p className="note">
        <span><b>{data.meta.managerCount} managers</b> · Standings final through Gameweek {data.meta.lastFinishedGw} · updates automatically after each gameweek settles</span>
      </p>
      <HeroCards data={data} />
      <Standings rows={data.standings} totalCount={data.meta.managerCount} />
      <section className="prize">
        {/* prize heading (port from mockup) */}
        <ChampionPlate champion={champion} />
      </section>
    </main>
  );
}
```
Port the outer `.wrap`, `.note`, and prize-heading markup/classes from the mockup.
- [ ] **Step 4: Run to verify it passes** → PASS. Then `npm run build` succeeds.
- [ ] **Step 5: Commit** — `git commit -m "feat: compose dashboard page"`

---

## Phase 4 — Gameweek Report feature

### Task 10: Poster component

**Files:**
- Create: `components/report/Poster.tsx`, `test/poster.test.tsx`

**Interfaces:**
- Consumes: `Dashboard`, `AngleId`, `posterHighlight`, `formatDeadlineMYT`, `CannonLogo`.
- Produces: `<Poster data={Dashboard} angle={AngleId} />` — the 4:5 shareable card: header, dynamic highlight line (`posterHighlight`), top-5 list, two honours, next deadline, footer URL. Pure/presentational so it can render inside `next/og`.

- [ ] **Step 1: Write the failing test**
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Poster from "@/components/report/Poster";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

it("renders top 5 and the deadline on the poster", () => {
  render(<Poster data={parseDashboard(sample)} angle="steady" />);
  expect(screen.getByText("Steve Strange")).toBeInTheDocument();
  expect(screen.getByText(/MYT/)).toBeInTheDocument();
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement `components/report/Poster.tsx`** — port `.poster` markup from `docs/superpowers/mockups/gw-report.html`; drive top-5 from `data.standings.slice(0,5)`, honours from `weeklyTop`/`highestGw`, deadline via `formatDeadlineMYT(data.meta.nextGw.deadlineUtc)`, highlight via `posterHighlight(data, angle)`.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: report poster component"`

### Task 11: Caption component (client)

**Files:**
- Create: `components/report/Caption.tsx`, `test/caption.test.tsx`

**Interfaces:**
- Consumes: `Dashboard`, `ANGLES`, `selectAngle`, `buildCaption`, `posterHighlight`.
- Produces: `<Caption data={Dashboard} onAngleChange?={(id: AngleId) => void} />` — `'use client'`. Auto-selects the angle via `selectAngle(data.report.flags)`, renders variant chips (the auto one marked), shows the built caption, a Copy button (clipboard + fallback), and a Share button (`navigator.share` when available; always copies caption too). Calls `onAngleChange` so a parent can sync the poster highlight.

- [ ] **Step 1: Write the failing test**
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Caption from "@/components/report/Caption";
import { parseDashboard } from "@/lib/types";
import sample from "@/test/fixtures/dashboard.sample.json";

it("copies the caption to the clipboard", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<Caption data={parseDashboard(sample)} />);
  await userEvent.click(screen.getByRole("button", { name: /copy caption/i }));
  expect(writeText).toHaveBeenCalledOnce();
  expect(writeText.mock.calls[0][0]).toContain("FPL Season 6");
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement `components/report/Caption.tsx`** — port `.tabs`/`.caption`/`.copybtn` from the mockup; `useState` for `current` (init `selectAngle(flags)`); chips from `ANGLES`; `buildCaption(data, current)`; copy handler (`navigator.clipboard.writeText` with `execCommand` fallback); share handler (`navigator.share({title, text})` guarded, plus clipboard copy). Fire `onAngleChange?.(current)` on change/mount.
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: adaptive report caption with copy/share"`

### Task 12: Report page

**Files:**
- Create: `app/report/page.tsx`, `test/reportpage.test.tsx`

**Interfaces:**
- Consumes: `getDashboard`, `Poster`, `Caption`.
- Produces: `/report` route. Renders `<Poster>` + `<Caption>` side by side; a small client wrapper syncs the poster's angle to the caption's selection (lift `current` into a `'use client'` container `ReportClient` that renders both). Provide a Download button that links to the og image (`/report/opengraph-image`).

- [ ] **Step 1: Write the failing test**
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReportPage from "@/app/report/page";

it("renders poster and caption", () => {
  render(ReportPage());
  expect(screen.getByText(/本週總榜前五/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /copy caption/i })).toBeInTheDocument();
});
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement** `app/report/page.tsx` (server: loads data, renders a `'use client'` `components/report/ReportClient.tsx` that holds `angle` state and renders `<Poster data angle>` + `<Caption data onAngleChange>`). Port the `.grid`/lede/actions layout from the mockup.
- [ ] **Step 4: Run to verify it passes** → PASS. `npm run build` succeeds.
- [ ] **Step 5: Commit** — `git commit -m "feat: /report generator page"`

### Task 13: Poster PNG via next/og

**Files:**
- Create: `app/report/opengraph-image.tsx`
- Create/verify: a bundled CJK font file under `app/report/` (e.g. `NotoSansTC-Bold.ttf`, subset)

**Interfaces:**
- Produces: a PNG image response at build/request for `/report` — the poster rendered by `ImageResponse`, with a Traditional-Chinese-capable font embedded so the caption text renders (no tofu).

- [ ] **Step 1: Add a CJK font**

Download a Noto Sans TC weight (or subset it to the glyphs used) into `app/report/NotoSansTC-Bold.ttf`. (next/og / Satori needs the actual font bytes — system fonts aren't available.) Keep it reasonably small; subset if needed with `fonttools`.

- [ ] **Step 2: Implement `app/report/opengraph-image.tsx`**
```tsx
import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { getDashboard } from "@/lib/data";
import { selectAngle, posterHighlight, formatDeadlineMYT } from "@/lib/report";

export const size = { width: 1080, height: 1350 };
export const contentType = "image/png";

export default async function Image() {
  const d = getDashboard();
  const angle = selectAngle(d.report.flags);
  const font = fs.readFileSync(path.join(process.cwd(), "app/report/NotoSansTC-Bold.ttf"));
  return new ImageResponse(
    (
      // JSX mirroring components/report/Poster.tsx with inline styles (Satori needs inline styles, not Tailwind)
      <div style={{ /* ...poster layout... */ }}> {/* port from Poster.tsx, using inline styles */} </div>
    ),
    { ...size, fonts: [{ name: "Noto Sans TC", data: font, weight: 700, style: "normal" }] }
  );
}
```
Port the visual structure from `Poster.tsx`, converting Tailwind classes to inline styles (Satori requires inline styles and a subset of CSS — fl…exbox only, no CSS vars). Pull the same data (`top5`, honours, `formatDeadlineMYT`, `posterHighlight`).

- [ ] **Step 3: Verify it renders**

Run `npm run dev`, open `http://localhost:3000/report/opengraph-image` — expect a PNG with Chinese text rendering correctly. Then `npm run build` succeeds.

- [ ] **Step 4: Commit**
```bash
git add app/report/opengraph-image.tsx app/report/NotoSansTC-Bold.ttf
git commit -m "feat: report poster PNG via next/og with CJK font"
```

---

## Phase 5 — E2E

### Task 14: Playwright smoke flows

**Files:**
- Create: `playwright.config.ts`, `e2e/dashboard.spec.ts`, `e2e/report.spec.ts`

**Interfaces:**
- Produces: E2E coverage for the two routes against `npm run build && npm start`.

- [ ] **Step 1: Install + configure**
```bash
npm i -D @playwright/test && npx playwright install --with-deps chromium
```
`playwright.config.ts` with `webServer: { command: "npm run build && npm start", url: "http://localhost:3000", timeout: 120000 }`, `testDir: "e2e"`.

- [ ] **Step 2: Write `e2e/dashboard.spec.ts`**
```ts
import { test, expect } from "@playwright/test";
test("dashboard: cards, expand, search, plate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Current Leader")).toBeVisible();
  await page.getByRole("button", { name: /show top 20/i }).click();
  await page.getByPlaceholder(/find manager/i).fill("Gunner92");
  await expect(page.getByText("soo sheng")).toBeVisible();
  await expect(page.getByText("JET CHAN")).toBeVisible();
});
```

- [ ] **Step 3: Write `e2e/report.spec.ts`**
```ts
import { test, expect } from "@playwright/test";
test("report: poster + caption + copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/report");
  await expect(page.getByText("本週總榜前五")).toBeVisible();
  await page.getByRole("button", { name: /copy caption/i }).click();
  await expect(page.getByRole("button", { name: /copied/i })).toBeVisible();
});
```

- [ ] **Step 4: Run** — `npx playwright test` → PASS (add `"e2e": "playwright test"` to scripts).
- [ ] **Step 5: Commit** — `git commit -m "test: e2e dashboard and report flows"`

---

## Phase 6 — Pipeline: JSON snapshot + gate

> All pure functions are TDD'd with fixtures; I/O wrappers are thin. The snapshot builder reads the Google Sheets the existing pipeline already populated (decoupled from `data_pipeline.py` internals) plus `bootstrap-static`.

### Task 15: Snapshot builder (pure)

**Files:**
- Create: `snapshot/__init__.py`, `snapshot/build.py`, `tests/fixtures/sheets.sample.json`, `tests/fixtures/bootstrap.sample.json`, `tests/test_build.py`

**Interfaces:**
- Produces: `build_dashboard(sheets: dict[str, list[dict]], bootstrap: dict, config: dict, prev_meta: dict | None) -> dict` returning a dict matching the §7 JSON contract (validated later by the frontend's zod schema).
- `sheets` keys used: `classic_league_standings`, `highest_gw_score`, `most_weekly_wins`, `weekly_manager_log`, `metadata`. `config` provides `leagueNameEn`, `seasonLabel`, `leagueId`.

- [ ] **Step 1: Create fixtures** — `tests/fixtures/sheets.sample.json` with small realistic rows for each sheet (5 standings rows incl. the real GW1 names; a `weekly_manager_log` row for GW1; `highest_gw_score` and `most_weekly_wins` single rows; `metadata` with `last_finished_gw`, `last_updated_utc`). `tests/fixtures/bootstrap.sample.json` with an `events` array where GW1 `{finished:true,data_checked:true}` and GW2 `{is_next:true, deadline_time:"2026-08-30T10:00:00Z"}`.

  > Before writing fixtures, confirm the **actual column headers** of each sheet by opening the live Google Sheet (or inspecting `data_pipeline.py`'s write calls). Map them explicitly in `build.py` (e.g. standings `Standings`/`Manager`/`Total`, weekly log `Gameweek`/`Manager`/`Score`). Adjust the mapping to the real headers — this is a required verification, not a guess.

- [ ] **Step 2: Write the failing test** `tests/test_build.py`
```python
import json, pathlib
from snapshot.build import build_dashboard

FX = pathlib.Path(__file__).parent / "fixtures"

def load(name): return json.loads((FX / name).read_text())

def test_build_dashboard_shapes_core_fields():
    sheets = load("sheets.sample.json"); bootstrap = load("bootstrap.sample.json")
    cfg = {"leagueId": 1022594, "leagueNameEn": "Gunners League", "seasonLabel": "Season 6"}
    d = build_dashboard(sheets, bootstrap, cfg, prev_meta=None)
    assert d["meta"]["leagueNameEn"] == "Gunners League"
    assert d["meta"]["nextGw"]["number"] == 2
    assert d["standings"][0]["rank"] == 1
    assert d["weeklyTop"]["gw"] == d["meta"]["lastFinishedGw"]
    assert "flags" in d["report"]
```

- [ ] **Step 3: Run to verify it fails** — `python -m pytest tests/test_build.py -q` → FAIL (no module).

- [ ] **Step 4: Implement `snapshot/build.py`** — pure transforms: map standings rows → `standings[]` (rank, lastRank via FPL `last_rank` if present else 0, manager, team, gwPoints, total); `highestGw` from the sheet; `mostMotw` from the sheet; `weeklyTop` from the `weekly_manager_log` row whose gameweek == `last_finished_gw`; `meta` from `metadata` + `bootstrap` (next event → `nextGw.number`/`deadlineUtc`, latest final event → `lastFinishedGw`); `report.flags` delegated to `snapshot.flags.compute_flags(...)` (Task 16). Return the assembled dict.

- [ ] **Step 5: Run to verify it passes** — Expected: PASS.
- [ ] **Step 6: Commit** — `git commit -m "feat(pipeline): pure dashboard-snapshot builder"`

### Task 16: Report flags (pure)

**Files:**
- Create: `snapshot/flags.py`, `tests/test_flags.py`

**Interfaces:**
- Consumes: parsed standings, weeklyTop, highestGw, and `prev_meta` (last committed meta, or None).
- Produces: `compute_flags(standings, weekly_top, highest_gw, prev_record, prev_leader) -> dict` returning `{recordBroken, leaderChanged, prevLeader, gapToSecond, weeklyTopScore}`.

- [ ] **Step 1: Write the failing test** `tests/test_flags.py`
```python
from snapshot.flags import compute_flags

def test_flags_detect_leader_change_and_gap():
    standings = [{"manager":"A","total":100},{"manager":"B","total":97}]
    f = compute_flags(standings, weekly_top={"score":80}, highest_gw={"score":110},
                      prev_record=110, prev_leader="B")
    assert f["leaderChanged"] is True
    assert f["prevLeader"] == "B"
    assert f["gapToSecond"] == 3
    assert f["recordBroken"] is False
    assert f["weeklyTopScore"] == 80

def test_flags_record_broken():
    standings = [{"manager":"A","total":100},{"manager":"B","total":90}]
    f = compute_flags(standings, weekly_top={"score":80}, highest_gw={"score":115},
                      prev_record=110, prev_leader="A")
    assert f["recordBroken"] is True
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement `snapshot/flags.py`**
```python
def compute_flags(standings, weekly_top, highest_gw, prev_record, prev_leader):
    leader = standings[0]["manager"] if standings else ""
    gap = (standings[0]["total"] - standings[1]["total"]) if len(standings) > 1 else 999
    return {
        "recordBroken": prev_record is not None and highest_gw["score"] > prev_record,
        "leaderChanged": bool(prev_leader) and leader != prev_leader,
        "prevLeader": prev_leader or "",
        "gapToSecond": int(gap),
        "weeklyTopScore": int(weekly_top["score"]),
    }
```
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(pipeline): report flag computation"`

### Task 17: Gate (pure) + I/O + entry point

**Files:**
- Create: `snapshot/gate.py`, `snapshot/io.py`, `build_snapshot.py`, `tests/test_gate.py`

**Interfaces:**
- Produces:
  - `latest_final_gw(bootstrap: dict) -> int` — max event id with `finished and data_checked`.
  - `should_rebuild(bootstrap: dict, prev_meta: dict | None) -> bool` — True if `latest_final_gw > prev_meta.lastFinishedGw` (or `prev_meta is None`).
  - `snapshot/io.py`: `read_sheets()`, `fetch_bootstrap()`, `read_prev(path)`, `write_json(path, obj)` (thin wrappers; `read_sheets` reuses the gspread connection logic from `data_pipeline.py`/`app.py`).
  - `build_snapshot.py`: orchestrates gate → build → write to `data/dashboard.json`.

- [ ] **Step 1: Write the failing test** `tests/test_gate.py`
```python
from snapshot.gate import latest_final_gw, should_rebuild

BOOT = {"events": [
    {"id":1,"finished":True,"data_checked":True},
    {"id":2,"finished":True,"data_checked":False},
]}

def test_latest_final_gw():
    assert latest_final_gw(BOOT) == 1

def test_should_rebuild_true_when_new_final():
    assert should_rebuild(BOOT, {"lastFinishedGw": 0}) is True

def test_should_rebuild_false_when_same():
    assert should_rebuild(BOOT, {"lastFinishedGw": 1}) is False

def test_should_rebuild_true_when_no_prev():
    assert should_rebuild(BOOT, None) is True
```
- [ ] **Step 2: Run to verify it fails** → FAIL.
- [ ] **Step 3: Implement `snapshot/gate.py`**
```python
def latest_final_gw(bootstrap):
    finals = [e["id"] for e in bootstrap.get("events", []) if e.get("finished") and e.get("data_checked")]
    return max(finals) if finals else 0

def should_rebuild(bootstrap, prev_meta):
    if prev_meta is None: return True
    return latest_final_gw(bootstrap) > int(prev_meta.get("lastFinishedGw", -1))
```
- [ ] **Step 4: Run to verify it passes** → PASS.
- [ ] **Step 5: Implement `snapshot/io.py` + `build_snapshot.py`** — `io.read_sheets()` reuses the service-account/gspread connection from `data_pipeline.py` (import or copy the auth helper) and returns `{title: worksheet.get_all_records()}`; `fetch_bootstrap()` GETs `https://fantasy.premierleague.com/api/bootstrap-static/` with the `User-Agent` header; `read_prev("data/dashboard.json")` returns `.meta` or None. `build_snapshot.py`:
```python
import json
from snapshot import io, gate, build

def main():
    bootstrap = io.fetch_bootstrap()
    prev = io.read_prev("data/dashboard.json")
    if not gate.should_rebuild(bootstrap, prev):
        print("No new final gameweek — skipping."); return
    sheets = io.read_sheets()
    cfg = {"leagueId": 1022594, "leagueNameEn": "Gunners League", "seasonLabel": "Season 6"}
    dashboard = build.build_dashboard(sheets, bootstrap, cfg, prev)
    io.write_json("data/dashboard.json", dashboard)
    print(f"Wrote snapshot for GW {dashboard['meta']['lastFinishedGw']}.")

if __name__ == "__main__":
    main()
```
- [ ] **Step 6: Manual verify** — with real credentials available, run `python build_snapshot.py` and confirm `data/dashboard.json` validates against the frontend by running `npm run build` (the zod parse runs at build). Fix any header-mapping mismatches surfaced here.
- [ ] **Step 7: Commit** — `git commit -m "feat(pipeline): gate + io + build_snapshot entry point"`

### Task 18: Update the GitHub Actions workflow

**Files:**
- Modify: `.github/workflows/run_fpl_pipeline.yml`

**Interfaces:**
- Produces: hourly gated workflow that runs the existing pipeline + snapshot and commits `data/dashboard.json` only when it changes.

- [ ] **Step 1: Edit the workflow**

Change `schedule.cron` to `'0 * * * *'` (hourly). Keep `workflow_dispatch`. After the existing "Run FPL Data Pipeline" step, add:
```yaml
      - name: Build dashboard snapshot (gated)
        run: python3 build_snapshot.py
        env:
          GCP_CREDENTIALS: ${{ secrets.GCP_CREDENTIALS }}

      - name: Commit snapshot if changed
        run: |
          if ! git diff --quiet -- data/dashboard.json; then
            git config user.name "fpl-bot"
            git config user.email "fpl-bot@users.noreply.github.com"
            git add data/dashboard.json
            git commit -m "data: update dashboard snapshot [skip ci]"
            git push
          else
            echo "No snapshot change — nothing to commit."
          fi
```
Ensure the job has `permissions: contents: write` and `actions/checkout` uses the default token that can push.

> Optimisation (optional): gate the expensive `data_pipeline.py` step too, by running a lightweight "check latest final GW" first and short-circuiting the job when there's nothing new. Not required for correctness — `build_snapshot.py` already no-ops, and `data_pipeline.py` is idempotent.

- [ ] **Step 2: Validate YAML** — `python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/run_fpl_pipeline.yml'))"` → no error.
- [ ] **Step 3: Commit** — `git commit -m "ci: gated hourly snapshot + auto-commit"`

---

## Phase 7 — Deploy handoff (docs only; no Vercel work by Claude)

### Task 19: README + Vercel handoff checklist

**Files:**
- Create: `docs/DEPLOY.md`
- Modify: `README.md` (add a "New Next.js dashboard" section pointing to DEPLOY.md)

**Interfaces:**
- Produces: a short, correct checklist the user follows to stand up Vercel.

- [ ] **Step 1: Write `docs/DEPLOY.md`** covering:
  - The user creates a Vercel project, imports this GitHub repo, framework preset **Next.js**, root directory = repo root.
  - Set the production domain; then update `DASHBOARD_URL` in `lib/report.ts` to that domain and commit.
  - Confirm the GitHub Action has `contents: write` permission and can push (Settings → Actions → Workflow permissions → Read and write).
  - Verify the loop: trigger `workflow_dispatch`, confirm a snapshot commit appears and Vercel auto-deploys.
  - Retire the Streamlit app once the new site is verified.
- [ ] **Step 2: Commit** — `git commit -m "docs: deploy + Vercel handoff checklist"`

---

## Self-Review

**Spec coverage:**
- Hosting/no-sleep, static JSON, commit→deploy → Tasks 1, 9, 18, 19. ✓
- Two-clock gated refresh (§5.1) → Tasks 17, 18. ✓
- Data contract (§7) → Tasks 2, 15. ✓
- Three sections + plate (§6) → Tasks 5–9. ✓
- Champion plate self-updating (§6/§7.3) → Task 8 (+ `champions.json` manual). ✓
- Report generator (§16): poster, adaptive caption, MYT deadline, next/og, share → Tasks 3, 10–13. ✓
- Design tokens/fonts/EN UI (§9) → Task 4. ✓
- Tailwind, static render, zod (§10) → Tasks 1, 2, 4. ✓
- Testing (§13) → every task (TDD) + Task 14 (E2E) + Tasks 15–17 (pipeline). ✓
- Phase 2 live layer (§8) → intentionally deferred; Header/`liveGw` leaves the hook (Task 5). ✓

**Placeholder scan:** The only intentional in-code TODOs are `DASHBOARD_URL` (documented, resolved in Task 19) and the `opengraph-image` inline-style port (concrete instruction to mirror `Poster.tsx`). The dead `url` line in Task 3's `buildCaption` is explicitly flagged for removal before the test run. Fixture headers in Task 15 carry a required verification step against the live sheet.

**Type consistency:** `Dashboard`/`Manager`/`ReportFlags`/`AngleId` names and the `buildCaption(d, id)` / `selectAngle(f)` / `formatDeadlineMYT(iso)` / `posterHighlight(d, id)` signatures are used identically across Tasks 2, 3, 10, 11, 13. Pipeline `build_dashboard` / `compute_flags` / `should_rebuild` / `latest_final_gw` signatures match across Tasks 15–18.
