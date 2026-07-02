#!/usr/bin/env python3
"""Add a fully synthesized ambience/SFX track to an already-assembled,
subtitle-burned Small Door short.

Takes outputs/final_videos/<id>_final.mp4 (visuals + subtitles already
burned in by assemble_short.py) and produces
outputs/final_videos/<id>_sound_edit.mp4 with an audio track built ONLY
from ffmpeg's built-in audio source filters (anoisesrc, sine) + filters
(lowpass/highpass/bandpass/tremolo/afade/aecho/amix). No external sound
libraries, no copyrighted music, no narration, no network calls, no API
keys. Visuals are untouched (-c:v copy).

Usage:
    python3 scripts/generate_sound_edit.py --video-id 021            # dry-run, prints plan
    python3 scripts/generate_sound_edit.py --video-id 021 --live     # actually runs ffmpeg
"""
import argparse
import subprocess
from pathlib import Path

from utils import OUTPUTS_DIR, get_logger

logger = get_logger("generate_sound_edit", "generation.log")

SAMPLE_RATE = 48000


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(out.stdout.strip())


def beep(freq: float, start_ms: int, dur: float = 0.18, vol: float = 0.9) -> str:
    label = f"beep{start_ms}"
    return (
        f"sine=f={freq}:d={dur}:r={SAMPLE_RATE},"
        f"afade=t=in:d=0.01,afade=t=out:st={max(dur - 0.05, 0.01):.3f}:d=0.05,"
        f"volume={vol},adelay={start_ms}|{start_ms}[{label}]"
    ), label


def build_audio_filter_complex(duration: float) -> tuple[str, str]:
    """Layers, timed against 021's 30s scene breakdown (Hook 0-2s,
    Wrongness 2-11s, Reveal 11-19s, Twist 19-27s, Cliffhanger 27-30s):

      - low electrical hum            : brown noise, lowpass ~110Hz, continuous
      - soft room tone                : pink noise, band-limited, very quiet, continuous
      - faint wire/electric texture   : band-passed noise + tremolo, continuous low
      - tiny digital countdown beeps  : descending sine pips at 9/8/7 (~6.8-10.7s)
                                         and 3/2 (~23.3-26.7s)
      - control room ambience swell   : filtered noise rising under the reveal (11-19s)
      - lights shutting off           : sharp downward-pitched noise burst (~27.0s)
      - final soft dark chime         : single low minor-feeling tone + echo tail (~28.5s)
    """
    d = f"{duration:.3f}"
    parts = []

    parts.append(f"anoisesrc=d={d}:c=brown:r={SAMPLE_RATE}:a=0.5,lowpass=f=110,volume=0.045[hum]")
    parts.append(f"anoisesrc=d={d}:c=pink:r={SAMPLE_RATE}:a=0.5,highpass=f=250,lowpass=f=800,volume=0.01[room]")
    parts.append(
        f"anoisesrc=d={d}:c=brown:r={SAMPLE_RATE}:a=0.5,bandpass=f=600:w=400,"
        "tremolo=f=7:d=0.5,volume=0.018[wire]"
    )

    labels = ["hum", "room", "wire"]

    countdown1 = [(6800, 880), (8000, 784), (9300, 698)]
    countdown2 = [(23300, 698), (25000, 622)]
    for start_ms, freq in countdown1 + countdown2:
        f_str, label = beep(freq, start_ms, dur=0.16, vol=0.55)
        parts.append(f_str)
        labels.append(label)

    parts.append(
        f"anoisesrc=d=8:c=pink:r={SAMPLE_RATE},bandpass=f=500:w=500,"
        "afade=t=in:d=3,afade=t=out:st=6:d=2,volume=0.03,adelay=11000|11000[control]"
    )
    labels.append("control")

    parts.append(
        f"anoisesrc=d=0.6:c=white:r={SAMPLE_RATE},lowpass=f=4000,"
        "afade=t=in:d=0.02,afade=t=out:st=0.15:d=0.45,volume=1.3,adelay=27000|27000[lightsoff]"
    )
    labels.append("lightsoff")

    parts.append(
        f"sine=f=220:d=2.0:r={SAMPLE_RATE},afade=t=in:d=0.02,afade=t=out:st=0.4:d=1.6,"
        "volume=0.5,aecho=0.6:0.5:400:0.45,adelay=28500|28500[chime]"
    )
    labels.append("chime")

    mix_inputs = "".join(f"[{l}]" for l in labels)
    parts.append(
        f"{mix_inputs}amix=inputs={len(labels)}:normalize=0,"
        f"atrim=0:{d},asetpts=PTS-STARTPTS,"
        "alimiter=limit=0.9[aout]"
    )

    return ";".join(parts), "aout"


def synthesize_ambience(duration: float, out_wav: Path, live: bool) -> None:
    filter_complex, label = build_audio_filter_complex(duration)
    cmd = [
        "ffmpeg", "-y",
        "-filter_complex", filter_complex,
        "-map", f"[{label}]",
        "-ar", str(SAMPLE_RATE),
        str(out_wav),
    ]
    if not live:
        logger.info("[DRY-RUN] synthesize ambience: %s", " ".join(cmd))
        print("DRY-RUN: would synthesize ambience/SFX track with ffmpeg source filters "
              "(low electrical hum, soft room tone, wire texture, digital countdown beeps, "
              "control room swell, lights-off burst, final dark chime) -> " + str(out_wav))
        return
    subprocess.run(cmd, check=True)


def build_sound_edit(video_id: str, live: bool) -> Path:
    final_video = OUTPUTS_DIR / "final_videos" / f"{video_id}_final.mp4"
    if not final_video.exists():
        raise FileNotFoundError(f"Final video not found: {final_video}. Run assemble_short.py first.")

    out_path = OUTPUTS_DIR / "final_videos" / f"{video_id}_sound_edit.mp4"
    temp_dir = OUTPUTS_DIR.parent / "assets" / "temp" / f"{video_id}_sound"
    temp_dir.mkdir(parents=True, exist_ok=True)
    ambience_wav = temp_dir / "ambience.wav"

    if not live:
        print(f"DRY-RUN: probe {final_video.name} duration -> synth ambience.wav -> mux onto video (copy, no re-encode) -> {out_path}")
        synthesize_ambience(30.0, ambience_wav, live=False)
        return out_path

    duration = probe_duration(final_video)
    synthesize_ambience(duration, ambience_wav, live=True)

    cmd = [
        "ffmpeg", "-y",
        "-i", str(final_video),
        "-i", str(ambience_wav),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(out_path),
    ]
    subprocess.run(cmd, check=True)
    logger.info("Built sound edit for video_id=%s -> %s", video_id, out_path)
    print(f"Sound edit written: {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    build_sound_edit(args.video_id, args.live)


if __name__ == "__main__":
    main()
