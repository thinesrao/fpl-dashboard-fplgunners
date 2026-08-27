"""Pure dashboard-snapshot builder.

Transforms Google-Sheets rows (`sheets`) + the FPL `bootstrap-static` payload
(`bootstrap`) into the `dashboard.json` contract consumed by the Next.js
frontend (validated against the zod schema in `lib/types.ts`).

No I/O happens in this module — it is a pure function of its inputs, which is
what makes it testable with static fixtures (see tests/test_build.py).

Real sheet column headers were confirmed by reading `data_pipeline.py`'s
`worksheets_to_write[...]` DataFrame construction (not guessed):
  - classic_league_standings: Standings, Team, Manager, Total, GW1..GWn
    (data_pipeline.py lines ~451-454; the `entry`/manager_id column is
    dropped after the merge on line 453, so no entry id survives into the
    sheet).
  - highest_gw_score: Standings, Team, Manager, Score, Achieved_GW
    (data_pipeline.py lines 422, 429-431).
  - most_weekly_wins: Standings, Team, Manager, Total_Wins, Last_Win_GW
    (data_pipeline.py lines 525-530).
  - weekly_manager_log: Gameweek, Team, Manager, Score
    (data_pipeline.py lines 533-536).
  - metadata: last_finished_gw, last_updated_utc
    (data_pipeline.py line 707).
app.py's rendering code (e.g. lines 231, 257-262, 270-275, 372-373) reads the
same headers and confirms this mapping.
"""

from snapshot.flags import compute_flags


def _num(value, default=0):
    """Best-effort numeric coercion for sheet cell values.

    gspread's `get_all_records()` typically returns already-typed ints/floats
    for numeric columns, but this stays defensive against blank cells or
    numeric strings.
    """
    if value is None or value == "":
        return default
    try:
        f = float(value)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return default


def _latest_final_gw(bootstrap):
    """Max event id that is both finished and data_checked."""
    finals = [
        e["id"]
        for e in bootstrap.get("events", [])
        if e.get("finished") and e.get("data_checked")
    ]
    return max(finals) if finals else 0


def _next_event(bootstrap):
    return next((e for e in bootstrap.get("events", []) if e.get("is_next")), None)


def _live_event(bootstrap):
    """The gameweek currently being played, if any (in progress, not yet finished)."""
    return next(
        (
            e
            for e in bootstrap.get("events", [])
            if e.get("is_current") and not e.get("finished")
        ),
        None,
    )


def _build_standings(rows, last_finished_gw):
    gw_key = f"GW{last_finished_gw}"
    standings = [
        {
            "rank": _num(row.get("Standings"), 0),
            # data_pipeline.py's classic_league_standings sheet has no
            # previous-rank column today. Accept one defensively (in case a
            # future pipeline revision adds it) and default to 0 per the
            # task-15 brief ("lastRank via FPL last_rank if present else 0").
            "lastRank": _num(row.get("last_rank", row.get("Last_Rank", 0)), 0),
            # KNOWN LIMITATION: no manager/entry id is written to
            # classic_league_standings by data_pipeline.py (the `entry`
            # column is dropped after the merge — see module docstring), so
            # entryId cannot be derived from the given inputs and defaults
            # to 0. Revisit if the frontend needs routing/keys by entry id.
            "entryId": _num(row.get("entry", row.get("EntryId", 0)), 0),
            "manager": row.get("Manager", ""),
            "team": row.get("Team", ""),
            "gwPoints": _num(row.get(gw_key), 0),
            "total": _num(row.get("Total"), 0),
        }
        for row in rows
    ]
    standings.sort(key=lambda r: r["rank"])
    return standings


def _build_highest_gw(rows):
    if not rows:
        return {"manager": "", "team": "", "score": 0, "gw": 0, "runnersUp": []}
    ordered = sorted(rows, key=lambda r: _num(r.get("Standings"), 999))
    winner = ordered[0]
    return {
        "manager": winner.get("Manager", ""),
        "team": winner.get("Team", ""),
        "score": _num(winner.get("Score"), 0),
        "gw": _num(winner.get("Achieved_GW"), 0),
        "runnersUp": [
            {"manager": r.get("Manager", ""), "score": _num(r.get("Score"), 0)}
            for r in ordered[1:]
        ],
    }


