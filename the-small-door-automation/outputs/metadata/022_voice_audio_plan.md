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

## Voice direction update (post text-described style reference)

User rejected the first ElevenLabs pass for sounding too clean/professional
and gave a detailed text description of the desired tone (no audio could be
analyzed directly — Claude has no audio/video listening capability, only
read access to images/text/PDF — so this is built entirely from the user's
written direction, not a copy of any reference clip's voices/characters/IP).

**Not wanted:** clean/polished TTS, smooth narrator, trailer voice,
podcast-clean delivery, cinematic/professional voice.

**Wanted:** dirty, hoarse/cracked, funny-ugly, aggressive, adult-animation /
weird-internet-cartoon energy, dry close-mic trash talk, short blunt lines
delivered like a slap, characters arguing dead serious about an absurd
situation.

**Voice dramaturgy (rising fight energy):**
- Start: small panic/surprise (referee).
- Middle: trash talk escalates (wheat bread, loud/shrill).
- Pre-punch: voice suddenly drops, goes cold/threatening (dark rye).
- Punch: voice cuts out, SFX/thump spikes.
- After: chaotic layered crowd burst.
- Final: winner speaks calm, dry, cold, funny — no shouting.

**Comedy contrast rule:** wheat_bread is the loud/shrill/panicky/aggressive
side; dark_rye is the quiet/low/deadpan side who drops one calm line and
wins. The contrast between a screaming tiny bread and a bored-sounding one
is the joke.

### Per character

- **referee_crumb** — tiny, fast, cracked ring announcer, slightly panicked,
  high pitch, blurts the line rather than announcing it smoothly; light
  megaphone/radio character is fine, must stay intelligible.
- **wheat_bread** — small but aggressive, nasal, shrill, oversized ego in a
  tiny body; trash talk reads as absurd cartoon bravado, not a real threat;
  voice rises further on the escalation line; censored word handled via
  beep, never spoken/written uncensored.
- **dark_rye** — thicker, hoarse, dry, deadpan; doesn't shout — calm =
  funnier and more threatening; pre-punch line goes almost to a cold
  whisper; final line is calm, dry, confident, not shouted.
- **crowd_crumbs** — not one clean voice; 3–5 short layered reaction takes
  at different pitches (one shrill, one mid, one hoarse), brief, bursts
  right after the punch.

### Volume / timing plan (existing 6-line structure, see VOICE_LINES)

- 0.4s referee — high, sudden, sits above the SFX bed.
- 8.5s wheat — mid-high, sharp, fast.
- 11.0s dark_rye — quieter and closer than wheat; the contrast is the joke.
- 17.2s dark_rye (censored line) — rises into the bleep, never clips.
- 19.6s crowd — short layered burst right after the punch beat.
- 26.0s dark_rye final — calm, dry, upfront in the mix, SFX bed ducked
  underneath it.

A longer 8-line version of this flow (adding a "Say that again." /
"Wrong toaster." pre-punch exchange) was sketched by the user as the target
for the *next* live ElevenLabs pass — not yet built into VOICE_LINES, since
no new live generation has been run this round. This file documents that
target so it's not lost before the next `--live` pass.

### Mix rules carried into future mixes

- Voice always sits in front of SFX, never buried.
- SFX (bell/thump/ding) ducks under dialogue automatically.
- No clipping; phone-speaker intelligible; not podcast-clean — should read
  as cartoon fight, not interview audio.
- Mono is acceptable; stereo crowd/SFX spread is a nice-to-have, not
  required.

## Post-processing test pass (local ffmpeg only, no new ElevenLabs call)

Since the desired "dirty cartoon" texture isn't available from a clean
premade ElevenLabs voice alone, a local post-processing pass
(`scripts/postprocess_voice_022.py`) takes the existing generated mp3s in
`assets/voice/022/` and runs them through pitch-shift + EQ + bitcrush +
soft-clip ffmpeg filters per character, writing test versions to
`assets/voice/022_processed/` plus a single before/after preview montage at
`outputs/audio/022_voice_style_test_v1.mp3`. No ElevenLabs call, no Kling,
no video mix, no upload — purely local audio processing for the user to
judge before deciding whether to redo the ElevenLabs pass with the new
direction/settings above.

## Mix / loudness direction

- Punch, boxing bell, and toaster-ding SFX: louder and more present than
  prior videos (021/022 cinematic version), audible on phone speakers.
- Must not clip or distort — peak levels stay under a safe ceiling (no
  harsh/painful spikes), same ffmpeg-safe-limiting approach as the existing
  sound-edit script.
- Crowd murmur / hum stays as a low bed under dialogue, never masking the
  voice lines or captions.
