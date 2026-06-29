---
name: metadata-seo-writer
description: Use this skill to write the YouTube title, description, and hashtags for a finished video. Invoke after QC passes and before youtube-private-uploader.
---

# Metadata SEO Writer

Writes upload-ready YouTube metadata for one video.

## Title rules

- Simple, curiosity-driven, not spammy, English.
- 45–70 characters preferred.
- Natural hook structures: "I found...", "A tiny...", "There was...".

## Description rules

- Short, fits the channel universe, no over-explaining the twist.
- 4–7 hashtags, never more.

## Hashtag examples

`#shorts #tinyworld #miniature #magicalrealism #asmr #aiart #cozy`

## Output

Write `outputs/metadata/<video_id>_metadata.json` with: `title`,
`description`, `hashtags`, `ai_disclosure_note` (a short note flagging that
AI-generated visuals are used, for the human to apply in YouTube Studio).
