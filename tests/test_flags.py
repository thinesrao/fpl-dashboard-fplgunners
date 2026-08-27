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
