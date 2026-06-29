#!/usr/bin/env python3
"""Append a new The Small Door video idea to data/video_queue.csv.

Usage:
    python3 scripts/generate_ideas.py \
        --object "teapot" --hidden-world "tiny opera house" \
        --title "I found a tiny opera house inside my teapot" \
        --hook "Steam kept rising from my empty teapot." \
        --subseries "Cup Worlds"
"""
import argparse
import csv

from utils import VIDEO_QUEUE_CSV, get_logger, read_video_queue

logger = get_logger("generate_ideas", "generation.log")


def next_video_id(rows: list[dict]) -> str:
    existing = [int(r["video_id"]) for r in rows if r["video_id"].isdigit()]
    return f"{(max(existing) + 1) if existing else 1:03d}"


def append_idea(object_: str, hidden_world: str, title: str, hook: str, subseries: str) -> str:
    rows = read_video_queue()
    video_id = next_video_id(rows)
    new_row = {field: "" for field in rows[0].keys()} if rows else {}
    new_row.update({
        "video_id": video_id,
        "status": "idea",
        "object": object_,
        "hidden_world": hidden_world,
        "title": title,
        "hook": hook,
        "script": "",
        "scene_count": "5",
        "provider": "kling",
        "output_file": "",
        "youtube_upload_status": "not_uploaded",
        "youtube_url": "",
        "publish_status": "private_pending",
        "views": "",
        "average_view_duration": "",
        "retention_notes": "",
        "comments_count": "",
        "subscriber_gain": "",
        "notes": f"Subseries: {subseries}",
        "qc_status": "pending",
    })
    with open(VIDEO_QUEUE_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(new_row.keys()))
        writer.writerow(new_row)
    logger.info("Added idea %s: %s", video_id, title)
    return video_id


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--object", required=True)
    parser.add_argument("--hidden-world", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--hook", required=True)
    parser.add_argument("--subseries", required=True)
    args = parser.parse_args()
    video_id = append_idea(args.object, args.hidden_world, args.title, args.hook, args.subseries)
    print(f"Added idea as video_id={video_id}")


if __name__ == "__main__":
    main()
