"""Pure gate logic: should the snapshot pipeline rebuild dashboard.json?

No I/O — a pure function of the FPL `bootstrap-static` payload and the
previous run's `meta` section, which is what makes it unit-testable with
static fixtures (see tests/test_gate.py).
"""


def latest_final_gw(bootstrap):
    """Max event id that is both finished and data_checked (0 if none)."""
    finals = [
        e["id"]
        for e in bootstrap.get("events", [])
        if e.get("finished") and e.get("data_checked")
    ]
    return max(finals) if finals else 0


def should_rebuild(bootstrap, prev_meta):
    """True if a new final gameweek is available since the previous run.

    `prev_meta` is the previous dashboard's `.meta` section (not the full
    previous dashboard dict) — `None` when there is no previous run, in
    which case a rebuild is always warranted.
    """
    if prev_meta is None:
        return True
    return latest_final_gw(bootstrap) > int(prev_meta.get("lastFinishedGw", -1))
