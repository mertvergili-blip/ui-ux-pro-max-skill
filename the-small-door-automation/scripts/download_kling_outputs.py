#!/usr/bin/env python3
"""Re-download Kling clips for a video from a previous run's task IDs.

Normal use does NOT need this script — `create_kling_tasks.py --live-kling`
already generates and downloads clips in one step. Use this only to recover
a clip that downloaded successfully on Kling's side but failed locally
(e.g. network drop) by re-fetching it from the task_id recorded in
outputs/metadata/<video_id>_kling_results.json.

Usage:
    python3 scripts/download_kling_outputs.py --video-id 001              # dry-run
    python3 scripts/download_kling_outputs.py --video-id 001 --live-kling  # real download
"""
import argparse
import json

from utils import ROOT, get_logger, load_env, metadata_path

logger = get_logger("download_kling_outputs", "generation.log")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live-kling", action="store_true")
    args = parser.parse_args()

    results_path = metadata_path(args.video_id, "kling_results")
    if not results_path.exists():
        raise FileNotFoundError(
            f"{results_path} not found. Run create_kling_tasks.py first."
        )
    results = json.loads(results_path.read_text())
    out_dir = ROOT / "assets" / "raw_clips" / args.video_id
    out_dir.mkdir(parents=True, exist_ok=True)

    for result in results["results"]:
        scene_num = result["scene_number"]
        target = out_dir / f"scene_{scene_num:02d}.mp4"
        task_id = result.get("task_id")

        if not args.live_kling:
            logger.info("[DRY-RUN] Would re-download scene %s (task_id=%s) to %s", scene_num, task_id, target)
            continue

        if not task_id:
            logger.warning("Scene %s has no task_id in results, skipping", scene_num)
            continue
        if target.exists():
            logger.info("Scene %s already present at %s, skipping", scene_num, target)
            continue

        from kling_client import KlingClient

        client = KlingClient(load_env())
        task_data = client.get_task(task_id, task_type="text2video")
        if task_data.get("task_status") != "succeed":
            logger.warning("Scene %s task %s status=%s, cannot re-download", scene_num, task_id, task_data.get("task_status"))
            continue
        video_url = client.extract_video_url(task_data)
        client.download_video(video_url, target)
        logger.info("Re-downloaded scene %s to %s", scene_num, target)

    print(f"Done for video_id={args.video_id}. See {out_dir}")


if __name__ == "__main__":
    main()
