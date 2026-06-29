#!/usr/bin/env python3
"""Build per-scene Kling prompts (visual/camera/lighting/mood/negative/
continuity) from a script bundle written by generate_script.py.

Usage:
    python3 scripts/generate_scene_prompts.py --video-id 001 --scenes-file scenes.json
"""
import argparse
import json

from utils import get_logger, metadata_path, write_json

logger = get_logger("generate_scene_prompts", "generation.log")

BASE_VISUAL_STYLE = (
    "cinematic macro shot, miniature hidden world, cozy magical realism, "
    "dark room, warm tiny lights, soft shadows, shallow depth of field, "
    "realistic textures, no humans, no logos, no text, no brand packaging, "
    "no cartoon style"
)

NEGATIVE_PROMPT = (
    "human face, real person, celebrity, brand logo, readable brand text, "
    "copyrighted character, cartoon, toy-like, childish colors, "
    "oversaturated, plastic look, distorted objects, unreadable subtitles, "
    "extra limbs, scary horror, gore, violence"
)


def build_scene_prompt(scene: dict) -> dict:
    return {
        "scene_number": scene["scene"],
        "duration": scene["duration"],
        "visual_prompt": f"{BASE_VISUAL_STYLE}, {scene['summary']}",
        "camera_motion": scene.get("camera_motion", "slow push-in, slight parallax"),
        "lighting": scene.get("lighting", "warm practical light against dark ambient room"),
        "mood": scene.get("mood", "cozy, mysterious"),
        "details": scene.get("details", ""),
        "negative_prompt": NEGATIVE_PROMPT,
        "continuity_notes": scene.get("continuity_notes", ""),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--scenes-file", help="JSON file: list of scenes (see script bundle's scene_breakdown)")
    args = parser.parse_args()

    if args.scenes_file:
        scenes = json.loads(open(args.scenes_file, encoding="utf-8").read())
    else:
        script_bundle = json.loads(metadata_path(args.video_id, "script").read_text())
        scenes = script_bundle["scene_breakdown"]

    scene_prompts = [build_scene_prompt(s) for s in scenes]
    out_path = metadata_path(args.video_id, "scenes")
    write_json(out_path, {"video_id": args.video_id, "scenes": scene_prompts})
    logger.info("Wrote %d scene prompts for video_id=%s", len(scene_prompts), args.video_id)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
