#!/usr/bin/env python3
"""Run the safety/copyright/brand-fit QC checklist for a video and record the
result. This script scaffolds the checklist; a human or Claude (using the
safety-copyright-qc skill) supplies the pass/fail judgement per item.

Usage:
    python3 scripts/run_qc.py --video-id 001 --result approved_private_upload
    python3 scripts/run_qc.py --video-id 001 --result needs_revision --failed "twist_present,too_similar"
"""
import argparse
import csv
import datetime

from utils import DATA_DIR, get_logger, update_video_row

logger = get_logger("run_qc", "generation.log")

VALID_RESULTS = {"approved_private_upload", "needs_revision", "needs_manual_review", "rejected"}

CHECKLIST = [
    "hook_creates_curiosity",
    "tiny_world_clearly_visible",
    "fits_small_door_universe",
    "subtitles_short_and_readable",
    "sound_supports_atmosphere",
    "twist_present",
    "comment_question_present",
    "not_too_similar_to_previous",
    "no_copyrighted_brand_or_logo",
    "no_human_face_or_real_person",
    "not_kids_channel_look",
    "not_overly_bright_or_cartoonish",
    "ai_disclosure_assessed",
    "private_upload_rule_respected",
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--result", required=True, choices=sorted(VALID_RESULTS))
    parser.add_argument("--failed", default="", help="comma-separated checklist items that failed")
    parser.add_argument("--notes", default="")
    args = parser.parse_args()

    qc_log_path = DATA_DIR / "qc_log.csv"
    with open(qc_log_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            args.video_id,
            datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z",
            args.result,
            args.failed,
            args.notes,
        ])

    update_video_row(args.video_id, qc_status=args.result)
    logger.info("QC result for video_id=%s: %s", args.video_id, args.result)
    print(f"Recorded QC result {args.result} for video_id={args.video_id}")


if __name__ == "__main__":
    main()
