#!/usr/bin/env python3
"""Summarize data/analytics_log.csv into per-video and per-subseries
decisions, written to outputs/reports/.

Usage:
    python3 scripts/analyze_results.py
"""
import csv
import datetime

from utils import DATA_DIR, OUTPUTS_DIR, get_logger, write_json

logger = get_logger("analyze_results", "generation.log")

DECISIONS = {"keep", "iterate", "stop", "make_series", "change_hook", "change_object", "change_mood"}


def decide(row: dict) -> str:
    """Very simple heuristic placeholder — replace with real thresholds once
    enough data exists. Keeps the pipeline runnable end-to-end from day one.
    """
    try:
        avg_duration = float(row.get("average_view_duration") or 0)
        comments = int(row.get("comments_count") or 0)
    except ValueError:
        return "iterate"

    if avg_duration >= 20 and comments >= 5:
        return "make_series"
    if avg_duration >= 15:
        return "keep"
    if avg_duration < 8:
        return "change_hook"
    return "iterate"


def main():
    log_path = DATA_DIR / "analytics_log.csv"
    with open(log_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    report = {
        "generated_at": datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "videos": [{"video_id": r["video_id"], "subseries": r.get("subseries"), "decision": decide(r)} for r in rows],
    }

    out_path = OUTPUTS_DIR / "reports" / f"analytics_{datetime.date.today().isoformat()}.json"
    write_json(out_path, report)
    logger.info("Wrote analytics report to %s (%d videos)", out_path, len(rows))
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
