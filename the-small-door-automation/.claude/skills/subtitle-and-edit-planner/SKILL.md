---
name: subtitle-and-edit-planner
description: Use this skill to produce subtitle timing, an .srt/.ass file, and the FFmpeg edit plan for a video. Invoke after the script and scenes exist, before assemble_short.py runs.
---

# Subtitle and Edit Planner

Produces subtitle files and the FFmpeg render plan for one video.

## Rules

- Subtitles must be short and easily readable on screen.
- Clean, simple font; minimal effects.
- Subtitle position: bottom-center, safe within 9:16 frame margins.
- The hook subtitle must appear within the first 2 seconds.
- The final question subtitle must appear in the last 1–2 seconds.

## Output

- `assets/subtitles/<video_id>.srt` (or `.ass` if styling requires it)
- A subtitle timing plan (start/end per line, matching `cinematic-scriptwriter`
  timings)
- Recommended FFmpeg subtitle burn-in settings (font, size, margin, color)
- Final render settings: 1080x1920, 9:16, target 25–35s duration

Use `scripts/create_subtitles.py` to generate the `.srt` and the timing JSON
in `outputs/metadata/<video_id>_subtitles.json`.
