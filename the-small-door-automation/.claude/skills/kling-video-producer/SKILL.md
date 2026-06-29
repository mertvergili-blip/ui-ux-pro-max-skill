---
name: kling-video-producer
description: Use this skill to turn scene prompts into Kling generation tasks and manage retries/output tracking. Invoke after scene-prompt-engineer. Default provider is Kling only; no Runway fallback. Always dry-run unless the user explicitly confirms a real API call with credentials present.
---

# Kling Video Producer

Converts scene prompts into Kling production tasks and tracks retries.

## Rules

- Kling is the only provider. Do not add Runway or any other fallback.
- Maximum 3 attempts per scene:
  1. First attempt: prompt as written by `scene-prompt-engineer`.
  2. If it fails: simplify the prompt (remove secondary details, keep
     subject + light + camera motion).
  3. If it still fails: regenerate with fewer objects in frame.
  4. If the 3rd attempt still fails: mark the video `needs_manual_review` in
     `data/video_queue.csv` and stop automated retries for that scene.
- Every attempt is logged to `logs/generation.log` (no API keys in logs).
- Successful clips are written to `assets/raw_clips/<video_id>/scene_<n>_<attempt>.mp4`.
- Never make a real API call unless `KLING_API_KEY`/`KLING_ACCESS_KEY` are
  present in `.env` and the run is explicitly invoked without `--dry-run`.

## Workflow

1. Read `outputs/metadata/<video_id>_scenes.json`.
2. For each scene, call `scripts/create_kling_tasks.py` (dry-run by default).
3. Call `scripts/download_kling_outputs.py` to fetch completed clips.
4. Update `output_file` and `provider` in `data/video_queue.csv`.
