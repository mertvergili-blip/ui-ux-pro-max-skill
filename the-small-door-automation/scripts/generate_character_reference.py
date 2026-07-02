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

Image generator priority:
  1. Nano Banana (Gemini 2.5 Flash Image) if GEMINI_API_KEY/NANOBANANA_API_KEY
     is set in .env — specifically strong at consistent, multi-view
     character sheets. Get a free key at https://aistudio.google.com/apikey.
  2. Kling's own text-to-image endpoint (create_text2image_task) as fallback
     — reuses KLING_API_KEY/KLING_ACCESS_KEY+SECRET already configured for
     video, no separate key needed if Nano Banana isn't configured.

Usage:
    python3 scripts/generate_character_reference.py --video-id 042 --character battery             # dry-run
    python3 scripts/generate_character_reference.py --video-id 042 --character battery --live       # real API call (Nano Banana or Kling, whichever is configured)
    python3 scripts/generate_character_reference.py --video-id 042 --character battery --live --provider kling  # force Kling even if Nano Banana is configured

Reads the character definition from outputs/metadata/<video_id>_scenes.json
-> character_continuity_lock.<character>, and writes the reference sheet
prompt + (if --live) the downloaded image to
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

NEGATIVE_PROMPT = (
    "text, caption, watermark, logo, multiple different characters, "
    "inconsistent proportions between views, extra limbs, distorted face, "
    "cluttered background, other objects"
)


def build_reference_prompt(continuity_lock_entry: str) -> str:
    """Build a capped, trait-locked reference-sheet prompt.

    Per research: 2-3 character descriptors max (silhouette + one
    identifying texture/color) — do not carry over long paragraph
    descriptions from the old text2video-only prompts.
    """
    return f"{continuity_lock_entry.strip()}. {REFERENCE_SHEET_SUFFIX}"


def pick_provider(env: dict, forced: str | None) -> str:
    if forced:
        return forced
    if env.get("GEMINI_API_KEY") or env.get("NANOBANANA_API_KEY"):
        return "nanobanana"
    return "kling"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--character", required=True, help="key into character_continuity_lock, e.g. 'battery'")
    parser.add_argument("--live", "--live-kling", dest="live", action="store_true", help="Perform a real image-generation API call")
    parser.add_argument("--provider", choices=["nanobanana", "kling"], default=None, help="Force a provider instead of auto-picking by configured API key")
    args = parser.parse_args()

    env = load_env()
    scenes_bundle = json.loads(metadata_path(args.video_id, "scenes").read_text())
    lock = scenes_bundle.get("character_continuity_lock", {})
    if args.character not in lock:
        raise SystemExit(
            f"Character '{args.character}' not found in character_continuity_lock. "
            f"Available: {list(lock.keys())}"
        )

    prompt = build_reference_prompt(lock[args.character])
    provider = pick_provider(env, args.provider)
    ref_dir = OUTPUTS_DIR / "metadata" / f"{args.video_id}_character_refs"

    if not args.live:
        logger.info(
            "[DRY-RUN] Would call %s text2image for video_id=%s character=%s: %s",
            provider, args.video_id, args.character,
            safe_log_context({"prompt": prompt, "negative_prompt": NEGATIVE_PROMPT}),
        )
        print(f"[DRY-RUN] Provider that would be used: {provider}")
        print(f"[DRY-RUN] Reference sheet prompt for '{args.character}':\n{prompt}\n")
        print(f"[DRY-RUN] Would write to {ref_dir}/{args.character}_reference.jpg (no API call made)")
        return

    ref_dir.mkdir(parents=True, exist_ok=True)
    out_image = ref_dir / f"{args.character}_reference.jpg"
    out_sidecar = ref_dir / f"{args.character}_reference.json"

    if provider == "nanobanana":
        from nanobanana_client import NanoBananaClient, NanoBananaAPIError, NanoBananaConfigError

        try:
            client = NanoBananaClient(env)
            image_bytes = client.generate_image(prompt=prompt, negative_prompt=NEGATIVE_PROMPT)
            client.save_image(image_bytes, out_image)
            task_id = None
            logger.info("Character reference (Nano Banana) for %s/%s saved to %s", args.video_id, args.character, out_image)
        except (NanoBananaAPIError, NanoBananaConfigError) as exc:
            logger.warning("Nano Banana reference generation failed for %s/%s: %s", args.video_id, args.character, exc)
            raise SystemExit(f"Nano Banana image generation failed: {exc}")
    else:
        from kling_client import KlingClient, KlingAPIError

        try:
            client = KlingClient(env)
            task_id = client.create_text2image_task(prompt=prompt, negative_prompt=NEGATIVE_PROMPT, n=1)
            logger.info("Character reference task_id=%s submitted for %s/%s", task_id, args.video_id, args.character)
            task_data = client.wait_for_task(task_id, task_type="text2image")
            image_urls = client.extract_image_urls(task_data)
            client.download_video(image_urls[0], out_image)  # same streaming download helper works for any URL
            logger.info("Character reference (Kling) for %s/%s downloaded to %s", args.video_id, args.character, out_image)
        except KlingAPIError as exc:
            logger.warning("Kling reference generation failed for %s/%s: %s", args.video_id, args.character, exc)
            raise SystemExit(f"Kling text2image failed: {exc}")

    out_sidecar.write_text(json.dumps({
        "video_id": args.video_id,
        "character": args.character,
        "provider": provider,
        "prompt": prompt,
        "negative_prompt": NEGATIVE_PROMPT,
        "task_id": task_id,
        "image_file": str(out_image.relative_to(OUTPUTS_DIR.parent)),
    }, indent=2))
    print(f"Wrote {out_image}")
    print(f"Wrote {out_sidecar}")
    print("Next: use this image with create_image2video_task(image_url=...) for every scene featuring this character.")


if __name__ == "__main__":
    main()
