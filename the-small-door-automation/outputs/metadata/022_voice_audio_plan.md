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

## Decision: ElevenLabs (approved, dry-run infra only so far)

User approved ElevenLabs for actual spoken character lines (local/ffmpeg-
only SFX was explicitly rejected as insufficient — "sadece bleep + caption
yeterli değil"). Infra has been built but **no live call has been made**:

- `.env.example`: added `ELEVENLABS_API_KEY=` (empty placeholder).
- `.gitignore`: added `assets/voice/` (generated audio never committed).
- `scripts/utils.py`: `ELEVENLABS_API_KEY` added to `SENSITIVE_KEYS` so it's
  never logged.
- `scripts/generate_voice_022.py`: generates the 6 lines below via
  ElevenLabs TTS. Defaults to `--dry-run` (prints plan, no network call);
  `--live` requires `ELEVENLABS_API_KEY` in `.env` and real `voice_id`s
  filled into `VOICE_PRESETS` (currently placeholders).
- `scripts/mix_voice_and_sfx_022.py`: layers the generated voice files onto
  the existing synthesized SFX bed (same ambience as
  `generate_sound_edit_022.py`) plus a short censor-beep over the swear
  word in line 04, output to `outputs/final_videos/022_voice_test.mp4`.
  Also dry-run by default.

Neither script has been run with `--live`. No ElevenLabs API key has been
entered anywhere by Claude — the user must add it to `.env` directly.

## Mix / loudness direction

- Punch, boxing bell, and toaster-ding SFX: louder and more present than
  prior videos (021/022 cinematic version), audible on phone speakers.
- Must not clip or distort — peak levels stay under a safe ceiling (no
  harsh/painful spikes), same ffmpeg-safe-limiting approach as the existing
  sound-edit script.
- Crowd murmur / hum stays as a low bed under dialogue, never masking the
  voice lines or captions.
