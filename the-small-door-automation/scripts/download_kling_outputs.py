#!/usr/bin/env python3
"""Download completed Kling clips into assets/raw_clips/<video_id>/.

Placeholder/dry-run by default. Real implementation should poll the Kling
task IDs recorded in outputs/metadata/<video_id>_kling_tasks.json and save
the resulting files locally.

Usage:
    python3 scripts/download_kling_outputs.py --video-id 001
"""
import argparse
import json

from utils import ROOT, get_logger, metadata_path

logger = get_logger("download_kling_outputs", "generation.log")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()

    tasks = json.loads(metadata_path(args.video_id, "kling_tasks").read_text())
    out_dir = ROOT / "assets" / "raw_clips" / args.video_id
    out_dir.mkdir(parents=True, exist_ok=True)

    for result in tasks["results"]:
        scene_num = result["scene_number"]
        target = out_dir / f"scene_{scene_num}.mp4"
        if not args.live:
            logger.info("[DRY-RUN] Would download scene %s to %s", scene_num, target)
            continue
        # TODO: implement real Kling download using its task/output API.
        raise NotImplementedError("Real Kling download not implemented yet.")

    print(f"Dry-run complete for video_id={args.video_id}. See {out_dir}")


if __name__ == "__main__":
    main()
