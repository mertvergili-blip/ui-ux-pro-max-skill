#!/usr/bin/env python3
"""Run technical QC checks on a final video and record a result.

Two modes:
  --auto              Run the automated technical checklist (file exists,
                       non-zero size, 25-35s duration, 1080x1920, subtitles
                       file present, metadata present, raw scenes present)
                       and write 'approved_private_upload' only if every
                       check passes, else 'needs_manual_review'.
  --result <value>     Manually record a QC result (for the content/brand
                       checklist a human or the safety-copyright-qc skill
                       judges — hook_creates_curiosity, twist_present, etc.)

Usage:
    python3 scripts/run_qc.py --video-id 001 --auto
    python3 scripts/run_qc.py --video-id 001 --result approved_private_upload
    python3 scripts/run_qc.py --video-id 001 --result needs_revision --failed "twist_present,too_similar"
"""
import argparse
import csv
import datetime
import json
import subprocess

from utils import DATA_DIR, OUTPUTS_DIR, ROOT, get_logger, update_video_row

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

MIN_DURATION = 25.0
MAX_DURATION = 35.0
EXPECTED_RESOLUTION = (1080, 1920)


def _ffprobe(video_path) -> dict:
    cmd = [
        "ffprobe", "-v", "error", "-print_format", "json",
        "-show_format", "-show_streams", str(video_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def run_auto_checks(video_id: str, file_suffix: str = "final") -> tuple[bool, list[str], dict]:
    """Returns (passed, failed_check_names, details).

    file_suffix selects outputs/final_videos/<video_id>_<file_suffix>.mp4
    (e.g. "final" or "sound_edit")."""
    failed = []
    details = {}

    video_path = OUTPUTS_DIR / "final_videos" / f"{video_id}_{file_suffix}.mp4"
    details["video_file"] = video_path.name
    details["final_video_exists"] = video_path.exists()
    if not video_path.exists():
        failed.append("final_video_exists")
        return False, failed, details

    size_bytes = video_path.stat().st_size
    details["file_size_bytes"] = size_bytes
    if size_bytes <= 0:
        failed.append("file_size_nonzero")

    try:
        probe = _ffprobe(video_path)
        duration = float(probe["format"]["duration"])
        details["duration_seconds"] = round(duration, 2)
        if not (MIN_DURATION <= duration <= MAX_DURATION):
            failed.append("duration_25_35s")

        video_stream = next((s for s in probe["streams"] if s["codec_type"] == "video"), None)
        if video_stream is None:
            failed.append("has_video_stream")
        else:
            width, height = video_stream.get("width"), video_stream.get("height")
            details["resolution"] = f"{width}x{height}"
            if (width, height) != EXPECTED_RESOLUTION:
                failed.append("resolution_1080x1920")

        audio_stream = next((s for s in probe["streams"] if s["codec_type"] == "audio"), None)
        details["audio_stream_exists"] = audio_stream is not None
        if audio_stream is None:
            failed.append("audio_stream_exists")
    except (subprocess.CalledProcessError, FileNotFoundError, KeyError, ValueError) as exc:
        logger.warning("ffprobe failed for %s: %s", video_path, exc)
        failed.append("ffprobe_readable")

    subtitles_path = ROOT / "assets" / "subtitles" / f"{video_id}.srt"
    details["subtitles_exist"] = subtitles_path.exists()
    if not subtitles_path.exists():
        failed.append("subtitles_exist")

    metadata_path = OUTPUTS_DIR / "metadata" / f"{video_id}_metadata.json"
    details["metadata_exists"] = metadata_path.exists()
    if not metadata_path.exists():
        failed.append("metadata_exists")

    raw_clips_dir = ROOT / "assets" / "raw_clips" / video_id
    raw_scenes = list(raw_clips_dir.glob("scene_*.mp4")) if raw_clips_dir.exists() else []
    details["raw_scene_count"] = len(raw_scenes)
    if not raw_scenes:
        failed.append("raw_scenes_exist")

    return (len(failed) == 0), failed, details


def record_result(video_id: str, result: str, failed: str, notes: str) -> None:
    qc_log_path = DATA_DIR / "qc_log.csv"
    with open(qc_log_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            video_id,
            datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z",
            result,
            failed,
            notes,
        ])
    update_video_row(video_id, qc_status=result)
    logger.info("QC result for video_id=%s: %s", video_id, result)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--auto", action="store_true", help="Run automated technical checks")
    parser.add_argument("--file-suffix", default="final", help="final_videos/<video_id>_<suffix>.mp4 to check (default: final)")
    parser.add_argument("--result", choices=sorted(VALID_RESULTS), help="Manually record a QC result")
    parser.add_argument("--failed", default="", help="comma-separated checklist items that failed (manual mode)")
    parser.add_argument("--notes", default="")
    args = parser.parse_args()

    if not args.auto and not args.result:
        raise SystemExit("Pass --auto for technical checks or --result for a manual content QC verdict.")

    if args.auto:
        passed, failed_checks, details = run_auto_checks(args.video_id, file_suffix=args.file_suffix)
        result = "approved_private_upload" if passed else "needs_manual_review"
        record_result(args.video_id, result, ",".join(failed_checks), f"auto-check: {json.dumps(details)}")
        print(f"Auto QC for video_id={args.video_id}: {result}")
        if failed_checks:
            print(f"Failed checks: {', '.join(failed_checks)}")
        print(json.dumps(details, indent=2))
        return

    record_result(args.video_id, args.result, args.failed, args.notes)
    print(f"Recorded QC result {args.result} for video_id={args.video_id}")


if __name__ == "__main__":
    main()
