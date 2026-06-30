#!/usr/bin/env python3
"""Assemble raw Kling clips + subtitles + optional sound into a final 9:16
short via FFmpeg.

Steps:
  1. Normalize every assets/raw_clips/<id>/scene_NN.mp4 to 1080x1920 @30fps.
  2. Concatenate the normalized clips in scene order.
  3. Burn in assets/subtitles/<id>.srt.
  4. Mix in assets/sounds/<id>.mp3 (or .wav) if it exists; otherwise keep
     the clips' original/no audio track — never error just because no sound
     file was provided.
  5. Write outputs/final_videos/<id>_final.mp4.

Usage:
    python3 scripts/assemble_short.py --video-id 001            # dry-run, prints plan
    python3 scripts/assemble_short.py --video-id 001 --live      # actually runs ffmpeg
"""
import argparse
import shutil
import subprocess
from pathlib import Path

from utils import OUTPUTS_DIR, ROOT, get_logger, update_video_row

logger = get_logger("assemble_short", "generation.log")

TARGET_RESOLUTION = "1080:1920"
TARGET_FPS = 30


def find_scene_clips(video_id: str) -> list[Path]:
    clips_dir = ROOT / "assets" / "raw_clips" / video_id
    if not clips_dir.exists():
        raise FileNotFoundError(
            f"No raw clips found at {clips_dir}. "
            f"Run create_kling_tasks.py --video-id {video_id} --live-kling first."
        )
    clips = sorted(clips_dir.glob("scene_*.mp4"))
    if not clips:
        raise FileNotFoundError(f"No scene_*.mp4 files in {clips_dir}.")
    return clips


def find_sound_file(video_id: str) -> Path | None:
    sounds_dir = ROOT / "assets" / "sounds"
    for ext in (".mp3", ".wav", ".m4a"):
        candidate = sounds_dir / f"{video_id}{ext}"
        if candidate.exists():
            return candidate
    return None


def normalize_clips(clips: list[Path], temp_dir: Path, live: bool) -> list[Path]:
    temp_dir.mkdir(parents=True, exist_ok=True)
    normalized = []
    for clip in clips:
        out = temp_dir / f"norm_{clip.stem}.mp4"
        normalized.append(out)
        cmd = [
            "ffmpeg", "-y", "-i", str(clip),
            "-vf", f"scale={TARGET_RESOLUTION}:force_original_aspect_ratio=increase,crop={TARGET_RESOLUTION},fps={TARGET_FPS}",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-ar", "48000",
            str(out),
        ]
        if not live:
            logger.info("[DRY-RUN] normalize: %s", " ".join(cmd))
            continue
        subprocess.run(cmd, check=True)
    return normalized


def build_concat_file(temp_dir: Path, normalized_clips: list[Path]) -> Path:
    concat_path = temp_dir / "concat.txt"
    lines = [f"file '{clip.resolve()}'" for clip in normalized_clips]
    concat_path.write_text("\n".join(lines) + "\n")
    return concat_path


def assemble(video_id: str, live: bool) -> Path:
    clips = find_scene_clips(video_id)
    subtitles = ROOT / "assets" / "subtitles" / f"{video_id}.srt"
    if not subtitles.exists():
        raise FileNotFoundError(
            f"Subtitles not found: {subtitles}. Run create_subtitles.py --video-id {video_id} first."
        )
    sound_file = find_sound_file(video_id)

    temp_dir = ROOT / "assets" / "temp" / video_id
    out_path = OUTPUTS_DIR / "final_videos" / f"{video_id}_final.mp4"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    normalized = normalize_clips(clips, temp_dir, live)

    if not live:
        logger.info(
            "[DRY-RUN] Would concat %d normalized clips, burn subtitles=%s, sound=%s, write %s",
            len(clips), subtitles, sound_file or "none", out_path,
        )
        print(
            f"DRY-RUN: {len(clips)} clips -> normalize -> concat -> burn subtitles "
            f"({subtitles.name}) -> {'mix ' + sound_file.name if sound_file else 'no sound file found, audio left as-is'} "
            f"-> {out_path}"
        )
        return out_path

    concat_path = build_concat_file(temp_dir, normalized)
    concat_temp = temp_dir / "concat_raw.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_path), "-c", "copy", str(concat_temp)],
        check=True,
    )

    subtitles_escaped = str(subtitles).replace("\\", "/").replace(":", "\\:")
    vf = f"subtitles={subtitles_escaped}"

    if sound_file:
        cmd = [
            "ffmpeg", "-y",
            "-i", str(concat_temp),
            "-i", str(sound_file),
            "-vf", vf,
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-map", "0:v:0", "-map", "1:a:0",
            "-shortest",
            "-c:a", "aac",
            str(out_path),
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-i", str(concat_temp),
            "-vf", vf,
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            str(out_path),
        ]
    subprocess.run(cmd, check=True)
    shutil.rmtree(temp_dir, ignore_errors=True)
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()

    out_path = assemble(args.video_id, args.live)

    if not args.live:
        return

    update_video_row(
        args.video_id,
        status="assembled",
        output_file=f"outputs/final_videos/{args.video_id}_final.mp4",
    )
    logger.info("Assembled final video for video_id=%s -> %s", args.video_id, out_path)
    print(f"Final video written: {out_path}")


if __name__ == "__main__":
    main()
