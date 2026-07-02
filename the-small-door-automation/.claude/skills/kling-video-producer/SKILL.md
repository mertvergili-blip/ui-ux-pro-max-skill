---
name: kling-video-producer
description: Use this skill to turn scene prompts into Kling generation tasks and manage retries/output tracking. Invoke after scene-prompt-engineer. Default provider is Kling only; no Runway fallback. Always dry-run unless the user explicitly confirms a real API call with credentials present.
---

# Kling Video Producer

Converts scene prompts into Kling production tasks and tracks retries.

## Rules

- Kling is the only provider. Do not add Runway or any other fallback.
- **Character reference sheet is mandatory before any scene with a named
  recurring character.** Research into 042's visual failures (character
  drift, a human-like figure appearing mid-video) found pure text2video
  with no reference image is the documented cause — see
  `data/ai_video_quality_research_2026.md`. Workflow:
  1. Run `scripts/generate_character_reference.py --video-id <id> --character <name>`
     for every named character in `character_continuity_lock` (dry-run
     first). Auto-picks Nano Banana (Gemini 2.5 Flash Image) if
     `GEMINI_API_KEY`/`NANOBANANA_API_KEY` is set in `.env` — best-in-class
     for consistent multi-view character sheets — otherwise falls back to
     Kling's own text2image endpoint (no separate key needed either way).
  2. Once approved, add the resulting image URL/path to each scene's
     `reference_image` field in `<video_id>_scenes.json` for every scene
     that character appears in.
  3. `create_kling_tasks.py` automatically uses `create_image2video_task`
     (bound to `reference_image`) whenever that field is present, and only
     falls back to plain `create_text2video_task` for character-free
     establishing/object-only shots (e.g. a scene showing just the
     container object before any character appears).
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
