#!/usr/bin/env python3
"""Build a retention-optimized edit of an already-assembled Small Door short.

Takes outputs/final_videos/<id>_final.mp4 (already QC'd) and produces
outputs/final_videos/<id>_retention_edit.mp4 with:
  - A fully synthesized ambience/SFX track built ONLY from ffmpeg's built-in
    audio source filters (anoisesrc, sine) + filters (lowpass/highpass/
    bandpass/tremolo/afade/aecho/amix). No external sound libraries, no
    copyrighted music, no APIs, no narration.
  - A shorter, punchier subtitle track (assets/subtitles/<id>_retention.srt).
  - No re-cut of the visuals: the original clip order/footage is untouched,
    only audio + subtitles change, so this never overwrites <id>_final.mp4.

This script makes NO network calls and requires NO API keys.

Usage:
    python3 scripts/generate_retention_edit.py --video-id 001            # dry-run, prints plan
    python3 scripts/generate_retention_edit.py --video-id 001 --live     # actually runs ffmpeg
"""
import argparse
import subprocess
from pathlib import Path

from utils import OUTPUTS_DIR, ROOT, get_logger

logger = get_logger("generate_retention_edit", "generation.log")

SAMPLE_RATE = 48000


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(out.stdout.strip())


def build_audio_filter_complex(duration: float) -> tuple[str, str]:
    """Returns (filter_complex_string, output_label) synthesizing the full
    ambience/SFX bed entirely from ffmpeg source filters.

    Layers (all procedurally generated, no samples/files):
      - low fridge hum            : brown noise, lowpass ~120Hz, continuous
      - cold room ambience        : pink noise, band-limited, very quiet, continuous
      - attention hook (0-1s)     : sub-bass thump + high-passed noise snap
      - tiny distant bell (~2.3s) : sine tone + echo tail, low volume ("distant")
      - soft steam hiss (~7.3s)   : band-passed white noise, slow fade
      - train/rail texture (~12.5s): filtered brown noise + tremolo (rhythmic chug)
      - paper ticket slide (~17s) : two short high-passed noise bursts
      - final magical chime (~24.5s): three-note sine chord + echo tail
    """
    d = f"{duration:.3f}"
    parts = []

    parts.append(f"anoisesrc=d={d}:c=brown:r={SAMPLE_RATE}:a=0.5,lowpass=f=120,volume=0.05[hum]")
    parts.append(f"anoisesrc=d={d}:c=pink:r={SAMPLE_RATE}:a=0.5,highpass=f=300,lowpass=f=900,volume=0.012[cold]")

    parts.append(
        f"sine=f=50:d=1.0:r={SAMPLE_RATE},"
        "afade=t=in:d=0.02,afade=t=out:st=0.45:d=0.55,volume=3.0,"
        "adelay=0|0[hook]"
    )
    parts.append(
        f"anoisesrc=d=0.3:c=white:r={SAMPLE_RATE},highpass=f=3000,"
        "afade=t=out:st=0.05:d=0.25,volume=2.2,adelay=0|0[hooksnap]"
    )

    parts.append(
        f"sine=f=1318:d=2.0:r={SAMPLE_RATE},"
        "afade=t=in:d=0.01,afade=t=out:st=0.3:d=1.7,volume=1.1,"
        "aecho=0.6:0.5:200:0.4,adelay=2300|2300[bell]"
    )

    parts.append(
        f"anoisesrc=d=4.5:c=white:r={SAMPLE_RATE},highpass=f=2500,lowpass=f=6000,"
        "afade=t=in:d=1.0,afade=t=out:st=3.0:d=1.5,volume=0.045,"
        "adelay=7300|7300[hiss]"
    )

    parts.append(
        f"anoisesrc=d=4.5:c=brown:r={SAMPLE_RATE},bandpass=f=400:w=300,"
        "tremolo=f=4:d=0.7,volume=0.08,adelay=12500|12500[train]"
    )

    parts.append(
        f"anoisesrc=d=0.25:c=white:r={SAMPLE_RATE},highpass=f=1500,"
        "afade=t=out:st=0.05:d=0.2,volume=1.4,adelay=17000|17000[paper1]"
    )
    parts.append(
        f"anoisesrc=d=0.2:c=white:r={SAMPLE_RATE},highpass=f=1800,"
        "afade=t=out:st=0.04:d=0.16,volume=1.2,adelay=17250|17250[paper2]"
    )

    parts.append(
        f"sine=f=880:d=2.0:r={SAMPLE_RATE},afade=t=in:d=0.01,afade=t=out:st=0.3:d=1.7,"
        "volume=0.9,aecho=0.6:0.5:300:0.5,adelay=24400|24400[chime1]"
    )
    parts.append(
        f"sine=f=1318:d=2.0:r={SAMPLE_RATE},afade=t=in:d=0.01,afade=t=out:st=0.3:d=1.7,"
        "volume=0.7,aecho=0.6:0.5:300:0.5,adelay=24450|24450[chime2]"
    )
    parts.append(
        f"sine=f=1760:d=2.0:r={SAMPLE_RATE},afade=t=in:d=0.01,afade=t=out:st=0.3:d=1.7,"
        "volume=0.55,aecho=0.6:0.5:300:0.5,adelay=24500|24500[chime3]"
    )

    labels = "hum cold hook hooksnap bell hiss train paper1 paper2 chime1 chime2 chime3".split()
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
              "(fridge hum, cold room bed, attention hook, distant bell, steam hiss, "
              "rail texture, paper slide, final chime) -> " + str(out_wav))
        return
    subprocess.run(cmd, check=True)


def build_retention_edit(video_id: str, live: bool) -> Path:
    base_video = OUTPUTS_DIR / "final_videos" / f"{video_id}_final.mp4"
    if not base_video.exists():
        raise FileNotFoundError(
            f"Base video not found: {base_video}. Run assemble_short.py --video-id {video_id} --live first."
        )
    subtitles = ROOT / "assets" / "subtitles" / f"{video_id}_retention.srt"
    if not subtitles.exists():
        raise FileNotFoundError(f"Retention subtitles not found: {subtitles}.")

    out_path = OUTPUTS_DIR / "final_videos" / f"{video_id}_retention_edit.mp4"
    temp_dir = ROOT / "assets" / "temp" / f"{video_id}_retention"
    temp_dir.mkdir(parents=True, exist_ok=True)
    ambience_wav = temp_dir / "ambience.wav"

    if not live:
        print(
            f"DRY-RUN: base={base_video.name} duration=<probed at runtime>, "
            f"subtitles={subtitles.name} (6 punchy lines, down from 9), "
            f"-> synth ambience.wav -> mux with original video -> burn subtitles "
            f"-> {out_path}"
        )
        synthesize_ambience(25.533333, ambience_wav, live=False)
        return out_path

    duration = probe_duration(base_video)
    synthesize_ambience(duration, ambience_wav, live=True)

    subtitles_escaped = str(subtitles).replace("\\", "/").replace(":", "\\:")
    vf = f"subtitles={subtitles_escaped}"

    cmd = [
        "ffmpeg", "-y",
        "-i", str(base_video),
        "-i", str(ambience_wav),
        "-vf", vf,
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-map", "0:v:0", "-map", "1:a:0",
        "-shortest",
        "-c:a", "aac", "-b:a", "192k",
        str(out_path),
    ]
    subprocess.run(cmd, check=True)
    logger.info("Built retention edit for video_id=%s -> %s", video_id, out_path)
    print(f"Retention edit written: {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    build_retention_edit(args.video_id, args.live)


if __name__ == "__main__":
    main()
