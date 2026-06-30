#!/usr/bin/env python3
"""Post-process video 022's already-generated ElevenLabs voice lines into
three "dirtiness" variants using only local ffmpeg audio filters (pitch
shift via asetrate/aresample, EQ, bitcrush, soft-clip) — no ElevenLabs,
no Kling, no video mix, no upload.

Variants (least to most processed):
  A "light"   — subtle, words stay very clean, safer Shorts/Reels version.
  B "cartoon" — the target: dirty, hoarse, funny, adult-animation energy,
                still fully intelligible. Same chain as the original v1 test.
  C "extreme" — exaggerated meme-level distortion, heavier bitcrush/pitch,
                still no clipping and still intelligible.

Reads existing mp3s from assets/voice/022/ (never deletes/overwrites them)
and writes each variant to assets/voice/022_processed_<variant>/, plus a
before/after preview montage per variant under outputs/audio/.

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

# Each variant defines: output dir suffix, montage filename, per-character
# -af filter chain, and the crowd 3-layer filter_complex params (pitch
# ratios / delays / volumes per layer). alimiter always caps peaks so none
# of these can clip regardless of how aggressive the chain gets.
VARIANTS = {
    "light": {
        "dir_suffix": "022_processed_light",
        "montage_name": "022_voice_style_test_A_light.mp3",
        "label": "A) LIGHT DIRTY — subtle, very intelligible, safer version",
        "character_filters": {
            "referee_crumb": (
                f"asetrate={SAMPLE_RATE}*1.08,aresample={SAMPLE_RATE},"
                "equalizer=f=3000:width_type=h:width=2000:g=2,"
                "acrusher=bits=16:mode=lin:mix=0.05,"
                "asoftclip=type=tanh,"
                "volume=1.05,alimiter=limit=0.95"
            ),
            "wheat_bread": (
                f"asetrate={SAMPLE_RATE}*1.06,aresample={SAMPLE_RATE},"
                "equalizer=f=2000:width_type=h:width=1500:g=3,"
                "acrusher=bits=16:mode=lin:mix=0.07,"
                "asoftclip=type=tanh,"
                "volume=1.08,alimiter=limit=0.95"
            ),
            "dark_rye": (
                f"asetrate={SAMPLE_RATE}*0.92,aresample={SAMPLE_RATE},"
                "equalizer=f=300:width_type=h:width=400:g=2,"
                "acrusher=bits=16:mode=lin:mix=0.05,"
                "asoftclip=type=tanh,"
                "volume=1.0,alimiter=limit=0.95"
            ),
        },
        "crowd_layers": [
            {"rate": 1.0, "delay": 0, "volume": 1.0},
            {"rate": 1.15, "delay": 30, "volume": 0.55},
        ],
    },
    "cartoon": {
        "dir_suffix": "022_processed_cartoon",
        "montage_name": "022_voice_style_test_B_cartoon.mp3",
        "label": "B) UGLY CARTOON — target: dirty/hoarse/funny, still intelligible",
        "character_filters": {
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
        },
        "crowd_layers": [
            {"rate": 1.0, "delay": 0, "volume": 1.0},
            {"rate": 1.3, "delay": 40, "volume": 0.7},
            {"rate": 0.75, "delay": 80, "volume": 0.6},
        ],
    },
    "extreme": {
        "dir_suffix": "022_processed_extreme",
        "montage_name": "022_voice_style_test_C_extreme.mp3",
        "label": "C) EXTREME MEME — exaggerated, heaviest distortion, still no clipping",
        "character_filters": {
            "referee_crumb": (
                f"asetrate={SAMPLE_RATE}*1.32,aresample={SAMPLE_RATE},"
                "equalizer=f=3200:width_type=h:width=2200:g=7,"
                "acrusher=bits=9:mode=lin:mix=0.35,"
                "asoftclip=type=hard,"
                "volume=1.35,alimiter=limit=0.93"
            ),
            "wheat_bread": (
                f"asetrate={SAMPLE_RATE}*1.25,aresample={SAMPLE_RATE},"
                "equalizer=f=2100:width_type=h:width=1600:g=10,"
                "acrusher=bits=7:mode=lin:mix=0.5,"
                "asoftclip=type=hard,"
                "volume=1.4,alimiter=limit=0.93"
            ),
            "dark_rye": (
                f"asetrate={SAMPLE_RATE}*0.72,aresample={SAMPLE_RATE},"
                "equalizer=f=280:width_type=h:width=420:g=9,"
                "acrusher=bits=8:mode=lin:mix=0.35,"
                "asoftclip=type=hard,"
                "volume=1.3,alimiter=limit=0.93"
            ),
        },
        "crowd_layers": [
            {"rate": 1.0, "delay": 0, "volume": 1.0},
            {"rate": 1.5, "delay": 30, "volume": 0.75},
            {"rate": 0.6, "delay": 60, "volume": 0.7},
            {"rate": 1.2, "delay": 100, "volume": 0.55},
            {"rate": 0.85, "delay": 140, "volume": 0.5},
        ],
    },
}


def build_crowd_filter(layers: list[dict]) -> str:
    parts = []
    labels = []
    for idx, layer in enumerate(layers, start=1):
        label = f"l{idx}"
        labels.append(label)
        parts.append(
            f"[0:a]asetrate={SAMPLE_RATE}*{layer['rate']},aresample={SAMPLE_RATE},"
            f"adelay={layer['delay']}|{layer['delay']},volume={layer['volume']},"
            f"alimiter=limit=0.95[{label}]"
        )
    mix_in = "".join(f"[{l}]" for l in labels)
    parts.append(f"{mix_in}amix=inputs={len(labels)}:normalize=0,alimiter=limit=0.95[aout]")
    return ";".join(parts)


def processed_dir(variant: str) -> Path:
    return OUTPUTS_DIR.parent / "assets" / "voice" / VARIANTS[variant]["dir_suffix"]


def processed_path(variant: str, line: dict) -> Path:
    return processed_dir(variant) / f"{line['id']}_processed.mp3"


def montage_path(variant: str) -> Path:
    return OUTPUTS_DIR / "audio" / VARIANTS[variant]["montage_name"]


def process_line(variant: str, line: dict, live: bool) -> Path:
    cfg = VARIANTS[variant]
    speaker = line["speaker"]
    in_path = VOICE_DIR / f"{line['id']}.mp3"
    out_path = processed_path(variant, line)

    if speaker == "crowd_crumbs":
        filt = build_crowd_filter(cfg["crowd_layers"])
        cmd = ["ffmpeg", "-y", "-i", str(in_path), "-filter_complex", filt, "-map", "[aout]", str(out_path)]
        desc = f"{len(cfg['crowd_layers'])}-layer crowd burst"
    else:
        filt = cfg["character_filters"][speaker]
        cmd = ["ffmpeg", "-y", "-i", str(in_path), "-af", filt, str(out_path)]
        desc = f"pitch/EQ/bitcrush/soft-clip chain for {speaker!r}"

    if not live:
        logger.info("[DRY-RUN] variant=%s line=%s speaker=%s -> %s", variant, line["id"], speaker, out_path)
        print(f"DRY-RUN [{variant}]: would postprocess {in_path} ({desc}) -> {out_path}")
        return out_path

    if not in_path.exists():
        raise FileNotFoundError(f"{in_path} not found. Run generate_voice_022.py --live first.")

    processed_dir(variant).mkdir(parents=True, exist_ok=True)
    subprocess.run(cmd, check=True)
    logger.info("Postprocessed variant=%s line=%s speaker=%s -> %s", variant, line["id"], speaker, out_path)
    print(f"[{variant}] Processed voice line written: {out_path}")
    return out_path


def build_montage(variant: str, live: bool) -> Path:
    out_path = montage_path(variant)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    temp_dir = OUTPUTS_DIR.parent / "assets" / "temp" / f"{VIDEO_ID}_voice_style_test_{variant}"

    if not live:
        for line in VOICE_LINES:
            print(f"DRY-RUN [{variant}]: montage segment -> original {line['id']}.mp3 "
                  f"then processed {line['id']}_processed.mp3")
        print(f"DRY-RUN [{variant}]: would write montage -> {out_path}")
        return out_path

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
        segments.append(processed_path(variant, line))

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
    cmd += ["-filter_complex", concat_filter, "-map", "[aout]", str(out_path)]

    subprocess.run(cmd, check=True)
    logger.info("Built voice style test montage variant=%s -> %s", variant, out_path)
    print(f"[{variant}] Montage written: {out_path}")
    return out_path


def run(live: bool) -> None:
    for variant in VARIANTS:
        for line in VOICE_LINES:
            process_line(variant, line, live)
        build_montage(variant, live)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    run(args.live)


if __name__ == "__main__":
    main()
