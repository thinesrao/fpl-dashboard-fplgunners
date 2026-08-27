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
