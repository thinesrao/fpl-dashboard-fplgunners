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
