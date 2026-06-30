#!/usr/bin/env python3
"""Post-process video 022's already-generated ElevenLabs voice lines into a
dirtier, less "clean TTS" cartoon-fighter texture using only local ffmpeg
audio filters (pitch shift via asetrate/aresample, EQ, bitcrush, soft-clip).

No network call, no ElevenLabs, no Kling, no video mix, no upload. Reads
existing mp3s from assets/voice/022/ (never deletes/overwrites them) and
writes test versions to assets/voice/022_processed/, plus a single
before/after preview montage at outputs/audio/022_voice_style_test_v1.mp3.

Usage:
    python3 scripts/postprocess_voice_022.py            # dry-run, prints plan
    python3 scripts/postprocess_voice_022.py --live     # actually runs ffmpeg
"""
import argparse
import subprocess
from pathlib import Path

from generate_voice_022 import VOICE_DIR, VOICE_LINES
from utils import OUTPUTS_DIR, get_logger

logger = get_logger("postprocess_voice_022", "generation.log")

SAMPLE_RATE = 44100
VIDEO_ID = "022"

PROCESSED_DIR = OUTPUTS_DIR.parent / "assets" / "voice" / f"{VIDEO_ID}_processed"
MONTAGE_PATH = OUTPUTS_DIR / "audio" / f"{VIDEO_ID}_voice_style_test_v1.mp3"

# Per-character "dirty cartoon" treatment. asetrate+aresample shifts pitch
# (and tempo, which reads as part of the cartoon character rather than a
# flaw for these short barks); equalizer pushes the nasal/chest resonance;
# acrusher adds light bitcrush grit; asoftclip adds gentle distortion;
# alimiter keeps everything from clipping.
CHARACTER_FILTERS = {
    "referee_crumb": (
        f"asetrate={SAMPLE_RATE}*1.18,aresample={SAMPLE_RATE},"
        "equalizer=f=3000:width_type=h:width=2000:g=4,"
        "acrusher=bits=14:mode=lin:mix=0.15,"
        "asoftclip=type=tanh,"
        "volume=1.2,alimiter=limit=0.95"
    ),
    "wheat_bread": (
        f"asetrate={SAMPLE_RATE}*1.12,aresample={SAMPLE_RATE},"
        "equalizer=f=2000:width_type=h:width=1500:g=6,"
        "acrusher=bits=12:mode=lin:mix=0.25,"
        "asoftclip=type=hard,"
        "volume=1.25,alimiter=limit=0.95"
    ),
    "dark_rye": (
        f"asetrate={SAMPLE_RATE}*0.85,aresample={SAMPLE_RATE},"
        "equalizer=f=300:width_type=h:width=400:g=5,"
        "acrusher=bits=13:mode=lin:mix=0.1,"
        "asoftclip=type=tanh,"
        "volume=1.15,alimiter=limit=0.95"
    ),
}

# crowd_crumbs gets a dedicated 3-layer filter_complex instead of a single -af chain.
CROWD_LAYER_FILTER = (
    "[0:a]asetrate={sr}*1.0,aresample={sr},volume=1.0,alimiter=limit=0.95[l1];"
    "[0:a]asetrate={sr}*1.3,aresample={sr},adelay=40|40,volume=0.7,alimiter=limit=0.95[l2];"
    "[0:a]asetrate={sr}*0.75,aresample={sr},adelay=80|80,volume=0.6,alimiter=limit=0.95[l3];"
    "[l1][l2][l3]amix=inputs=3:normalize=0,alimiter=limit=0.95[aout]"
).format(sr=SAMPLE_RATE)


def processed_path(line: dict) -> Path:
    return PROCESSED_DIR / f"{line['id']}_processed.mp3"


def process_line(line: dict, live: bool) -> Path:
    speaker = line["speaker"]
    in_path = VOICE_DIR / f"{line['id']}.mp3"
    out_path = processed_path(line)

    if speaker == "crowd_crumbs":
        cmd = [
            "ffmpeg", "-y", "-i", str(in_path),
            "-filter_complex", CROWD_LAYER_FILTER,
            "-map", "[aout]",
            str(out_path),
        ]
        desc = "3-layer chaotic crowd burst (pitch-up+delay, pitch-down+quiet, base layer, mixed+limited)"
    else:
        filt = CHARACTER_FILTERS[speaker]
        cmd = ["ffmpeg", "-y", "-i", str(in_path), "-af", filt, str(out_path)]
        desc = f"pitch/EQ/bitcrush/soft-clip chain for {speaker!r}"

    if not live:
        logger.info("[DRY-RUN] postprocess line=%s speaker=%s -> %s", line["id"], speaker, out_path)
        print(f"DRY-RUN: would postprocess {in_path} ({desc}) -> {out_path}")
        return out_path

    if not in_path.exists():
        raise FileNotFoundError(f"{in_path} not found. Run generate_voice_022.py --live first.")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    subprocess.run(cmd, check=True)
    logger.info("Postprocessed line=%s speaker=%s -> %s", line["id"], speaker, out_path)
    print(f"Processed voice line written: {out_path}")
    return out_path


def build_montage(live: bool) -> Path:
    """Concatenate original -> processed for each line, in VOICE_LINES order,
    with a short silence gap between every segment."""
    MONTAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    temp_dir = OUTPUTS_DIR.parent / "assets" / "temp" / f"{VIDEO_ID}_voice_style_test"

    if not live:
        for line in VOICE_LINES:
            print(f"DRY-RUN: montage segment -> original {line['id']}.mp3 then processed {line['id']}_processed.mp3")
        print(f"DRY-RUN: would write montage -> {MONTAGE_PATH}")
        return MONTAGE_PATH

    temp_dir.mkdir(parents=True, exist_ok=True)
    silence_path = temp_dir / "gap.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono",
         "-t", "0.4", "-q:a", "9", str(silence_path)],
        check=True,
    )

    segments = []
    for line in VOICE_LINES:
        segments.append(VOICE_DIR / f"{line['id']}.mp3")
        segments.append(processed_path(line))

    inputs = []
    for idx, seg in enumerate(segments):
        if idx > 0:
            inputs.append(silence_path)
        inputs.append(seg)

    cmd = ["ffmpeg", "-y"]
    for inp in inputs:
        cmd += ["-i", str(inp)]
    n = len(inputs)
    concat_filter = "".join(f"[{i}:a]" for i in range(n)) + f"concat=n={n}:v=0:a=1[aout]"
    cmd += ["-filter_complex", concat_filter, "-map", "[aout]", str(MONTAGE_PATH)]

    subprocess.run(cmd, check=True)
    logger.info("Built voice style test montage -> %s", MONTAGE_PATH)
    print(f"Montage written: {MONTAGE_PATH}")
    return MONTAGE_PATH


def run(live: bool) -> None:
    for line in VOICE_LINES:
        process_line(line, live)
    build_montage(live)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    run(args.live)


if __name__ == "__main__":
    main()