def _build_most_motw(rows):
    if not rows:
        return {"manager": "", "team": "", "wins": 0, "lastWinGw": 0, "runnersUp": []}
    ordered = sorted(rows, key=lambda r: _num(r.get("Standings"), 999))
    winner = ordered[0]
    return {
        "manager": winner.get("Manager", ""),
        "team": winner.get("Team", ""),
        "wins": _num(winner.get("Total_Wins"), 0),
        "lastWinGw": _num(winner.get("Last_Win_GW"), 0),
        "runnersUp": [
            {"manager": r.get("Manager", ""), "wins": _num(r.get("Total_Wins"), 0)}
            for r in ordered[1:]
        ],
    }


def _build_weekly_top(rows, last_finished_gw):
    row = next(
        (r for r in rows if _num(r.get("Gameweek"), -1) == last_finished_gw), None
    )
    if row is None:
        return {"manager": "", "team": "", "score": 0, "gw": last_finished_gw}
    return {
        "manager": row.get("Manager", ""),
        "team": row.get("Team", ""),
        "score": _num(row.get("Score"), 0),
        "gw": last_finished_gw,
    }


def _prev_record_and_leader(prev_meta):
    """Extract the previous run's record GW score and league leader.

    `prev_meta` is documented only as "dict | None" and its exact shape is
    not yet pinned down across tasks 15/17 (task 17's io.read_prev is
    described as returning the previous dashboard's `.meta` section, which
    does not itself carry a highest-score/leader; other readings pass the
    full previous dashboard dict). To stay correct under either shape:
      - if the dict already carries explicit `prevRecord`/`prevLeader` keys,
        use them directly;
      - else try to derive them from a full previous-dashboard shape
        (`highestGw.score`, `standings[0].manager`);
      - else degrade gracefully to (None, None), which compute_flags treats
        as "no prior record" / "no prior leader" (no flags raised).
    """
    if not prev_meta:
        return None, None
    if "prevRecord" in prev_meta or "prevLeader" in prev_meta:
        return prev_meta.get("prevRecord"), prev_meta.get("prevLeader")
    prev_record = (prev_meta.get("highestGw") or {}).get("score")
    prev_standings = prev_meta.get("standings") or []
    prev_leader = prev_standings[0]["manager"] if prev_standings else None
    return prev_record, prev_leader


def build_dashboard(sheets, bootstrap, config, prev_meta):
    """Transform sheet rows + FPL bootstrap into the dashboard.json contract."""
    last_finished_gw = _latest_final_gw(bootstrap)
    next_event = _next_event(bootstrap)
    live_event = _live_event(bootstrap)

    metadata_rows = sheets.get("metadata") or [{}]
    metadata = metadata_rows[0] if metadata_rows else {}

    standings = _build_standings(
        sheets.get("classic_league_standings", []), last_finished_gw
    )
    highest_gw = _build_highest_gw(sheets.get("highest_gw_score", []))
    most_motw = _build_most_motw(sheets.get("most_weekly_wins", []))
    weekly_top = _build_weekly_top(
        sheets.get("weekly_manager_log", []), last_finished_gw
    )

    prev_record, prev_leader = _prev_record_and_leader(prev_meta)
    flags = compute_flags(standings, weekly_top, highest_gw, prev_record, prev_leader)

    meta = {
        "leagueId": config["leagueId"],
        # config only defines leagueNameEn (see build_snapshot.py's cfg in
        # task-17-brief.md); fall back to it when a separate localized
        # leagueName isn't supplied.
        "leagueName": config.get("leagueName", config["leagueNameEn"]),
        "leagueNameEn": config["leagueNameEn"],
        "seasonLabel": config["seasonLabel"],
        "managerCount": len(standings),
        "lastFinishedGw": last_finished_gw,
        "lastUpdatedUtc": metadata.get("last_updated_utc", ""),
        "liveGw": live_event["id"] if live_event else None,
        "nextGw": {
            "number": next_event["id"] if next_event else 0,
            "deadlineUtc": next_event["deadline_time"] if next_event else "",
        },
    }

    return {
        "meta": meta,
        "standings": standings,
        "highestGw": highest_gw,
        "mostMotw": most_motw,
        "weeklyTop": weekly_top,
        "report": {"flags": flags},
    }
