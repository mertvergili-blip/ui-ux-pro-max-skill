---
name: platform-reels-adapter
description: Use this skill to package one finished, approved The Small Door video into per-platform metadata for YouTube Shorts and Instagram Reels (and future TikTok). Invoke after shorts-sound-director approves, before human approval/upload. Never posts or uploads anything itself — packaging only.
---

# Platform Reels Adapter

Takes one finished video and produces ready-to-paste metadata packages for
each target platform. This skill never publishes or uploads anything — it
only prepares text/assets that a human (or the explicitly-gated uploader
scripts) will use later.

## When to invoke

After `shorts-sound-director` returns `approved`, before human approval and
before `youtube-private-uploader`. Re-run if the video's hook/twist changes
due to a `viral-retention-editor` edit pass.

## Inputs to use

- The final (possibly retention-edited) video and its actual content —
  don't invent plot points the footage doesn't show.
- `data/channel_bible.md` for voice/tone constraints.
- The video's object/hidden_world/hook/title fields from
  `data/video_queue.csv` or `outputs/metadata/<id>_*.json`.
- The `viral-retention-editor` output, if available, for the finalized hook
  line and twist.

## What to produce per video

### YouTube Shorts
- **Title** — short, curiosity-driven, fits The Small Door tone, no
  clickbait that the video doesn't deliver on.
- **Description** — 1-3 sentences plus the channel tagline, includes a
  light comment-driving question if one isn't already in the video.
- **Hashtags** — relevant, not spammy (roughly 3-8 tags).

### Instagram Reels
- **Caption** — shorter and more atmospheric/mysterious than the YouTube
  description; avoid restating the YouTube description verbatim.
- **Hashtags** — Instagram-appropriate set, can differ from YouTube's.
- **Cover text** — short text overlay suggestion for the Reels cover frame
  (only if the brand bible allows on-frame text at all — check it).
- **First comment idea** — a single line suited to be the creator's own
  first comment (often used to add extra hashtags/context without
  cluttering the caption).

### Cross-platform
- Keep descriptions/captions sounding like a real small channel, not an
  obvious AI content farm — no generic phrases like "AI generated video"
  spam, no excessive emoji stacking, no repeated hashtag walls across both
  platforms.

## Output (always produce all of these)

1. YouTube title
2. YouTube description
3. YouTube hashtags
4. Instagram caption
5. Instagram hashtags
6. Reels cover text
7. First comment idea
8. Posting checklist — a plain list of manual steps a human follows to
   actually post (this skill prepares the package; it never posts).

## Hard rules

- Never call any upload/posting API or script — this is text/asset
  preparation only.
- Never claim the video is something it isn't (no real people, no brand
  tie-ins, no claims not supported by the footage).
- Public release language belongs in the posting checklist as a manual
  human step only — never as something this skill or any script automates.
