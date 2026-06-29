# The Small Door — Production Automation

Semi-automated (≈80% automation / 20% human review) pipeline for **The Small
Door**, a faceless YouTube Shorts channel about tiny magical worlds hidden
inside ordinary objects. Tagline: *Tiny hidden worlds behind ordinary things.*

Everything defaults to **dry-run** and **private**. No video is ever
auto-published; no real API call fires without `--live` and real credentials
in `.env`.

## Pipeline

```
idea → script → scene prompts → Kling tasks → sound plan → subtitles/edit plan
→ ffmpeg assembly → QC → metadata → private YouTube upload → analytics review
```

| Stage | Skill | Script |
|---|---|---|
| Brand rules | `small-door-brand-bible` | — |
| Idea | `shorts-idea-generator` | `scripts/generate_ideas.py` |
| Script | `cinematic-scriptwriter` | `scripts/generate_script.py` |
| Scene prompts | `scene-prompt-engineer` | `scripts/generate_scene_prompts.py` |
| Kling generation | `kling-video-producer` | `scripts/create_kling_tasks.py`, `scripts/download_kling_outputs.py` |
| Sound | `asmr-sound-designer` | (manual JSON, see `prompts/sound_templates.md`) |
| Subtitles/edit | `subtitle-and-edit-planner` | `scripts/create_subtitles.py` |
| Assembly | — | `scripts/assemble_short.py` |
| QC | `safety-copyright-qc` | `scripts/run_qc.py` |
| Metadata | `metadata-seo-writer` | (manual JSON, see skill) |
| Upload | `youtube-private-uploader` | `scripts/upload_private_youtube.py` |
| Analytics | `analytics-reviewer` | `scripts/analyze_results.py` |

## Getting started

1. Install: Python 3.11+, FFmpeg, Git. Copy `.env.example` to `.env` and fill
   in keys when you have them — never commit `.env`.
2. Backlog lives in `data/video_queue.csv`, already seeded with 20 ideas.
3. Video 001 ("I found a tiny train station inside my fridge") already has
   full draft artifacts in `outputs/metadata/001_*.json` and
   `assets/subtitles/001.srt`.
4. Run any script with no flags for a safe dry-run, e.g.:

```bash
cd the-small-door-automation
python3 scripts/generate_ideas.py --object "teapot" --hidden-world "tiny opera house" \
  --title "I found a tiny opera house inside my teapot" \
  --hook "Steam kept rising from my empty teapot." --subseries "Cup Worlds"

python3 scripts/create_kling_tasks.py --video-id 001        # dry-run, logs intended prompts
python3 scripts/create_subtitles.py --video-id 001
python3 scripts/assemble_short.py --video-id 001            # prints ffmpeg command only
python3 scripts/run_qc.py --video-id 001 --result needs_manual_review --notes "..."
python3 scripts/upload_private_youtube.py --video-id 001    # refuses unless QC approved
python3 scripts/analyze_results.py
```

5. Real Kling and YouTube API calls are intentionally left as `NotImplementedError`
   stubs in `create_kling_tasks.py`/`download_kling_outputs.py`/
   `upload_private_youtube.py` — wire them in once you have real credentials,
   then run with `--live`.

## Safety defaults

- Only Kling is used as a video provider; no Runway fallback.
- Max 3 generation attempts per scene, then `needs_manual_review`.
- Every video must pass `safety-copyright-qc` before metadata/upload.
- Upload visibility is always `private`; public release is a manual decision
  made in YouTube Studio.
- API keys are read from `.env` only, never logged, never committed
  (`.gitignore` covers `.env`, logs, raw clips, temp files, final videos).
