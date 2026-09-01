"""Thin I/O wrappers for the snapshot pipeline.

Everything here talks to the outside world (Google Sheets, the FPL API, the
filesystem) and is intentionally not unit-tested — it needs live credentials
and network access. Business logic stays in snapshot/gate.py and
snapshot/build.py, which are pure and fully covered by tests.

The Google Sheets auth reuses the exact service-account/gspread connection
logic already proven out in data_pipeline.py (`get_secrets` / `get_credentials`)
rather than re-implementing it — data_pipeline.py and config.py are only
imported here, never modified.
"""

import json
from pathlib import Path

import requests

from config import GOOGLE_SHEET_NAME
from data_pipeline import get_credentials, get_secrets, with_retry

BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def read_sheets():
    """Read every worksheet in the configured Google Sheet.

    Returns `{worksheet_title: [row_dict, ...]}` for all worksheets, using
    the same service-account auth as data_pipeline.py's pipeline run.
    """
    gcp_creds = get_secrets()
    gc = get_credentials(gcp_creds)
    if not gc:
        raise RuntimeError(
            "Google Sheets authentication failed — no GCP credentials found "
            "(set GCP_CREDENTIALS or provide .streamlit/secrets.toml)."
        )
    def _read():
        spreadsheet = gc.open(GOOGLE_SHEET_NAME)
        return {
            worksheet.title: worksheet.get_all_records()
            for worksheet in spreadsheet.worksheets()
        }

    return with_retry(_read, description=f"read Google Sheet '{GOOGLE_SHEET_NAME}'")


def fetch_bootstrap():
    """GET the FPL bootstrap-static payload (browser User-Agent required), with retries."""
    def _fetch():
        response = requests.get(
            BOOTSTRAP_URL, headers={"User-Agent": USER_AGENT}, timeout=15
        )
        response.raise_for_status()
        return response.json()

    return with_retry(_fetch, description="GET bootstrap-static")


def read_prev(path):
    """Read the full previous dashboard dict, or None if it doesn't exist.

    Returns the entire parsed JSON document at `path` (not just its `.meta`
    section) — build_dashboard() needs the previous record (`highestGw.score`)
    and leader (`standings[0].manager`) to compute report flags, and those
    live outside `meta`.
    """
    p = Path(path)
    if not p.exists():
        return None
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path, obj):
    """Pretty-print `obj` as JSON to `path`, preserving non-ASCII text."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
