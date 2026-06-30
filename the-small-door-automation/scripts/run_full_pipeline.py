#!/usr/bin/env python3
"""Run the full Kling -> assemble -> QC -> private-upload pipeline for one
video with a single command.

Stages run in order; each stage only runs if its flag is passed. Every flag
defaults to OFF (dry-run / skip), matching the rest of this repo.

Usage:
    # Dry-run: just prints what each stage would do, no real API calls.
    python3 scripts/run_full_pipeline.py --video-id 001

    # Real Kling generation + assemble + technical QC.
    python3 scripts/run_full_pipeline.py --video-id 001 --live-kling --assemble --qc

    # Same, plus private YouTube upload IF QC approved.
    python3 scripts/run_full_pipeline.py --video-id 001 --live-kling --assemble --qc --upload-private

Hard rules enforced here (cannot be overridden by flags):
  - There is no public-upload flag or code path anywhere in this script.
  - --upload-private only proceeds if qc_status == 'approved_private_upload'.
  - Upload visibility is hard-coded to 'private' in upload_private_youtube.py.
"""
import argparse
import subprocess
import sys

from utils import get_logger, read_video_queue

logger = get_logger("run_full_pipeline", "generation.log")


def run_step(name: str, cmd: list[str]) -> None:
    print(f"\n=== {name} ===")
    print(" ".join(cmd))
    result = subprocess.run(cmd)
    if result.returncode != 0:
        logger.error("Step failed: %s (exit %s)", name, result.returncode)
        raise SystemExit(f"Pipeline stopped: '{name}' failed with exit code {result.returncode}")


def get_qc_status(video_id: str) -> str:
    for row in read_video_queue():
        if row["video_id"] == video_id:
            return row.get("qc_status", "")
    raise ValueError(f"video_id {video_id} not found in video_queue.csv")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live-kling", action="store_true", help="Real Kling generation + download")
    parser.add_argument("--assemble", action="store_true", help="Run ffmpeg assembly")
    parser.add_argument("--qc", action="store_true", help="Run automated technical QC checks")
    parser.add_argument("--upload-private", action="store_true", help="Upload to YouTube as private (requires QC approved)")
    args = parser.parse_args()

    video_id = args.video_id
    python = sys.executable

    kling_cmd = [python, "scripts/create_kling_tasks.py", "--video-id", video_id]
    if args.live_kling:
        kling_cmd.append("--live-kling")
    run_step("1/4 Kling scene generation + download", kling_cmd)

    if args.assemble:
        assemble_cmd = [python, "scripts/assemble_short.py", "--video-id", video_id]
        if args.live_kling:
            assemble_cmd.append("--live")
        run_step("2/4 FFmpeg assembly", assemble_cmd)
    else:
        print("\n=== 2/4 FFmpeg assembly === skipped (pass --assemble to run)")

    if args.qc:
        run_step("3/4 QC (automated technical checks)", [python, "scripts/run_qc.py", "--video-id", video_id, "--auto"])
    else:
        print("\n=== 3/4 QC === skipped (pass --qc to run)")

    if args.upload_private:
        if not args.qc:
            raise SystemExit("Refusing to upload: pass --qc so QC actually runs before --upload-private.")
        qc_status = get_qc_status(video_id)
        if qc_status != "approved_private_upload":
            raise SystemExit(
                f"Refusing to upload: qc_status='{qc_status}', must be 'approved_private_upload'."
            )
        upload_cmd = [python, "scripts/upload_private_youtube.py", "--video-id", video_id]
        if args.live_kling:
            upload_cmd.append("--live")
        run_step("4/4 Private YouTube upload", upload_cmd)
    else:
        print("\n=== 4/4 Private YouTube upload === skipped (pass --upload-private to run)")

    print(f"\nPipeline finished for video_id={video_id}.")
    print("Reminder: public release is never automated here — only manual publish from YouTube Studio.")


if __name__ == "__main__":
    main()
