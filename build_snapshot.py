"""Entry point: orchestrates gate -> build -> write for data/dashboard.json.

Run with real credentials/network access:
    python3 build_snapshot.py
"""

import os

from snapshot import build, gate, io


def main():
    bootstrap = io.fetch_bootstrap()

    # io.read_prev returns the FULL previous dashboard dict (or None) — the
    # gate only needs its `.meta` section (specifically `lastFinishedGw`),
    # but build_dashboard needs the full dict to derive the previous record
    # (`highestGw.score`) and leader (`standings[0].manager`) for report
    # flags. See snapshot/build.py's `_prev_record_and_leader`.
    prev = io.read_prev("data/dashboard.json")
    prev_meta = prev["meta"] if prev else None

    # FORCE_REBUILD=1 bypasses the gate — used for a manual (workflow_dispatch)
    # backfill when the latest gameweek is already "processed" but we still
    # want to regenerate the snapshot from the freshly-written sheets.
    force = os.getenv("FORCE_REBUILD", "").strip().lower() in ("1", "true", "yes")

    if not force and not gate.should_rebuild(bootstrap, prev_meta):
        print("No new final gameweek — skipping.")
        return
    if force:
        print("FORCE_REBUILD set — regenerating snapshot regardless of gate.")

    sheets = io.read_sheets()
    cfg = {
        "leagueId": 1022594,
        "leagueNameEn": "Gunners League",
        "leagueName": "🏆 槍迷之家超級聯賽 🏆",
        "seasonLabel": "Season 7",
    }
    dashboard = build.build_dashboard(sheets, bootstrap, cfg, prev)
    io.write_json("data/dashboard.json", dashboard)
    print(f"Wrote snapshot for GW {dashboard['meta']['lastFinishedGw']}.")


if __name__ == "__main__":
    main()
