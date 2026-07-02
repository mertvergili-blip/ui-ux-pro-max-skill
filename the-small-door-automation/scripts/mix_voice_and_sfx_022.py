#!/usr/bin/env python3
"""Mix video 022's V2 final voice lines with the synthesized SFX bed.

Voice source: assets/voice/022_processed_cartoon/ (B-Cartoon post-processed).
SFX bed: same ffmpeg-synthesized ambience as generate_sound_edit_022.py
(room tone, hum, spring pop, boxing bell x2, crowd murmur, punch thump,
toaster ding), layered underneath the voice — SFX ducks automatically under
dialogue via a sidechain-style volume envelope (see DUCK_ZONES).

Censorship: both censored lines (04 and 07) are spoken uncensored in the
audio; no beep/censor tone is applied in this mix. Caption censoring is
handled at the subtitle-burn step, not here.

No narrator track — only short in-character voice lines + SFX/ambience, per
channel rule. Visuals untouched (-c:v copy). Base video for V2 is NOT the
old assembled 022_final.mp4 (which was the V1 visual; see V2 Kling visual
generation plan in data/video_022_v2_final_plan.md). This script is
intentionally left dry-run only until V2 visuals exist.

Usage:
    python3 scripts/mix_voice_and_sfx_022.py            # dry-run, prints plan
    python3 scripts/mix_voice_and_sfx_022.py --live     # actually runs ffmpeg
                                                          # (requires V2 base
                                                          #  video + voice files)
"""
import argparse
import subprocess
from pathlib import Path

from generate_sound_edit_022 import SAMPLE_RATE, build_audio_filter_complex, probe_duration
from postprocess_voice_022 import FINAL_VARIANT, processed_dir, processed_path
from generate_voice_022 import VOICE_LINES
from utils import OUTPUTS_DIR, get_logger

logger = get_logger("mix_voice_and_sfx_022", "generation.log")

VIDEO_ID = "022"

# Processed voice dir (B-Cartoon, locked final variant).
PROCESSED_VOICE_DIR = processed_dir(FINAL_VARIANT)

# Finalized 7-line voice timing (seconds), in mix order.
# Text and IDs match generate_voice_022.py::VOICE_LINES exactly.
# Neither line 04 ("I'll fuck you up, mate.") nor line 07
# ("Breakfast is over, bitch.") uses a beep/censor tone in this mix —
# both are spoken uncensored in the audio; only the on-screen caption
# is censored (handled at subtitle-burn step, not here).
#
# Censor approach summary (for mix_voice_and_sfx_022.py purposes):
#   04 wheat_bread @ 11.8s — no beep, no censor tone, full audio kept.
#   07 dark_rye   @ 26.0s — no beep, no censor tone, full audio kept.

# Duck zones: (start_s, end_s) windows where the SFX bed is attenuated
# under voice. Derived from VOICE_LINES start times with 0.3s pre-roll
# and 0.5s post-roll to bracket each replik cleanly.
DUCK_ZONES = [
    (max(0, line["start"] - 0.3), line["start"] + 1.2)
    for line in VOICE_LINES
]

# Per-line voice gain (dB scale factor applied before mix).
# Main characters (referee, wheat, rye) centered at 1.5; crowd slightly
# higher for the burst effect; all capped by downstream alimiter.
VOICE_GAINS = {
    "referee_crumb": 1.5,
    "wheat_bread":   1.5,
    "dark_rye":      1.5,
    "crowd_crumbs":  1.7,
}

# SFX bed attenuation factor during duck zones (0–1 scale; 0.25 = -12 dB).
SFX_DUCK_LEVEL = 0.25


def _build_duck_filter(ambience_label: str, duration: float) -> tuple[str, str]:
    """Return (filter_chain_str, output_label) for a ducked SFX bed.

    Applies volume ramps at each DUCK_ZONE so voice sits clearly above the SFX.
    Uses simple volume= keyframe-style via multiple volume filter instances
    chained with asplit/amerge would be complex; instead we use a single
    volume filter with an enable expression covering all duck windows.
    """
    if not DUCK_ZONES:
        return f"[{ambience_label}]volume=1.0[sfxduck]", "sfxduck"

    # Build an enable= expression: enable duck when inside any zone.
    enable_parts = [f"between(t,{s},{e})" for s, e in DUCK_ZONES]
    enable_expr = "+".join(enable_parts)  # any zone = sum > 0 = true
    filt = (
        f"[{ambience_label}]"
        f"volume=enable='gt({enable_expr},0)':volume={SFX_DUCK_LEVEL},"
        f"volume=enable='not(gt({enable_expr},0))':volume=1.0"
        f"[sfxduck]"
    )
    return filt, "sfxduck"


