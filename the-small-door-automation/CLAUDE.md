# CLAUDE.md — The Small Door Automation

This file guides Claude Code when working inside `the-small-door-automation/`.

## What this project is

A semi-automated (80% automation / 20% human review) production pipeline for
**The Small Door**, a faceless, global English-language YouTube Shorts channel
about tiny magical worlds hidden inside ordinary objects.

Tagline: *Tiny hidden worlds behind ordinary things.*

## Hard rules (never violate)

- No human faces, real people, celebrities, brands, logos, or copyrighted characters.
- No long voice-over / no narrator. Only short English subtitles + ASMR sound + ambience.
- Every video: 25–35 seconds, 9:16 vertical.
- Every video upload defaults to **private**. Public release is a manual human decision.
- Never call the real Kling or YouTube APIs with live credentials in this repo's
  automated flow without explicit human confirmation — scripts default to `--dry-run`.
- Never commit `.env`, API keys, or any real credentials.

## Pipeline order

idea (shorts-idea-generator) → script (cinematic-scriptwriter) →
scene prompts (scene-prompt-engineer) → Kling tasks (kling-video-producer) →
sound plan (asmr-sound-designer) → subtitles/edit plan (subtitle-and-edit-planner) →
ffmpeg assembly (assemble_short.py) → QC (safety-copyright-qc) →
metadata (metadata-seo-writer) → private upload (youtube-private-uploader) →
analytics (analytics-reviewer)

## Key files

- `data/channel_bible.md` — canonical brand/voice/visual rules.
- `data/video_queue.csv` — backlog of video ideas and their pipeline status.
- `.claude/skills/*/SKILL.md` — one skill per pipeline stage.
- `scripts/*.py` — runnable skeletons matching each skill, all dry-run by default.
- `outputs/metadata/*.json` — per-video script/prompt/metadata bundles.

## Style

- Keep scripts modular, one responsibility per file.
- Log generation/upload/error events to `logs/`, never log API keys.
- Prefer local CSV over Google Sheets until the pipeline is stable; keep the
  Sheets integration optional and additive.
