#!/usr/bin/env python3
"""Scaffold a script bundle (title, script, subtitle timings, scene breakdown,
final question) for one video_id and write it to outputs/metadata/.

This script does NOT call any LLM API itself — it provides the structure that
Claude Code (using the cinematic-scriptwriter skill) fills in, or accepts a
pre-written script via --script-file (JSON matching the schema below).

Usage:
    python3 scripts/generate_script.py --video-id 001 --script-file my_script.json
"""
import argparse
import json

from utils import get_logger, metadata_path, write_json

logger = get_logger("generate_script", "generation.log")

SCHEMA_EXAMPLE = {
    "title": "I found a tiny train station inside my fridge",
    "script_lines": [
        "I opened the fridge at 3AM.",
        "Behind the milk, something was glowing.",
        "It was a train station.",
        "A very small one.",
        "Then a train arrived.",
        "No driver. No passengers.",
        "The ticket had my name on it.",
        "Last stop: Tomorrow.",
        "Should I get on?",
    ],
    "subtitle_timings": [
        {"start": 0.0, "end": 2.0, "text": "I opened the fridge at 3AM."},
        {"start": 2.0, "end": 5.0, "text": "Behind the milk, something was glowing."},
        {"start": 5.0, "end": 9.0, "text": "It was a train station."},
        {"start": 9.0, "end": 11.0, "text": "A very small one."},
        {"start": 11.0, "end": 16.0, "text": "Then a train arrived."},
        {"start": 16.0, "end": 19.0, "text": "No driver. No passengers."},
        {"start": 19.0, "end": 24.0, "text": "The ticket had my name on it."},
        {"start": 24.0, "end": 27.0, "text": "Last stop: Tomorrow."},
        {"start": 27.0, "end": 30.0, "text": "Should I get on?"},
    ],
    "scene_breakdown": [
        {"scene": 1, "label": "Hook", "duration": 2, "summary": "Open the fridge at 3AM."},
        {"scene": 2, "label": "Discovery", "duration": 6, "summary": "Glow behind the milk."},
        {"scene": 3, "label": "Reveal", "duration": 14, "summary": "Tiny train station, train arrives."},
        {"scene": 4, "label": "Twist", "duration": 5, "summary": "Ticket has the viewer's name."},
        {"scene": 5, "label": "Question", "duration": 3, "summary": "Should I get on?"},
    ],
    "final_question": "Should I get on?",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--script-file", help="JSON file matching the schema in this script")
    parser.add_argument("--print-schema", action="store_true")
    args = parser.parse_args()

    if args.print_schema:
        print(json.dumps(SCHEMA_EXAMPLE, indent=2))
        return

    if args.script_file:
        data = json.loads(open(args.script_file, encoding="utf-8").read())
    else:
        data = SCHEMA_EXAMPLE

    out_path = metadata_path(args.video_id, "script")
    write_json(out_path, data)
    logger.info("Wrote script bundle for video_id=%s to %s", args.video_id, out_path)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