def mix(live: bool) -> Path:
    # V2 base video: assembled from V2 Kling scenes (not yet generated).
    # The old 022_final.mp4 is V1 visuals and must NOT be used for the
    # final mix — this script will refuse to run --live until the V2 base
    # video exists at this path.
    v2_base_video = OUTPUTS_DIR / "final_videos" / f"{VIDEO_ID}_v2_assembled.mp4"
    out_path = OUTPUTS_DIR / "final_videos" / f"{VIDEO_ID}_v2_voice_mix.mp4"
    temp_dir = OUTPUTS_DIR.parent / "assets" / "temp" / f"{VIDEO_ID}_v2_voice_mix"

    voice_paths = [processed_path(FINAL_VARIANT, line) for line in VOICE_LINES]

    if not live:
        print("DRY-RUN: would build video 022 V2 voice+SFX mix:")
        print(f"  - base video (V2): {v2_base_video}")
        print(f"    (NOT yet generated — waiting on V2 Kling visual generation)")
        print(f"  - SFX bed: synthesized ambience from generate_sound_edit_022.py,")
        print(f"    ducked under dialogue at {len(DUCK_ZONES)} voice windows (SFX "
              f"level={SFX_DUCK_LEVEL} during voice, 1.0 otherwise)")
        print(f"  - Censor: NO audio beep on any line. Lines 04 and 07 are spoken")
        print(f"    uncensored; caption censoring handled at subtitle-burn step only.")
        for line in VOICE_LINES:
            vp = processed_path(FINAL_VARIANT, line)
            gain = VOICE_GAINS.get(line["speaker"], 1.5)
            print(f"  - {line['id']!r} ({line['speaker']}) @ t={line['start']}s "
                  f"gain={gain} <- {vp}")
        print(f"  - Voice center-panned, crowd spread stereo via postprocess chain.")
        print(f"  - alimiter=limit=0.95 on final output — no clipping.")
        print(f"  -> output: {out_path}")
        return out_path

    if not v2_base_video.exists():
        raise FileNotFoundError(
            f"{v2_base_video} not found. V2 Kling visuals must be assembled first — "
            "run assemble_short.py against V2 Kling scene outputs."
        )
    missing = [p for p in voice_paths if not p.exists()]
    if missing:
        raise FileNotFoundError(
            f"Missing processed voice files: {missing}. "
            f"Run postprocess_voice_022.py --live --variant cartoon first."
        )

    temp_dir.mkdir(parents=True, exist_ok=True)
    duration = probe_duration(v2_base_video)
    ambience_filter, ambience_label = build_audio_filter_complex(duration)
    duck_filter, duck_label = _build_duck_filter(ambience_label, duration)

    # Inputs: 0=video, 1..N=processed voice lines
    cmd = ["ffmpeg", "-y", "-i", str(v2_base_video)]
    voice_filter_parts = []
    voice_labels = []
    for idx, (line, vp) in enumerate(zip(VOICE_LINES, voice_paths), start=1):
        cmd += ["-i", str(vp)]
        delay_ms = int(line["start"] * 1000)
        gain = VOICE_GAINS.get(line["speaker"], 1.5)
        label = f"voice{idx}"
        voice_filter_parts.append(
            f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume={gain}[{label}]"
        )
        voice_labels.append(label)

    full_filter = (
        ambience_filter + ";" +
        duck_filter + ";" +
        ";".join(voice_filter_parts) + ";" +
        f"[{duck_label}]" + "".join(f"[{l}]" for l in voice_labels) +
        f"amix=inputs={1 + len(voice_labels)}:normalize=0,"
        "alimiter=limit=0.95[aout]"
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
    logger.info("Built V2 voice+SFX mix for video_id=%s -> %s", VIDEO_ID, out_path)
    print(f"V2 voice mix video written: {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    mix(args.live)


if __name__ == "__main__":
    main()
