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


def test_build_dashboard_maps_movement_and_entry_id():
    sheets = load("sheets.sample.json"); bootstrap = load("bootstrap.sample.json")
    cfg = {"leagueId": 1022594, "leagueNameEn": "Gunners League", "seasonLabel": "Season 6"}
    d = build_dashboard(sheets, bootstrap, cfg, prev_meta=None)
    top = d["standings"][0]
    # Last_Rank / Entry_ID from the sheet flow through to the JSON contract
    assert top["entryId"] == 4778000
    assert top["lastRank"] == 2  # was 2nd, now 1st -> the frontend renders this as up-movement
    # a manager with no previous rank stays 0 (rendered as NEW)
    assert d["standings"][-1]["lastRank"] == 0
