#!/usr/bin/env python3
"""Generate a character reference sheet (still image) for one character,
BEFORE any scene video prompt is written for that character.

Why this exists: research on 042's visual failures (see
data/ai_video_quality_research_2026.md) found that pure text-to-video, with
no reference image and no character lock, is the documented cause of
character drift across scenes (a different face/body every scene). The fix
used across the industry is: design the character once as a still image
(front view + 45deg + full side profile in one frame), then bind that image
into every video scene via image-to-video instead of re-describing the
character in text each time.

Uses Kling's own text-to-image endpoint (create_text2image_task) — the same
KLING_API_KEY/KLING_ACCESS_KEY+SECRET already configured for video, no
separate image-model API key required.

Usage:
    python3 scripts/generate_character_reference.py --video-id 042 --character battery                # dry-run
    python3 scripts/generate_character_reference.py --video-id 042 --character battery --live-kling    # real Kling API call

Reads the character definition from outputs/metadata/<video_id>_scenes.json
-> character_continuity_lock.<character>, and writes the reference sheet
prompt + (if --live-kling) the downloaded image to
outputs/metadata/<video_id>_character_refs/<character>_reference.jpg plus a
sidecar outputs/metadata/<video_id>_character_refs/<character>_reference.json
recording the prompt used (for trait-locking future scene prompts verbatim).
"""
import argparse
import json

from utils import OUTPUTS_DIR, get_logger, load_env, metadata_path, safe_log_context

logger = get_logger("generate_character_reference", "generation.log")

REFERENCE_SHEET_SUFFIX = (
    "character reference sheet, three views in one frame: direct frontal "
    "view, 45 degree three-quarter view, full side profile view, same "
    "character in all three poses, neutral studio lighting, plain neutral "
    "background, consistent proportions across all three views, no text, "
    "no caption, no watermark, no logo, no other characters in frame"
)


def build_reference_prompt(character_name: str, continuity_lock_entry: str) -> str:
    """Build a capped, trait-locked reference-sheet prompt.

    Per research: 2-3 character descriptors max (silhouette + one
    identifying texture/color) — do not carry over long paragraph
    descriptions from the old text2video-only prompts.
    """
    return f"{continuity_lock_entry.strip()}. {REFERENCE_SHEET_SUFFIX}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--character", required=True, help="key into character_continuity_lock, e.g. 'battery'")
    parser.add_argument("--live-kling", action="store_true", help="Perform a real Kling text2image API call")
    args = parser.parse_args()

    env = load_env()
    scenes_bundle = json.loads(metadata_path(args.video_id, "scenes").read_text())
    lock = scenes_bundle.get("character_continuity_lock", {})
    if args.character not in lock:
        raise SystemExit(
            f"Character '{args.character}' not found in character_continuity_lock. "
            f"Available: {list(lock.keys())}"
        )

    prompt = build_reference_prompt(args.character, lock[args.character])
    negative_prompt = (
        "text, caption, watermark, logo, multiple different characters, "
        "inconsistent proportions between views, extra limbs, distorted face, "
        "cluttered background, other objects"
    )

    ref_dir = OUTPUTS_DIR / "metadata" / f"{args.video_id}_character_refs"

    if not args.live_kling:
        logger.info(
            "[DRY-RUN] Would call Kling text2image for video_id=%s character=%s: %s",
            args.video_id, args.character, safe_log_context({"prompt": prompt, "negative_prompt": negative_prompt}),
        )
        print(f"[DRY-RUN] Reference sheet prompt for '{args.character}':\n{prompt}\n")
        print(f"[DRY-RUN] Would write to {ref_dir}/{args.character}_reference.jpg (no API call made)")
        return

    from kling_client import KlingClient, KlingAPIError

    client = KlingClient(env)
    ref_dir.mkdir(parents=True, exist_ok=True)
    out_image = ref_dir / f"{args.character}_reference.jpg"
    out_sidecar = ref_dir / f"{args.character}_reference.json"

    try:
        task_id = client.create_text2image_task(prompt=prompt, negative_prompt=negative_prompt, n=1)
        logger.info("Character reference task_id=%s submitted for %s/%s", task_id, args.video_id, args.character)
        task_data = client.wait_for_task(task_id, task_type="text2image")
        image_urls = client.extract_image_urls(task_data)
        client.download_video(image_urls[0], out_image)  # same streaming download helper works for any URL
        out_sidecar.write_text(json.dumps({
            "video_id": args.video_id,
            "character": args.character,
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "task_id": task_id,
            "image_file": str(out_image.relative_to(OUTPUTS_DIR.parent)),
        }, indent=2))
        logger.info("Character reference for %s/%s downloaded to %s", args.video_id, args.character, out_image)
        print(f"Wrote {out_image}")
        print(f"Wrote {out_sidecar}")
        print("Next: use this image with create_image2video_task(image_url=...) for every scene featuring this character.")
    except KlingAPIError as exc:
        logger.warning("Character reference generation failed for %s/%s: %s", args.video_id, args.character, exc)
        raise SystemExit(f"Kling text2image failed: {exc}")


if __name__ == "__main__":
    main()
