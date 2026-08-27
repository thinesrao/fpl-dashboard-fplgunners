# Deploy & Handoff Checklist

This is a manual checklist for standing up the Next.js dashboard on Vercel and
verifying the automated data loop that feeds it. Claude does not have Vercel
or GitHub repo-settings access — a human needs to work through this list.

## 1. Create the Vercel project

1. In the [Vercel dashboard](https://vercel.com/new), import this GitHub
   repository.
2. Framework preset: **Next.js** (auto-detected).
3. Root directory: repo root (this is a single Next.js app — no monorepo
   subfolder).
4. No environment variables are required for the Next.js app itself. The
   dashboard reads its data from the committed `data/dashboard.json` and
   `data/champions.json` files at build time — see `lib/data.ts`.
5. Deploy. Vercel will build with `next build --turbopack` (see
   `package.json`'s `build` script) and serve the static/SSR output.

## 2. Set the production domain, then update `DASHBOARD_URL`

1. In the Vercel project, add/confirm the production domain (e.g. a
   `vercel.app` domain or a custom domain).
2. Open `lib/report.ts` and update the `DASHBOARD_URL` constant — it currently
   defaults to a placeholder:

   ```ts
   export const DASHBOARD_URL = "https://fplgunners.vercel.app"; // TODO(config): set to the live domain at deploy time
   ```

   `DASHBOARD_URL` feeds the gameweek report generator's Open Graph / share
   links, so it needs to match whatever domain Vercel actually serves the app
   on.
3. Commit and push the change:

   ```bash
   git commit -am "chore: set DASHBOARD_URL to production domain"
   git push
   ```

   Vercel will auto-deploy on the push (see "Auto-deploy on commit" below).

## 3. Confirm the GitHub Action can push

The pipeline workflow (`.github/workflows/run_fpl_pipeline.yml`) already
declares `permissions: contents: write` at the job level, and its final step
commits `data/dashboard.json` and pushes directly. That job-level permission
is necessary but not sufficient — the **repository** setting must also allow
write access, or the push will fail with a 403 even though the workflow file
looks correct.

Check/set this once:

1. Repo **Settings → Actions → General → Workflow permissions**.
2. Select **"Read and write permissions"**.
3. Save.

## 4. Confirm the `GCP_CREDENTIALS` secret exists

The workflow's `Run FPL Data Pipeline` and `Build dashboard snapshot (gated)`
steps both read `secrets.GCP_CREDENTIALS` (the same service-account JSON
already used by the existing Streamlit pipeline). Confirm it's present under
**Settings → Secrets and variables → Actions**. If it's missing or has
expired, both `data_pipeline.py` and `build_snapshot.py` will fail at the
Google Sheets/Cloud auth step.

## 5. Verify the loop end-to-end

1. Go to the **Actions** tab → **FPL Data Pipeline** workflow → **Run
   workflow** (this uses the `workflow_dispatch` trigger already defined in
   the workflow file — no code change needed to trigger it manually).
2. Watch the run. It executes, in order:
   - `data_pipeline.py` — refreshes the Google Sheets data (existing
     pipeline, unchanged).
   - `build_snapshot.py` — the new gated step. It only writes/commits
     `data/dashboard.json` when there's a **new final gameweek** since the
     last snapshot (see `snapshot/gate.py`'s `should_rebuild`). If the last
     finished gameweek hasn't changed, this step prints "No new final
     gameweek — skipping." and does nothing — that's expected and correct,
     not a failure.
   - The "Commit snapshot if changed" step diffs `data/dashboard.json` and,
     if it changed, commits as `fpl-bot` and pushes with `[skip ci]` in the
     message.
3. If a commit landed, confirm Vercel picked it up: the project's
   **Deployments** tab should show a new deployment triggered by that commit,
   auto-built and promoted to production (standard Vercel Git integration —
   no extra config needed beyond the import in step 1).
4. If you need to force a snapshot write to test the commit → deploy path
   without waiting for a real new gameweek, temporarily edit or clear
   `data/dashboard.json`'s `meta.lastFinishedGw` so the gate sees it as
   stale, run the workflow, then revert.

## 6. Retire the Streamlit app

Once the Next.js dashboard is verified live on Vercel (steps 1–5 all green),
decommission the Streamlit deployment (`app.py` on Streamlit Cloud) — it's
superseded by the new dashboard. Keep the Streamlit code in the repo until
you're confident the new app has fully replaced it in daily use; there is no
rush to delete `app.py` itself.

## Known limitations to revisit after launch

These are accepted trade-offs, not bugs — documented here so they're not
mistaken for regressions:

1. **Unsubsetted CJK font.** `app/report/NotoSansTC-Bold.otf` is the full
   Noto Sans TC bold face (~16 MiB) used for Traditional Chinese captions in
   the gameweek report image. It works but bloats the report route's
   function/bundle size. Subset it to only the glyphs the report generator
   actually needs (English + digits + the Traditional Chinese caption
   vocabulary) before or shortly after launch.
2. **Standings movement always shows "NEW".** `standings[].lastRank` and
   `standings[].entryId` are `0` for every manager right now. The snapshot
   builder (`snapshot/build.py`) tries to read `last_rank`/`entry` columns
   from the Google Sheet rows, but `data_pipeline.py` doesn't write those
   columns today, so they always fall back to `0`. The `Movement` component
   (`components/Standings.tsx`) treats `lastRank === 0` as "no prior rank
   data" and renders `NEW` for every row instead of a real ▲/▼ delta. Fixing
   this requires `data_pipeline.py` to persist the previous rank (and
   ideally the FPL entry ID) per manager per gameweek.
3. **Champion `nationalRank` is manual.** `data/champions.json` (the
   season-champion plate) has its `nationalRank` field
   (e.g. `"Malaysia Rank 30th"`) maintained by hand, once per season, when
   that season's champion is decided. There's no pipeline step that computes
   or updates it — edit the file directly when a season wraps.

## Running the pipeline locally for a manual snapshot

```bash
export GCP_CREDENTIALS='{"type": "service_account", ...}'  # same JSON as the repo secret
python3 build_snapshot.py
```

This needs network access (FPL API + Google Sheets) and the same
`GCP_CREDENTIALS` the GitHub Action uses. It writes `data/dashboard.json`
directly if (and only if) the gate decides there's a new final gameweek to
snapshot — same gated behavior as the Action.

After writing a local snapshot, validate it against the app's zod schema by
running a Next.js build (`lib/data.ts` parses `data/dashboard.json` and
`data/champions.json` with `parseDashboard`/`parseChampions` at build time,
so a schema mismatch fails the build loudly instead of shipping bad data):

```bash
npm run build
```
