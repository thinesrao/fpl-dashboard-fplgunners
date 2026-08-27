# FPL Gunners League Dashboard — Redesign & Migration Spec

**Date:** 2026-08-27
**Status:** Draft for review
**Author:** thinesrao (with Claude)

---

## 1. Problem

The dashboard runs on Streamlit Community Cloud, which **sleeps after inactivity** — the
first visitor after idle waits through a cold spin-up. With a growing audience (126 managers
and climbing) this is the wrong hosting model. We also want a genuine visual **upgrade**, not
a port of the existing 3-tab table dump.

## 2. Goals

- **Always-warm hosting** on Vercel (no sleeping), where the user already runs projects.
- A **redesigned, entertaining + informative** dashboard focused on what this league cares about.
- **Keep the data pipeline's logic intact** — reuse the existing FPL → Google Sheets computation.
- **Smarter refresh** that reacts to when gameweeks actually settle, instead of a blind 6-hour cron.
- Feature the league's real prize — the **engraved Champion's Plate** — as the emotional anchor.
- Provide a **Gameweek Report generator** (§16) so the admin can post the Facebook 戰報 in one click.

## 3. Non-goals (v1)

- Surfacing the full award catalogue. The pipeline computes ~20 special awards, H2H, monthly
  winners, cup, etc. **v1 shows only three things** (see §6). The rest stays computed but hidden.
