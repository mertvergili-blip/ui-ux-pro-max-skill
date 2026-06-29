#!/usr/bin/env python3
"""Assemble raw clips + subtitles + sound into a final 9:16 short via FFmpeg.

This is a skeleton: it prints/logs the ffmpeg command it would run. Wire in
actual ffmpeg subprocess calls once raw clips and sound assets exist.

Usage:
    python3 scripts/assemble_short.py --video-id 001            # dry-run, prints command
    python3 scripts/assemble_short.py --video-id 001 --live      # actually runs ffmpeg
"""
import argparse
import subprocess

from utils import OUTPUTS_DIR, ROOT, get_logger, metadata_path, update_video_row

logger = get_logger("assemble_short", "generation.log")


def build_ffmpeg_command(video_id: str) -> list[str]:
    clips_dir = ROOT / "assets" / "raw_clips" / video_id
    subtitles = ROOT / "assets" / "subtitles" / f"{video_id}.srt"
    out_path = OUTPUTS_DIR / "final_videos" / f"{video_id}.mp4"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    concat_list = clips_dir / "concat.txt"
    return [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-vf", (
            f"scale=1080:1920:force_original_aspect_ratio=increase,"
            f"crop=1080:1920,subtitles={subtitles.as_posix()}"
        ),
        "-c:v", "libx264", "-c:a", "aac",
        str(out_path),
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()

    cmd = build_ffmpeg_command(args.video_id)
    if not args.live:
        logger.info("[DRY-RUN] ffmpeg command: %s", " ".join(cmd))
        print("DRY-RUN, would run:\n" + " ".join(cmd))
        return

    subprocess.run(cmd, check=True)
    update_video_row(args.video_id, status="assembled", output_file=f"outputs/final_videos/{args.video_id}.mp4")
    logger.info("Assembled final video for video_id=%s", args.video_id)


if __name__ == "__main__":
    main()
