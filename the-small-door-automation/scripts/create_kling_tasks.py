#!/usr/bin/env python3
"""Create Kling generation tasks for each scene of a video, wait for them to
finish, and download the resulting clips — all in one command.

Kling is the only provider. No Runway fallback. Max 3 attempts per scene:
  1. original prompt
  2. simplified prompt (drop secondary details)
  3. fewer-objects prompt
If attempt 3 fails, the video is marked needs_manual_review.

Usage:
    python3 scripts/create_kling_tasks.py --video-id 001                # dry-run
    python3 scripts/create_kling_tasks.py --video-id 001 --live-kling   # real Kling API calls + download
"""
import argparse
import json

from utils import ROOT, get_logger, load_env, metadata_path, safe_log_context, update_video_row

logger = get_logger("create_kling_tasks", "generation.log")

MAX_ATTEMPTS = 3


def simplify_prompt(prompt: str, attempt: int) -> str:
    if attempt == 2:
        parts = prompt.split(",")
        return ",".join(parts[: max(3, len(parts) // 2)])
    if attempt == 3:
        parts = prompt.split(",")
        return ",".join(parts[:3])
    return prompt


def call_kling_api(client, video_id: str, scene: dict, attempt: int, live: bool) -> dict:
    """Run one generation attempt for a scene. Returns a result dict with at
    least a 'status' key ('dry_run' | 'success' | 'failed')."""
    if not live:
        logger.info(
            "[DRY-RUN] Would call Kling for scene %s attempt %s: %s",
            scene["scene_number"], attempt, safe_log_context(scene),
        )
        return {"status": "dry_run", "output_file": None}

    from kling_client import KlingAPIError

    scene_num = scene["scene_number"]
    out_dir = ROOT / "assets" / "raw_clips" / video_id
    out_path = out_dir / f"scene_{scene_num:02d}.mp4"

    # Kling only accepts a generated clip duration of 5 or 10 seconds.
    # Scenes shorter/longer than that (per the script's pacing) are trimmed
    # to their planned length during ffmpeg assembly instead.
    planned_duration = scene.get("duration", 5)
    kling_duration = "5" if planned_duration <= 7 else "10"

    try:
        task_id = client.create_text2video_task(
            prompt=scene["visual_prompt"],
            negative_prompt=scene.get("negative_prompt", ""),
            duration=kling_duration,
        )
        logger.info("Scene %s attempt %s: Kling task_id=%s submitted", scene_num, attempt, task_id)
        task_data = client.wait_for_task(task_id, task_type="text2video")
        video_url = client.extract_video_url(task_data)
        client.download_video(video_url, out_path)
        logger.info("Scene %s attempt %s: downloaded to %s", scene_num, attempt, out_path)
        return {
            "status": "success",
            "output_file": str(out_path.relative_to(ROOT)),
            "task_id": task_id,
            "planned_duration": planned_duration,
            "generated_duration": kling_duration,
        }
    except KlingAPIError as exc:
        logger.warning("Scene %s attempt %s failed: %s", scene_num, attempt, exc)
        return {"status": "failed", "error": str(exc)}


def process_scene(video_id: str, scene: dict, client, live: bool) -> dict:
    prompt = scene["visual_prompt"]
    for attempt in range(1, MAX_ATTEMPTS + 1):
        scene_attempt = dict(scene, visual_prompt=simplify_prompt(prompt, attempt))
        result = call_kling_api(client, video_id, scene_attempt, attempt, live)
        if result.get("status") in ("success", "dry_run"):
            return {"scene_number": scene["scene_number"], "attempt": attempt, **result}
        logger.warning("Scene %s attempt %s failed", scene["scene_number"], attempt)
    return {"scene_number": scene["scene_number"], "attempt": MAX_ATTEMPTS, "status": "failed"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live-kling", action="store_true", help="Perform real Kling API calls and download clips")
    args = parser.parse_args()

    env = load_env()
    scenes_bundle = json.loads(metadata_path(args.video_id, "scenes").read_text())

    client = None
    if args.live_kling:
        from kling_client import KlingClient

        client = KlingClient(env)
        (ROOT / "assets" / "raw_clips" / args.video_id).mkdir(parents=True, exist_ok=True)

    results = [process_scene(args.video_id, s, client, args.live_kling) for s in scenes_bundle["scenes"]]
    failed = [r for r in results if r["status"] == "failed"]

    if failed:
        update_video_row(args.video_id, status="needs_manual_review")
        logger.warning("video_id=%s marked needs_manual_review (%d failed scenes)", args.video_id, len(failed))
    else:
        update_video_row(args.video_id, status="clips_ready", provider="kling")

    out_path = metadata_path(args.video_id, "kling_results")
    out_path.write_text(json.dumps({"video_id": args.video_id, "results": results}, indent=2))
    print(f"Wrote {out_path}")
    if failed:
        print(f"{len(failed)} scene(s) failed after {MAX_ATTEMPTS} attempts -> needs_manual_review")
    elif args.live_kling:
        print(f"All scenes generated and downloaded to assets/raw_clips/{args.video_id}/")


if __name__ == "__main__":
    main()
