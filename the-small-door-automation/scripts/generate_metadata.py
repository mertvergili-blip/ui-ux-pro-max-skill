#!/usr/bin/env python3
"""Write upload-ready YouTube + Instagram metadata for a finished video.

No network calls, no API keys. Reads outputs/metadata/<id>_script.json for
title/twist context and writes outputs/metadata/<id>_metadata.json.

Usage:
    python3 scripts/generate_metadata.py --video-id 021
"""
import argparse

from utils import get_logger, metadata_path, write_json

logger = get_logger("generate_metadata", "generation.log")

HASHTAGS = ["#shorts", "#tinyworld", "#miniature", "#magicalrealism", "#asmr", "#cozy", "#mystery"]
IG_HASHTAGS = ["#shorts", "#reels", "#tinyworld", "#miniature", "#asmrsounds", "#cozyhorror", "#magicalrealism"]

AI_DISCLOSURE = (
    "Visuals in this video are AI-generated (Kling). Apply YouTube's "
    "altered/synthetic content disclosure in YouTube Studio before making public."
)


def build_metadata(video_id: str, script: dict) -> dict:
    title = script["title"]
    final_question = script.get("final_question", "")
    yt_title = title if title[0].isupper() else title[0].upper() + title[1:]
    if len(yt_title) < 45:
        yt_title = f"{yt_title} — The Small Door"

    description = (
        f"{title}. {final_question} "
        "The Small Door — tiny hidden worlds behind ordinary things."
    ).strip()

    ig_caption = (
        f"{final_question} \U0001f440 {title.lower()}.\n"
        "The Small Door — tiny hidden worlds behind ordinary things."
    )

    cover_text = final_question or title

    first_comment = f"What do YOU think happens at zero? \U0001f447"

    return {
        "video_id": video_id,
        "title": yt_title,
        "description": description,
        "hashtags": HASHTAGS,
        "instagram_caption": ig_caption,
        "instagram_hashtags": IG_HASHTAGS,
        "reels_cover_text": cover_text,
        "suggested_first_comment": first_comment,
        "ai_disclosure_note": AI_DISCLOSURE,
        "upload_visibility": "private",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    args = parser.parse_args()

    script = __import__("json").loads(metadata_path(args.video_id, "script").read_text())
    metadata = build_metadata(args.video_id, script)

    out_path = metadata_path(args.video_id, "metadata")
    write_json(out_path, metadata)
    logger.info("Wrote metadata for video_id=%s", args.video_id)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
