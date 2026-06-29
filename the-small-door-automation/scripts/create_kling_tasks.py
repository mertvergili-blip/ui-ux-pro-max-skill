#!/usr/bin/env python3
"""Create (or dry-run) Kling generation tasks for each scene of a video.

Kling is the only provider. No Runway fallback. Max 3 attempts per scene:
  1. original prompt
  2. simplified prompt (drop secondary details)
  3. fewer-objects prompt
If attempt 3 fails, the video is marked needs_manual_review.

Usage:
    python3 scripts/create_kling_tasks.py --video-id 001            # dry-run
    python3 scripts/create_kling_tasks.py --video-id 001 --live      # real API call (requires .env)
"""
import argparse
import json

from utils import get_logger, load_env, metadata_path, safe_log_context, update_video_row

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


def call_kling_api(scene: dict, attempt: int, env: dict, live: bool) -> dict:
    """Placeholder for the real Kling API call.

    Real implementation should POST scene['visual_prompt']/negative_prompt to
    the Kling Developer Platform using env['KLING_API_KEY'] /
    env['KLING_ACCESS_KEY'] / env['KLING_SECRET_KEY'], then poll for
    completion. Never log the key values themselves.
    """
    if not live:
        logger.info(
            "[DRY-RUN] Would call Kling for scene %s attempt %s: %s",
            scene["scene_number"], attempt, safe_log_context(scene),
        )
        return {"status": "dry_run", "output_file": None}

    if not env.get("KLING_API_KEY") and not env.get("KLING_ACCESS_KEY"):
        raise RuntimeError("Live mode requested but no Kling credentials found in .env")

    # TODO: implement real Kling Developer Platform request/poll here.
    raise NotImplementedError(
        "Real Kling API integration is not implemented yet. "
        "Add the request/poll logic here before using --live."
    )


def process_scene(video_id: str, scene: dict, env: dict, live: bool) -> dict:
    prompt = scene["visual_prompt"]
    for attempt in range(1, MAX_ATTEMPTS + 1):
        scene_attempt = dict(scene, visual_prompt=simplify_prompt(prompt, attempt))
        result = call_kling_api(scene_attempt, attempt, env, live)
        if result.get("status") in ("success", "dry_run"):
            return {"scene_number": scene["scene_number"], "attempt": attempt, **result}
        logger.warning("Scene %s attempt %s failed", scene["scene_number"], attempt)
    return {"scene_number": scene["scene_number"], "attempt": MAX_ATTEMPTS, "status": "failed"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live", action="store_true", help="Perform real Kling API calls instead of dry-run")
    args = parser.parse_args()

    env = load_env()
    scenes_bundle = json.loads(metadata_path(args.video_id, "scenes").read_text())

    results = [process_scene(args.video_id, s, env, args.live) for s in scenes_bundle["scenes"]]
    failed = [r for r in results if r["status"] == "failed"]

    if failed:
        update_video_row(args.video_id, status="needs_manual_review")
        logger.warning("video_id=%s marked needs_manual_review (%d failed scenes)", args.video_id, len(failed))
    else:
        update_video_row(args.video_id, status="clips_ready", provider="kling")

    out_path = metadata_path(args.video_id, "kling_tasks")
    out_path.write_text(json.dumps({"video_id": args.video_id, "results": results}, indent=2))
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
