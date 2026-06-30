#!/usr/bin/env python3
"""Regenerate scene 4 (knockout/twist beat) of video 022 only.

QC frame check flagged the knockout moment as visually ambiguous (read as
a crumb/light texture, not a clear boxing beat). This re-issues a single
Kling task for scene 4 with a more concrete, literal prompt: two visible
bread-slice boxer silhouettes, one clearly down/on the canvas, a tiny
referee's raised arm, all still within the existing hard rules (no real
people/celebrities/brands/copyrighted characters, original tiny
characters only, cinematic miniature-world look, no cartoon/toy style).

Usage:
    python3 scripts/regen_scene4_022.py            # dry-run
    python3 scripts/regen_scene4_022.py --live      # real Kling call + download, overwrites scene_04.mp4
"""
import argparse
import json

from utils import ROOT, get_logger, load_env, metadata_path

logger = get_logger("regen_scene4_022", "generation.log")

VIDEO_ID = "022"
SCENE_NUMBER = 4

NEW_VISUAL_PROMPT = (
    "cinematic macro shot, miniature hidden world, cozy magical realism, dark room, "
    "warm tiny lights, soft shadows, shallow depth of field, realistic textures, "
    "no logos, no text, no brand packaging, no cartoon style, "
    "tight shot inside a coin-sized boxing ring lit like a stadium: two original tiny "
    "bread-slice boxer characters wearing small boxing gloves, clearly visible silhouettes, "
    "one bread-slice boxer is down flat on the canvas of the ring, the other stands over it "
    "with one glove raised, a small original tiny referee character in the corner of frame "
    "raises an arm and rings a tiny bell to signal the knockout, warm orange toaster-coil "
    "backlight rims all three figures so they read clearly against the dark background, "
    "no recognizable face, no celebrity, no real person, no copyrighted character"
)

NEGATIVE_PROMPT = (
    "real person, celebrity, recognizable face, famous character, copyrighted character, "
    "brand logo, readable brand text, horror, gore, violence, blood, scary monster, "
    "cartoonish, toy-like, childish colors, oversaturated, plastic look, distorted objects, "
    "unreadable subtitles, extra limbs, blurry indistinct shapes, abstract texture only"
)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()

    scenes_path = metadata_path(VIDEO_ID, "scenes")
    bundle = json.loads(scenes_path.read_text())
    for scene in bundle["scenes"]:
        if scene["scene_number"] == SCENE_NUMBER:
            scene["visual_prompt"] = NEW_VISUAL_PROMPT
            scene["negative_prompt"] = NEGATIVE_PROMPT
            break

    out_dir = ROOT / "assets" / "raw_clips" / VIDEO_ID
    out_path = out_dir / f"scene_{SCENE_NUMBER:02d}.mp4"

    if not args.live:
        print(f"DRY-RUN: would regenerate scene {SCENE_NUMBER} with sharpened prompt -> {out_path}")
        print(NEW_VISUAL_PROMPT)
        return

    env = load_env()
    from kling_client import KlingClient

    client = KlingClient(env)
    out_dir.mkdir(parents=True, exist_ok=True)

    task_id = client.create_text2video_task(
        prompt=NEW_VISUAL_PROMPT,
        negative_prompt=NEGATIVE_PROMPT,
        duration="10",  # scene 4 planned_duration=8 (>7) -> 10s tier, matches original generation
    )
    logger.info("Scene 4 regen: Kling task_id=%s submitted", task_id)
    print(f"Scene 4 regen: Kling task_id={task_id} submitted")
    task_data = client.wait_for_task(task_id, task_type="text2video")
    video_url = client.extract_video_url(task_data)
    client.download_video(video_url, out_path)
    logger.info("Scene 4 regen: downloaded to %s", out_path)
    print(f"Scene 4 regen: downloaded to {out_path}")

    # update scenes.json with the new prompt for record-keeping
    scenes_path.write_text(json.dumps(bundle, indent=2))

    # update kling_results.json planned_duration entry stays the same (8s),
    # only the underlying clip changed.
    print("Done. Re-run assemble_short.py --video-id 022 --live to rebuild the final video.")


if __name__ == "__main__":
    main()
