def compute_flags(standings, weekly_top, highest_gw, prev_record, prev_leader):
    leader = standings[0]["manager"] if standings else ""
    gap = (standings[0]["total"] - standings[1]["total"]) if len(standings) > 1 else 999
    return {
        "recordBroken": prev_record is not None and highest_gw["score"] > prev_record,
        "leaderChanged": bool(prev_leader) and leader != prev_leader,
        "prevLeader": prev_leader or "",
        "gapToSecond": int(gap),
        "weeklyTopScore": int(weekly_top["score"]),
    }
