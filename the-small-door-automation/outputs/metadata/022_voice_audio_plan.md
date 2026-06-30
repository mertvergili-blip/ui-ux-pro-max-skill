# Video 022 — Voice & Audio Plan

Status: planning only. No voice has been generated. No API has been called.
No credits spent.

## Why this fits the channel's "no narrator" rule

`CLAUDE.md` hard rule: "No long voice-over / no narrator. Only short English
subtitles + ASMR sound + ambience." The lines below are short in-character
barks (1 word to one short sentence each), not narration explaining the
plot — so they stay inside that rule. If this distinction is wrong in the
user's view, flag before any voice is generated.

## Voice vibe

Tiny bread fighters talking trash inside a toaster boxing ring. Funny,
aggressive, chaotic, WTF, but always intelligible. Natural-sounding, punchy,
energetic, lightly pitch-shifted for a "small character" feel — never
robotic, never a silly/broken cartoon voice.

## Voice lines (per character)

| Scene | Speaker | Line | Note |
|---|---|---|---|
| 1 | referee_crumb | "Round one!" | sharp, small, announcer bark |
| 3 | wheat_bread | "You're done, rye." | cocky, short |
| 3 | dark_rye | "Touch me and you're crumbs." | low, gritty, threatening |
| 4 | dark_rye | "I'll [bleep] you up." | profanity must be censored — see below |
| 4 | crowd_crumbs | "OHHH!" | group reaction ad-lib |
| 5 | dark_rye | "Breakfast is over." | triumphant, punchy |

No real human voice, no celebrity voice, no impersonation, no copyrighted
voice/character voice.

## Profanity handling

The line "I'll [bleep] you up" is never written or subtitled in full. In
the rendered caption it appears as "I'll [bleep] you up" or similar
placeholder; in the audio mix, the profane word is covered by a short
censor-beep/tone, not spoken aloud uncensored.

## Open decision — needs explicit user approval before any generation

Voice generation method is **not chosen yet**. Two paths, no default
selected:

1. **Local/safe-only path** (no new API): pitch-shifted/processed short
   recorded or synthesized SFX-style "voice" hits (grunts, short
   exclamations) combined with the bold centered captions doing the verbal
   heavy lifting — i.e. captions carry the actual words, audio carries tone
   and punch (formant-shifted blips, percussive vocal-like hits via
   ffmpeg). This stays entirely within the existing local/ffmpeg toolchain
   already used for `generate_sound_edit_022.py`.
2. **TTS/voice API path** (e.g. ElevenLabs, inference.sh, or similar) for
   actual spoken character lines. **Not to be used without explicit user
   sign-off**, per direct instruction: "Benim onayım olmadan ElevenLabs,
   inference.sh, belt veya başka yeni API kullanma."

Until the user picks one, the production-ready default assumed by this
plan is **path 1** (local/safe SFX + bleep + caption combination), since
it requires no new API and no credit spend.

## Mix / loudness direction

- Punch, boxing bell, and toaster-ding SFX: louder and more present than
  prior videos (021/022 cinematic version), audible on phone speakers.
- Must not clip or distort — peak levels stay under a safe ceiling (no
  harsh/painful spikes), same ffmpeg-safe-limiting approach as the existing
  sound-edit script.
- Crowd murmur / hum stays as a low bed under dialogue, never masking the
  voice lines or captions.
