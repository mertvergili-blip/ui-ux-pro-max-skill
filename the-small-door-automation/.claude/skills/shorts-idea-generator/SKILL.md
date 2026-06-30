---
name: shorts-idea-generator
description: Use this skill to generate new The Small Door video ideas and append them to data/video_queue.csv. Invoke when the user asks for new video ideas, wants to grow the backlog, or wants ideas for a specific subseries.
---

# Shorts Idea Generator

Generates new video concepts for The Small Door and appends them to
`data/video_queue.csv` with `status=idea`.

## Required fields per idea

- `object` — the ordinary object.
- `hidden_world` — the miniature world found inside/behind/under it.
- `emotional_mood` — one or two words (cozy, eerie-warm, wistful, playful-mystery...).
- `title` — see `prompts/title_templates.md`.
- `hook` — the 0–2s curiosity line.
- `twist` — the 25–32s twist.
- `final_question` — the comment-baiting closer.
- `possible_subseries` — one of the subseries in `data/channel_bible.md`.

## Rules

- Run every idea against `small-door-brand-bible` bans before adding it.
- Avoid repeating an `object`/`hidden_world` pair already in `video_queue.csv`.
- Favor variety across subseries rather than stacking one subseries.
- Keep titles 45–70 characters per `prompts/title_templates.md`.
- Append new rows via `scripts/generate_ideas.py` (CSV-first; Google Sheets
  sync is optional and additive, never required).
- Follow the "WTF-but-cinematic" creative direction in `data/channel_bible.md`:
  ordinary object + impossible hidden world + WTF reveal + tiny living
  system + cinematic quality + final question. Prefer clearly photogenic,
  instantly recognizable objects over vague/abstract ones.
- Score every idea with the WTF Watchability Score (7 axes, /10 each) before
  it can move past script/scene-prompt stage. Total must be ≥45/60 to
  proceed to live Kling generation; below that, keep it script-only or
  rework it — never spend generation credits on a low-scoring idea.
