#!/usr/bin/env python3
"""Generate an .srt subtitle file from a script bundle's subtitle_timings.

Usage:
    python3 scripts/create_subtitles.py --video-id 001
"""
import argparse
import json

from utils import ROOT, get_logger, metadata_path, write_json

logger = get_logger("create_subtitles", "generation.log")


def format_timestamp(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_srt(timings: list[dict]) -> str:
    lines = []
    for i, line in enumerate(timings, start=1):
        lines.append(str(i))
        lines.append(f"{format_timestamp(line['start'])} --> {format_timestamp(line['end'])}")
        lines.append(line["text"])
        lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    args = parser.parse_args()

    script_bundle = json.loads(metadata_path(args.video_id, "script").read_text())
    timings = script_bundle["subtitle_timings"]

    srt_path = ROOT / "assets" / "subtitles" / f"{args.video_id}.srt"
    srt_path.parent.mkdir(parents=True, exist_ok=True)
    srt_path.write_text(build_srt(timings), encoding="utf-8")

    plan = {
        "video_id": args.video_id,
        "subtitle_timings": timings,
        "ffmpeg_subtitle_filter": (
            "subtitles={srt_path}:force_style='FontName=Arial,FontSize=14,"
            "PrimaryColour=&HFFFFFF&,Alignment=2,MarginV=120'"
        ).format(srt_path=srt_path.as_posix()),
        "render_settings": {"resolution": "1080x1920", "aspect_ratio": "9:16", "target_duration_s": "25-35"},
    }
    write_json(metadata_path(args.video_id, "subtitles"), plan)
    logger.info("Wrote subtitles for video_id=%s", args.video_id)
    print(f"Wrote {srt_path} and {metadata_path(args.video_id, 'subtitles')}")


if __name__ == "__main__":
    main()
