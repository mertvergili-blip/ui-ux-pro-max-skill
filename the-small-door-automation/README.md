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
| Kling generation | `kling-video-producer` | `scripts/create_kling_tasks.py` (generate + download in one step) |
| Sound | `asmr-sound-designer` | (manual JSON, see `prompts/sound_templates.md`) |
| Subtitles/edit | `subtitle-and-edit-planner` | `scripts/create_subtitles.py` |
| Assembly | — | `scripts/assemble_short.py` |
| QC | `safety-copyright-qc` | `scripts/run_qc.py` |
| Metadata | `metadata-seo-writer` | (manual JSON, see skill) |
| Upload | `youtube-private-uploader` | `scripts/upload_private_youtube.py` |
| Analytics | `analytics-reviewer` | `scripts/analyze_results.py` |
| **Full pipeline (one command)** | — | `scripts/run_full_pipeline.py` |

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
python3 scripts/assemble_short.py --video-id 001            # prints ffmpeg plan only
python3 scripts/run_qc.py --video-id 001 --auto              # automated technical check (dry: will fail, no final video yet)
python3 scripts/upload_private_youtube.py --video-id 001    # refuses unless QC approved
python3 scripts/analyze_results.py
```

5. YouTube auth is already done for this channel (`credentials/youtube_token.json`
   exists). Real Kling generation now has a working implementation — see
   "Autonomous Kling Pipeline" below — gated behind `--live-kling`.

## Autonomous Kling Pipeline

This section explains, for someone who doesn't write code, how to go from
Video 001's existing script/scene-prompt artifacts to a finished, QC'd,
private-on-YouTube video using one command — and what to do if something
goes wrong. You never touch the Kling website or download files by hand;
the scripts do it.

### 1. Get a Kling API key

1. Go to the **KlingAI Open Platform**: https://app.klingai.com/global/dev
2. Sign in / create a developer account.
3. Open the **API Keys** section and create a new key pair. Kling issues
   this as two values together — an **Access Key** and a **Secret Key** —
   not a single key. Copy both immediately; the secret key is only shown once.

### 2. Put the keys in `.env`

In `the-small-door-automation/.env` (create it from `.env.example` if you
haven't already), fill in:

```
KLING_ACCESS_KEY=<paste your Access Key here>
KLING_SECRET_KEY=<paste your Secret Key here>
```

Leave everything else in that block (`KLING_BASE_URL`, `KLING_DEFAULT_MODEL`,
etc.) as-is unless Kling support tells you otherwise. `.env` is in
`.gitignore` — it will never be committed or shown in chat.

### 3. The one command for a single video

Dry-run first (always safe, makes no network calls, costs nothing):

```bash
cd the-small-door-automation
python3 scripts/run_full_pipeline.py --video-id 001
```

When you're ready for the real thing — this is the **one command** that
generates the Kling clips, downloads them, assembles the final video, runs
QC, and (only if QC passes) uploads privately to YouTube:

```bash
python3 scripts/run_full_pipeline.py --video-id 001 --live-kling --assemble --qc --upload-private
```

You can also run it in stages, e.g. generate + assemble + QC but stop
before uploading (drop `--upload-private`), to review the video yourself
first.

### 4. What gets produced, and where

| Stage | Output |
|---|---|
| Kling generation | `assets/raw_clips/001/scene_01.mp4` … `scene_05.mp4` |
| Kling task log | `outputs/metadata/001_kling_results.json` |
| FFmpeg assembly | `outputs/final_videos/001_final.mp4` |
| QC result | `data/qc_log.csv` + `qc_status` column in `data/video_queue.csv` |
| Upload | private YouTube URL printed in the terminal + `youtube_url` column |

### 5. If something fails

- **A scene fails to generate**: the pipeline retries that scene up to 3
  times automatically (each retry simplifies the prompt). If all 3 fail,
  the video is marked `needs_manual_review` in `data/video_queue.csv` and
  the pipeline stops before assembly — nothing broken gets uploaded.
- **Error details**: check `logs/errors.log` (Kling API/network errors,
  never contains your keys) and `logs/generation.log` (step-by-step log).
- **"Account balance not enough" (Kling error code 1102)**: this means the
  *API key's* balance is empty, not your code or your account in general.
  Run `python3 scripts/check_kling_balance.py` first — it confirms whether
  your key authenticates at all (without spending any credits), but it
  **cannot** show your actual credit balance: Kling does not publish a
  balance-check API endpoint. **Kling web wallet credits and Kling Open
  Platform / API credits can be separate balances** — having credit on the
  consumer website does not guarantee the API key has any. Confirm your
  real API balance directly in **KlingAI Open Platform → API Console →
  Billing / Resource Package** (or your reseller's billing dashboard) before
  retrying `--live-kling`.
- **QC fails** (wrong duration, wrong resolution, missing subtitles, etc.):
  `python3 scripts/run_qc.py --video-id 001 --auto` prints exactly which
  checks failed. Fix the underlying issue (e.g. re-run assembly) and re-run QC.
  Note `--auto` only checks technical correctness (duration, resolution,
  files present) — it does **not** replace the `safety-copyright-qc` content
  review (no faces, no logos, fits the channel, etc.), which still needs a
  human or Claude judgement call via
  `python3 scripts/run_qc.py --video-id 001 --result approved_private_upload`.

### 6. Where the final video ends up / how to actually publish it

The pipeline only ever uploads as **private**. Once you see the private
YouTube URL printed in the terminal, the video exists on the channel but
is visible to no one else. To make it public, you go into **YouTube
Studio** yourself and change the visibility manually — this is intentional
and is never done by any script here.

## Safety defaults

- Only Kling is used as a video provider; no Runway fallback.
- Max 3 generation attempts per scene, then `needs_manual_review`.
- Every video must pass `safety-copyright-qc` before metadata/upload.
- Upload visibility is always `private`; public release is a manual decision
  made in YouTube Studio. **No script in this repo has a public-upload code
  path or flag — public release can only happen by hand in YouTube Studio.**
- Real Kling calls only happen with the explicit `--live-kling` flag; real
  uploads only happen with the explicit `--live`/`--upload-private` flag.
  Everything else is dry-run by default.
- API keys are read from `.env` only, never logged, never printed to chat,
  never committed (`.gitignore` covers `.env`, `credentials/`, logs, raw
  clips, temp files, final videos).
