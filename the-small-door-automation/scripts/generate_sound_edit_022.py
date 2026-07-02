#!/usr/bin/env python3
"""Add a fully synthesized ambience/SFX track to video 022's assembled,
subtitle-burned short (toaster boxing arena theme).

Takes outputs/final_videos/022_final.mp4 and produces
outputs/final_videos/022_sound_edit.mp4 with an audio track built ONLY
from ffmpeg's built-in audio source filters (anoisesrc, sine) + filters
(lowpass/highpass/bandpass/tremolo/afade/aecho/amix). No external sound
libraries, no copyrighted music, no narration, no clear speech, no
network calls, no API keys. Visuals untouched (-c:v copy).

Usage:
    python3 scripts/generate_sound_edit_022.py            # dry-run, prints plan
    python3 scripts/generate_sound_edit_022.py --live     # actually runs ffmpeg
"""
import argparse
import subprocess
from pathlib import Path

from utils import OUTPUTS_DIR, get_logger

logger = get_logger("generate_sound_edit_022", "generation.log")

SAMPLE_RATE = 48000
VIDEO_ID = "022"


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(out.stdout.strip())


def build_audio_filter_complex(duration: float) -> tuple[str, str]:
    """Layers, timed against 022's 30s scene breakdown (Hook 0-2s,
    Wrongness 2-11s, Reveal 11-19s, Twist 19-27s, Cliffhanger 27-30s):

      - low kitchen room tone     : pink noise, band-limited, very quiet, continuous
      - electric warmth hum       : brown noise, lowpass ~100Hz, continuous, toaster-coil glow
      - toaster spring pop        : sharp high-passed noise transient at ~0.2s (the belt popping up)
      - tiny boxing bell (x2)     : sine + echo, at ~0.3s (belt appears) and ~15.3s (round two)
      - tiny crowd murmur         : filtered noise swell, textured/non-vocal, under 11.5-19s
      - glove impact / soft thump : short low-passed burst at ~19.0s (slice goes down)
      - final magical chime       : three-note sine chord + echo tail at ~27.5s
    """
    d = f"{duration:.3f}"
    parts = []

    parts.append(f"anoisesrc=d={d}:c=pink:r={SAMPLE_RATE}:a=0.5,highpass=f=250,lowpass=f=900,volume=0.012[room]")
    parts.append(f"anoisesrc=d={d}:c=brown:r={SAMPLE_RATE}:a=0.5,lowpass=f=100,volume=0.04[hum]")

    parts.append(
        f"anoisesrc=d=0.2:c=white:r={SAMPLE_RATE},highpass=f=2500,"
        "afade=t=out:st=0.04:d=0.16,volume=1.6,adelay=180|180[pop]"
    )

    parts.append(
        f"sine=f=1567:d=1.2:r={SAMPLE_RATE},afade=t=in:d=0.01,afade=t=out:st=0.25:d=0.95,"
        "volume=0.8,aecho=0.6:0.5:180:0.4,adelay=300|300[bell1]"
    )
    parts.append(
        f"sine=f=1567:d=1.2:r={SAMPLE_RATE},afade=t=in:d=0.01,afade=t=out:st=0.25:d=0.95,"
        "volume=0.8,aecho=0.6:0.5:180:0.4,adelay=15300|15300[bell2]"
    )

    parts.append(
        f"anoisesrc=d=7.5:c=pink:r={SAMPLE_RATE},bandpass=f=900:w=700,"
        "afade=t=in:d=1.5,afade=t=out:st=5.5:d=2,volume=0.025,adelay=11500|11500[crowd]"
    )

    parts.append(
        f"anoisesrc=d=0.3:c=brown:r={SAMPLE_RATE},lowpass=f=300,"
        "afade=t=in:d=0.01,afade=t=out:st=0.08:d=0.22,volume=1.1,adelay=19000|19000[thump]"
    )

    parts.append(
        f"sine=f=659:d=2.2:r={SAMPLE_RATE},afade=t=in:d=0.02,afade=t=out:st=0.4:d=1.8,"
        "volume=0.45,aecho=0.6:0.5:300:0.45,adelay=27500|27500[chime1]"
    )
    parts.append(
        f"sine=f=988:d=2.2:r={SAMPLE_RATE},afade=t=in:d=0.02,afade=t=out:st=0.4:d=1.8,"
        "volume=0.35,aecho=0.6:0.5:300:0.45,adelay=27550|27550[chime2]"
    )
    parts.append(
        f"sine=f=1319:d=2.2:r={SAMPLE_RATE},afade=t=in:d=0.02,afade=t=out:st=0.4:d=1.8,"
        "volume=0.28,aecho=0.6:0.5:300:0.45,adelay=27600|27600[chime3]"
    )

    labels = "room hum pop bell1 bell2 crowd thump chime1 chime2 chime3".split()
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
        print("DRY-RUN: would synthesize ambience/SFX track (kitchen room tone, electric "
              "warmth hum, spring pop, boxing bell x2, crumb-crowd murmur, glove thump, "
              "final chime) -> " + str(out_wav))
        return
    subprocess.run(cmd, check=True)


def build_sound_edit(live: bool) -> Path:
    final_video = OUTPUTS_DIR / "final_videos" / f"{VIDEO_ID}_final.mp4"
    if not final_video.exists():
        raise FileNotFoundError(f"Final video not found: {final_video}. Run assemble_short.py first.")

    out_path = OUTPUTS_DIR / "final_videos" / f"{VIDEO_ID}_sound_edit.mp4"
    temp_dir = OUTPUTS_DIR.parent / "assets" / "temp" / f"{VIDEO_ID}_sound"
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
    logger.info("Built sound edit for video_id=%s -> %s", VIDEO_ID, out_path)
    print(f"Sound edit written: {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    build_sound_edit(args.live)


if __name__ == "__main__":
    main()