- Live in-match scoring (deferred to Phase 2, §8).
- User accounts / auth / personalization.
- Migrating the data store off Google Sheets (Sheets stays as the pipeline's working store).

## 4. Key insight — the architecture is already split

```
FPL API ──► data_pipeline.py (GitHub Actions cron) ──► Google Sheets
                                                            │
                                                     app.py (Streamlit) reads Sheets
```

The pipeline and the frontend are **already decoupled**; Google Sheets is the boundary. So this
is **not a backend migration** — it's replacing the *reader* (Streamlit) and adding one small
output to the pipeline. The pipeline's computation stays exactly as-is.

## 5. Target architecture

```
FPL API ──► data_pipeline.py (GitHub Actions, gated hourly)
                 │
                 ├──► Google Sheets            (unchanged working store)
                 └──► data/dashboard.json  ──► git commit ──► Vercel auto-deploy
                                                                    │
                                                    Next.js (App Router, static) reads the JSON
```

### 5.1 Two clocks (the refresh model)

The current blind 6-hour cron is both wasteful (redeploys when nothing changed) and laggy
(up to 6h stale after scores finalize). Replace with an **event-gated** schedule:

- **Settled snapshot (the committed JSON).** GitHub Action runs **hourly but gated**: each run
  cheaply fetches `bootstrap-static`, finds the highest event with `finished == true &&
  data_checked == true` (the ~9am-UK-next-day lockdown), and compares it to `meta.lastFinishedGw`
  in the committed JSON.
  - If no newer final gameweek → exit in seconds. No pipeline, no commit, no redeploy.
  - If newer → run the full pipeline, regenerate `dashboard.json`, commit, push → one Vercel deploy.
  - Net: **~1 redeploy per gameweek** (well within Vercel's free tier), and the site updates
    within an hour of scores going final — automatically, regardless of each week's kickoff times.
    This removes the hard-coded 6-hour assumption entirely.

- **Live in-match layer** — deferred, see §8.

### 5.2 Why static JSON + commit-to-deploy

Data changes at most once per gameweek and every visitor sees the same thing — the textbook case
for a **static snapshot served from Vercel's CDN**. No per-request Google Sheets calls, no API
quotas, sub-second loads, scales to any audience for ~free. The JSON is committed to the repo, so
Next.js bakes it in at build and serves it fully static; the pipeline's push is what triggers the
rebuild. Chosen over Blob/ISR for simplicity — zero extra infra or tokens.

### 5.3 Repository & hosting

- **Single repo.** The Next.js app lives at the repo root; the existing Python pipeline files
  remain (they only run in GitHub Actions, Vercel ignores them). Vercel deploys the Next app.
- **Data location:** `data/dashboard.json`, imported by the root Server Component at build time.
- **Champion history:** `data/champions.json`, hand-maintained (one entry per season, §7.3).

## 6. What the page shows (v1)

Single scrolling page. Top → bottom:

1. **Header** — cannon logo (inline SVG, Arsenal red), "Gunners League" with 槍迷之家超級聯賽 as
   subtitle, and a live-gameweek pill (Phase 2; hidden until then).
2. **Three status cards (hero):**
   - **Current Leader** — standings #1: manager, team, total points, "Chasing the plate" chip.
   - **Highest Gameweek Score** — from `highest_gw_score`: manager, team, score, which GW.
   - **Most Manager of the Week** — from `most_weekly_wins`: manager, team, win count, last-win GW.
3. **Classic League standings** — top 3 shown by default; **"Show top 20 ▾" expands/collapses**;
   a search box filters all 126 by manager or team name. Rank, manager + team, movement (▲▼/NEW),
   GW points, total. Podium tint on top 3; the leader row wears the mini **plate badge**. Ties
   render correctly (real data has 7,7,7 / 11,11,11,11).
4. **The Champion's Plate** — a CSS/SVG **digital twin** of the physical engraved plate (floral
   ring, crown, 枪迷之家, "CHAMPION", winner in laurels, points + national rank). Honors the
   reigning champion and **re-engraves automatically** each season from `champions.json`. Closes
   the page: "126 managers. One plate."

**Reference mockup:** the approved visual is the published artifact (Palette B — "Electric Mint",
English UI). Design tokens in §9.

## 7. Data contract — `data/dashboard.json`

Generated by the pipeline; validated with a schema (zod) at build. Shape:

```jsonc
{
  "meta": {
    "leagueId": 1022594,
    "leagueName": "🏆 槍迷之家超級聯賽 🏆",   // real FPL name
    "leagueNameEn": "Gunners League",         // display title
    "managerCount": 126,
    "lastFinishedGw": 1,
    "lastUpdatedUtc": "2026-08-27T21:40:00Z",
    "liveGw": null                            // set in Phase 2 during matches
  },
  "standings": [
    { "rank": 1, "lastRank": 0, "entryId": 4778037,
      "manager": "Steve Strange", "team": "The Marvel 11",
      "gwPoints": 96, "total": 96 }
    // …all managers, in rank order
  ],
  "highestGw": {
    "manager": "Danny Chong", "team": "Danny's Team", "score": 121, "gw": 9,
    "runnersUp": [ { "manager": "…", "score": 118 }, … ]
  },
  "mostMotw": {
    "manager": "Liang Arsenal", "team": "liang", "wins": 4, "lastWinGw": 12,
    "runnersUp": [ { "manager": "…", "wins": 3 }, … ]
  }
}
```

`champions.json` (separate, manually maintained):

```jsonc
[
  { "season": "2025/26", "manager": "JET CHAN", "team": "RisingGunner2026",
    "totalPoints": 2431, "nationalRank": "Malaysia Rank 30th" }
]
```

### 7.1 Source mapping (existing sheets → JSON)
- `standings` ← `classic_league_standings` (+ `lastRank` from FPL API `last_rank`).
- `highestGw` ← `highest_gw_score`.
- `mostMotw` ← `most_weekly_wins`.
- `meta` ← `metadata` sheet + `bootstrap-static`.

### 7.2 Movement column
`lastRank` comes from the FPL standings API (`last_rank`). At GW1 it's `0` → render **NEW**.

### 7.3 Champion national rank — open question
The engraved "Malaysia Rank" is not trivially exposed per-manager by the league API. **Recommended:**
keep it a manual field in `champions.json` (updated once per season — negligible effort). Confirm
during build whether `entry/{id}/` history exposes a usable national rank; if so, automate later.

## 8. Phase 2 — live in-match layer (deferred)

Kept fully separate from the settled snapshot so it never triggers redeploys:
- A Next.js Route Handler proxies FPL `event/{gw}/live` + league standings (avoids browser CORS).
- The client polls it (~60s) **only while a gameweek is live** (`meta.liveGw` set).
- A "🔴 LIVE" pill activates; hero/standings numbers tick during matches.
Design already reserves the pill and `meta.liveGw`. Not built in v1.

## 9. Design tokens

- **Palette B — Electric Mint (committed dark):**
  `--bg:#08090c` · `--surface:#12141a` · `--line:#242835` · `--text:#e7ecef` ·
  `--muted:#828d9c` · `--mint:#2bfca4` (primary) · `--gold:#ffb020` · `--hot:#ff3dae` ·
  logo `#EF0107` (Arsenal red, brand mark only).
- **Type:** Archivo (display/scoreboard headings), Barlow (body/data, tabular figures),
  Playfair Display (plate engraving). Loaded via `next/font`.
- **Language:** English UI; real Chinese league name shown as subtitle + on the plate.

## 10. Tech stack

- **Next.js (App Router, TypeScript)**, statically rendered (no runtime data fetch in v1).
- **Tailwind CSS v4** with the §9 tokens as CSS variables (or CSS Modules — decide in plan).
- **No database, no charts** — the three v1 sections need neither.
- **zod** to validate `dashboard.json` at build (fail the build on malformed data).
- Client-only interactivity: standings search + expand (one client component).

## 11. Component structure (proposed)

```
app/
  layout.tsx            fonts, tokens, metadata
  page.tsx              server component; imports data, composes sections
  report/
    page.tsx            report generator (poster preview + caption + share/copy)
    opengraph-image.tsx next/og ImageResponse — the poster PNG (CJK font embedded)
components/
  Header.tsx            cannon logo + titles + (Phase 2) live pill
  HeroCards.tsx         3 status cards
  Standings.tsx         'use client' — search + expand + plate badge
  ChampionPlate.tsx     SVG medallion (props: champion)
  CannonLogo.tsx        inline SVG mark
  report/
    Poster.tsx          the shareable card (shared by page + og image)
    Caption.tsx         'use client' — variant selector, copy, Web Share
lib/
  data.ts               load + zod-validate dashboard.json / champions.json
  report.ts             caption variants + angle auto-selection + MYT deadline format
data/
  dashboard.json        pipeline output (committed)
  champions.json        manual
```

## 12. Pipeline changes (the only backend work)

1. After the existing Sheets write, **serialize the three datasets + meta into `data/dashboard.json`**.
2. Wrap the Action in the **gate** (§5.1): check latest final GW vs committed `meta.lastFinishedGw`.
3. On new data: `git add data/dashboard.json && commit && push` (Action uses `GITHUB_TOKEN`).
4. Update the workflow schedule to hourly; keep `workflow_dispatch`.
All existing computation is untouched.

## 13. Testing

- **Unit:** `lib/data.ts` zod schema (valid + malformed fixtures); movement/tie formatting helpers.
- **Component:** Standings search filters correctly, expand/collapse toggles, ties render, empty state.
- **E2E (Playwright):** page loads, three cards present, expand reveals 20, search finds a manager,
  plate renders champion name.
- **Report:** `lib/report.ts` angle-selection (each flag combination picks the right variant; priority
  order holds), MYT deadline formatting, caption assembly; `opengraph-image` renders without error and
  embeds the CJK font.
- **Pipeline:** unit-test the JSON serializer against a Sheets fixture; test the gate (no-new-data
  → no commit; new-data → commit).

## 14. Rollout

1. Scaffold Next.js app in-repo; build the four components against a checked-in sample `dashboard.json`.
2. Add JSON emission + commit + gate to the pipeline; verify a real run produces valid JSON.
3. **Hand off to Vercel (user).** Once the code is complete, the user creates the Vercel project
   and imports this GitHub repo (root = Next app). Vercel then auto-deploys on the pipeline's commit.
4. Point a domain (chosen at that point) and verify a full gated cycle end-to-end.
5. Retire the Streamlit deployment (keep `app.py` in history).

## 15. Decisions & open questions

1. **Champion national rank** — ✅ **manual** field in `champions.json`, updated once per season.
2. **Vercel project / domain** — ✅ none yet; the user creates the Vercel project and imports the
   repo **after** the code is complete (§14.3). Domain decided at that point. No Vercel work by Claude.
3. **Styling** — ✅ **Tailwind CSS v4** with the §9 tokens as CSS variables.
4. **Cannon logo** — ✅ use the **original stylized cannon SVG** from the mockup (own vector
   interpretation, not a trace of the club's official artwork). The higher-fidelity attempt read
   worse; keep the clean simple mark.

## 16. Feature — Gameweek Report generator (Facebook 戰報)

A `/report` page that turns the latest gameweek into a ready-to-post Facebook update: a shareable
**poster graphic** + an **adaptive Chinese caption**. Reference mockup published as an artifact.

### Content (all data-driven except two config values)
- Header: league name + `seasonLabel` ("Season 6") + GW number.
- Top 5 of the standings (name + total).
- Honours: **單週最高分** (`weeklyTop`) and **賽季最高分紀錄** (`highestGw`).
- Next deadline: `nextGw.number` + `nextGw.deadlineUtc` converted to **MYT (UTC+8)** and formatted
  (e.g. "Sat 25 Oct · 01:30 MYT"). Auto-generated.
- Dashboard URL (the new Vercel site).

### Adaptive caption
The pipeline emits **week signals** (`report.flags`): `recordBroken`, `leaderChanged` (+`prevLeader`),
`gapToSecond`, `weeklyTopScore`. The generator auto-selects the highest-priority applicable angle —
🔥 新紀錄 › 👑 榜首易主 › ⚔️ 競爭白熱化 › 💥 神級單週 › 🏆 標準戰報 — which rewrites the intro
paragraph and the poster headline. The user can override the angle with a chip selector. All five
variant strings live in the frontend; only the signals come from the pipeline.

### Poster image
Rendered server-side with **`next/og` `ImageResponse`** at e.g. `/report/opengraph-image` (or an API
route), with a CJK font (Noto Sans TC) embedded so Chinese renders crisply. 4:5 ratio for social.
"⬇ Image" downloads the PNG.

### Sharing (honest scope)
"📤 Share" uses the **Web Share API** (`navigator.share` with the poster file) to open the phone's
native share sheet → user picks Facebook → the target group. **Limitation:** Facebook commonly strips
pre-filled caption text when an image is shared (esp. iOS), and neither the group nor an auto-post can
be selected programmatically. Mitigation: the app **copies the caption to the clipboard at share time**
so the user pastes it in the composer. Desktop (no `navigator.share`) falls back to Copy + Download.

### Config additions (manual, per season)
`meta.seasonLabel` ("Season 6"). Deadline text is auto-derived; no manual entry.

### Data contract additions
```jsonc
"meta": { …, "seasonLabel": "Season 6",
          "nextGw": { "number": 9, "deadlineUtc": "2026-10-25T17:30:00Z" } },
"weeklyTop": { "manager": "Danny Chong", "team": "…", "score": 89, "gw": 8 },
"report": { "flags": { "recordBroken": false, "leaderChanged": true,
            "prevLeader": "Liang Arsenal", "gapToSecond": 14, "weeklyTopScore": 89 } }
```
`weeklyTop` derives from the max single-GW score this gameweek (from the weekly log / live-final data).

## 17. Out of scope (computed but hidden)

H2H standings, monthly winners (classic + H2H), cup winner, and all ~20 special awards
(golden boot, playmaker, golden glove, best GK/DEF/MID/FWD, best VC, transfer/bench/dream-team/
shooting-stars/defensive/underdog/penalty/steady/free-hit/bench-boost/triple-captain kings). The
data contract can grow to include these when we surface them later.
