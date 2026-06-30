#!/usr/bin/env python3
"""Mix video 022's character voice lines (assets/voice/022/*.mp3) with the
synthesized SFX bed (boxing bell, toaster ding, punch thump, crowd gasp,
censor beep) onto the assembled, subtitle-burned video.

Reuses the ffmpeg-only synthesized ambience from generate_sound_edit_022.py
for the non-voice layer, then overlays the voice lines at their scripted
start times (per generate_voice_022.py's VOICE_LINES), plus a short beep
tone over the censored word in line 04.

No narrator track — only short character voice lines + ambience/SFX, per
channel rule. Visuals untouched (-c:v copy).

Usage:
    python3 scripts/mix_voice_and_sfx_022.py            # dry-run, prints plan
    python3 scripts/mix_voice_and_sfx_022.py --live     # actually runs ffmpeg
                                                          # (requires voice files
                                                          #  already generated)
"""
import argparse
import subprocess
from pathlib import Path

from generate_sound_edit_022 import SAMPLE_RATE, build_audio_filter_complex, probe_duration
from generate_voice_022 import VOICE_DIR, VOICE_LINES
from utils import OUTPUTS_DIR, get_logger

logger = get_logger("mix_voice_and_sfx_022", "generation.log")

VIDEO_ID = "022"

# Short censor beep layered over the swear in line 04 ("I'll [bleep] you up").
# Timed to land mid-line; adjust against the real generated clip length once
# voice lines exist.
BEEP_START_OFFSET = 0.35
BEEP_DURATION = 0.4


def build_beep_filter(adelay_ms: int) -> str:
    return (
        f"sine=f=1000:d={BEEP_DURATION}:r={SAMPLE_RATE},"
        f"afade=t=in:d=0.02,afade=t=out:st={BEEP_DURATION - 0.05}:d=0.05,"
        f"volume=0.9,adelay={adelay_ms}|{adelay_ms}[beep]"
    )


def mix(live: bool) -> Path:
    final_video = OUTPUTS_DIR / "final_videos" / f"{VIDEO_ID}_final.mp4"
    out_path = OUTPUTS_DIR / "final_videos" / f"{VIDEO_ID}_voice_test.mp4"
    temp_dir = OUTPUTS_DIR.parent / "assets" / "temp" / f"{VIDEO_ID}_voice_mix"

    voice_paths = [VOICE_DIR / f"{line['id']}.mp3" for line in VOICE_LINES]
    censor_line = next(l for l in VOICE_LINES if l["id"] == "04_rye_beep_you_up")
    beep_delay_ms = int((censor_line["start"] + BEEP_START_OFFSET) * 1000)

    if not live:
        print("DRY-RUN: would mix video 022 voice + SFX:")
        print(f"  - base video: {final_video}")
        print(f"  - SFX bed: same synthesized ambience as generate_sound_edit_022.py "
              f"(room tone, hum, spring pop, bell x2, crowd murmur, thump, chime), "
              f"levels raised relative to prior videos but capped via alimiter")
        for line in VOICE_LINES:
            vp = VOICE_DIR / f"{line['id']}.mp3"
            print(f"  - voice line {line['id']!r} ({line['speaker']}) at t={line['start']}s "
                  f"<- {vp} (must exist: generate via generate_voice_022.py --live first)")
        print(f"  - censor beep over swear word in line 04 at t={beep_delay_ms / 1000:.2f}s, "
              f"duration={BEEP_DURATION}s")
        print(f"  -> output: {out_path}")
        return out_path

    if not final_video.exists():
        raise FileNotFoundError(f"{final_video} not found. Run assemble_short.py first.")
    missing = [p for p in voice_paths if not p.exists()]
    if missing:
        raise FileNotFoundError(
            f"Missing voice files: {missing}. Run generate_voice_022.py --live first."
        )

    temp_dir.mkdir(parents=True, exist_ok=True)
    duration = probe_duration(final_video)
    ambience_filter, ambience_label = build_audio_filter_complex(duration)

    # Inputs: 0=video, 1..N=voice lines
    cmd = ["ffmpeg", "-y", "-i", str(final_video)]
    voice_filter_parts = []
    voice_labels = []
    for idx, (line, vp) in enumerate(zip(VOICE_LINES, voice_paths), start=1):
        cmd += ["-i", str(vp)]
        delay_ms = int(line["start"] * 1000)
        label = f"voice{idx}"
        voice_filter_parts.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume=1.4[{label}]")
        voice_labels.append(label)

    beep_filter = build_beep_filter(beep_delay_ms)

    full_filter = (
        ambience_filter + ";" +
        ";".join(voice_filter_parts) + ";" +
        beep_filter + ";" +
        f"[{ambience_label}]" + "".join(f"[{l}]" for l in voice_labels) + "[beep]" +
        f"amix=inputs={1 + len(voice_labels) + 1}:normalize=0,alimiter=limit=0.95[aout]"
    )

    cmd += [
        "-filter_complex", full_filter,
        "-map", "0:v:0", "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(out_path),
    ]
    subprocess.run(cmd, check=True)
    logger.info("Built voice+SFX mix for video_id=%s -> %s", VIDEO_ID, out_path)
    print(f"Voice test video written: {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    mix(args.live)


if __name__ == "__main__":
    main()
