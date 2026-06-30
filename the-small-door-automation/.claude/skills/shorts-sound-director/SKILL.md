---
name: shorts-sound-director
description: Use this skill to design and verify the ASMR/cinematic sound for a The Small Door video. Invoke after viral-retention-editor produces its edit plan, before platform-reels-adapter. Must block approval if the final video has no audible audio track.
---

# Shorts Sound Director

Owns sound design quality for a video before it's allowed to move to
metadata/upload. The Small Door has no narrator and no dialogue — sound
*is* the emotional engine of the video, so this skill treats missing or
weak audio as a blocking issue, not a nice-to-have.

## When to invoke

After `viral-retention-editor` produces its edit plan, before
`platform-reels-adapter`. Re-invoke after any retention edit pass that
changes pacing or subtitle timing, since SFX timing depends on it.

## What to inspect

- The final video file (`outputs/final_videos/<id>_final.mp4` or the
  retention-edited variant). Use `ffprobe -show_streams` to confirm an
  audio stream exists at all, and check its bitrate/sample rate.
- Any existing sound plan/file at `assets/sounds/<id>.*` or
  `prompts/sound_templates.md`.
- The scene breakdown for what physical sounds the scenes imply (e.g. a
  fridge door, steam, a paper ticket, a bell, rain).

## Checklist

- **Audio track present?** Run an `ffprobe` check — if there is no audio
  stream at all, this is an automatic block, not a warning.
- **Audible level?** A silent or near-silent (effectively inaudible) track
  is treated the same as missing audio.
- **First-second sound**: is there something audible immediately that
  draws attention without being jarring or loud enough to feel like an ad?
- **Reveal moment**: does the tiny-world reveal get a magical
  chime/shimmer/subtle swell, or does it pass in silence?
- **Per-scene SFX coverage**: does every distinct visual beat (door, steam,
  ticket sliding, bell, rain, etc.) have a corresponding sound cue planned?
- **Royalty safety**: every suggested sound must be either generated
  (ASMR/Foley synthesis, generative audio tools) or explicitly
  royalty-free/CC0 — never a copyrighted music track or sample.
- **Mix plan**: ambience bed (constant low-level texture) vs. discrete SFX
  (one-shot hits) should be distinguished, with rough relative volumes.

## Output (always produce all of these)

1. **Audio track status** — present/missing, audible/inaudible, with the
   `ffprobe` evidence (codec, duration, whether silent).
2. **Missing sounds** — list of visual beats with no corresponding sound.
3. **Scene-by-scene SFX list** — one entry per scene_number with the
   specific sound(s) it needs.
4. **Ambience bed** — the continuous background texture recommendation for
   the whole video (e.g. "low fridge hum, very quiet, -30dB").
5. **Volume/mix notes** — relative levels between ambience, SFX, and (if
   present) subtitle-timed emphasis swells.
6. **FFmpeg audio mix suggestion** — a concrete `-i`/`-filter_complex`/`amix`
   style plan that `assemble_short.py` could apply, given the named sound
   files.
7. **Approval or revision recommendation** — one of `approved`,
   `needs_audio_revision` (if a sound plan exists but is weak/incomplete),
   or `blocked_no_audio` (if there is no usable audio track at all).

## Hard rules

- A video with no audio track or an inaudible track must never receive
  `approved` here — only `blocked_no_audio` or `needs_audio_revision`.
- Never recommend copyrighted/commercial music.
- Never trigger upload directly; only recommend.
