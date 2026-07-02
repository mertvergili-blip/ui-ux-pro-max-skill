# Video 022 — Voice & Audio Plan

Status: **finalized replik flow / content+timing+censor plan**, but no new
voice audio has been generated yet. No ElevenLabs `--live` call has been
made for this flow. No Kling generation, no video mix, no upload. No
credits spent. The existing test mp3s in `assets/voice/022/` are still the
OLD 6-line set — they were only used for a local-ffmpeg dirtiness/tone test
(see "Post-processing test pass" below), never for this finalized flow.

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

## Voice lines (per character) — FINALIZED 7-line flow

Replaces the prior 6-line set. Original wording vs. any reference material;
no lines copied verbatim from any reference. No slurs, no hate speech, no
attack on a real person.

| # | Start | Scene | Speaker | Line | Note |
|---|---|---|---|---|---|
| 1 | 0.4s | 1 | referee_crumb | "Round one!" | sharp, small, cracked announcer bark |
| 2 | 8.5s | 3 | wheat_bread | "You're burnt, rye." | cocky, loud, shrill trash talk |
| 3 | 10.3s | 3 | dark_rye | "Say that again." | cold, low, deadpan — first sign of danger |
| 4 | 11.8s | 3 | wheat_bread | "I'll fuck you up, mate." | shrill escalation, British bar-fight 'mate' energy; **spoken uncensored in audio, caption censored only** |
| 5 | 15.0s | 4 | dark_rye | "Wrong toaster." | calm, near-whisper, pre-punch — no censor needed |
| — | ~18s | 4 | — | [ONE PUNCH] | boxing bell + punch thump, no dialogue |
| 6 | 18.3s | 4 | crowd_crumbs | "OHHH!" | chaotic multi-layer reaction burst |
| 7 | 26.0s | 5 | dark_rye | "Breakfast is over, bitch." | calm, dry, triumphant; **spoken uncensored in audio, caption censored only** |

No real human voice, no celebrity voice, no impersonation, no copyrighted
voice/character voice.

## Profanity handling

Two lines require censoring: line 4 ("I'll fuck you up, mate.") and line 7
("Breakfast is over, bitch."). Both now use the same strategy: audio
uncensored, caption-only censor.

- **Line 4**: the actual words "fuck you up, mate" ARE sent to and spoken by
  the TTS engine (replacing the earlier "beep" placeholder version, which
  the user rejected as too artificial/unfunny). No beep/censor tone is
  applied to this line in the mix. Only the **on-screen caption** is
  censored: `"I'll f*** you up, mate."` — never spelled out in full on
  screen, even though the audio is uncensored.
- **Line 7**: the actual word "bitch" IS sent to and spoken by the TTS
  engine (replacing the earlier "beep" placeholder version, which the user
  also rejected as artificial). No beep/censor tone is applied to this line
  in the mix either. Only the **on-screen caption** is censored:
  `"Breakfast is over, b****."` — never spelled out in full on screen.
  `generate_voice_022.py` no longer sends a "beep" placeholder for any line
  in the current 7-line flow.

## Decision: ElevenLabs (approved, dry-run infra only so far)

User approved ElevenLabs for actual spoken character lines (local/ffmpeg-
only SFX was explicitly rejected as insufficient — "sadece bleep + caption
yeterli değil"). Infra has been built but **no live call has been made**:

- `.env.example`: added `ELEVENLABS_API_KEY=` (empty placeholder).
- `.gitignore`: added `assets/voice/` (generated audio never committed).
- `scripts/utils.py`: `ELEVENLABS_API_KEY` added to `SENSITIVE_KEYS` so it's
  never logged.
- `scripts/generate_voice_022.py`: generates the finalized 7 lines below via
  ElevenLabs TTS (voice_ids are real/approved, see VOICE_PRESETS). Defaults
  to `--dry-run` (prints plan, no network call); `--live` requires
  `ELEVENLABS_API_KEY` in `.env`.
- `scripts/mix_voice_and_sfx_022.py`: should layer the post-processed
  (B-Cartoon, see below) voice files onto the existing synthesized SFX bed
  (same ambience as `generate_sound_edit_022.py`); lines 4 and 7 are both
  spoken uncensored in the audio (no censor-beep applied in the mix — only
  the caption is censored for either line), output to
  `outputs/final_videos/022_voice_test.mp4`. Also dry-run by default; not
  yet updated to read from the `022_processed_cartoon/` directory — pending
  the next live ElevenLabs + postprocess pass.

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
  voice rises further on the escalation line ("I'll fuck you up, mate.") —
  spoken uncensored in the audio; the swear is censored only on screen
  (caption), never via an audio beep on this line.
- **dark_rye** — thicker, hoarse, dry, deadpan; doesn't shout — calm =
  funnier and more threatening; pre-punch line goes almost to a cold
  whisper; final line ("Breakfast is over, bitch.") is calm, dry, confident,
  not shouted — spoken uncensored in the audio, the swear is censored only
  on screen (caption), never via an audio beep.
- **crowd_crumbs** — not one clean voice; 3–5 short layered reaction takes
  at different pitches (one shrill, one mid, one hoarse), brief, bursts
  right after the punch.

### Volume / timing plan (FINALIZED 7-line structure, see VOICE_LINES)

- 0.4s referee — high, sudden, sits above the SFX bed.
- 8.5s wheat ("You're burnt, rye.") — mid-high, sharp, fast, loud/shrill.
- 10.3s dark_rye ("Say that again.") — quieter and closer than wheat; the
  loud-vs-cold contrast is the joke.
- 11.8s wheat ("I'll fuck you up, mate.") — rises into the line, spoken
  uncensored in audio (caption-only censor), shrill, never clips.
- 15.0s dark_rye ("Wrong toaster.") — drops almost to a whisper, coldest
  point right before the punch.
- 18.3s crowd — short layered burst right after the punch beat.
- 26.0s dark_rye final ("Breakfast is over, bitch.") — calm, dry, upfront in
  the mix, SFX bed ducked underneath it, spoken uncensored (caption-only
  censor), never clips.

This is the flow the user sketched in the prior round (adding "Say that
again." / "Wrong toaster." to the pre-punch exchange) — it is now FINALIZED
in `generate_voice_022.py::VOICE_LINES`, content/timing/censor-only. No new
live ElevenLabs generation has been run yet for this flow; that remains the
next step pending explicit `--live` approval.

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
`assets/voice/022/` (the OLD 6-line set) and runs them through pitch-shift +
EQ + bitcrush + soft-clip ffmpeg filters per character. This was expanded
into three dirtiness variants for an A/B/C tone test:

- **A "light"** → `assets/voice/022_processed_light/` /
  `outputs/audio/022_voice_style_test_A_light.mp3` — subtle, very
  intelligible, safer Shorts/Reels fallback.
- **B "cartoon"** → `assets/voice/022_processed_cartoon/` /
  `outputs/audio/022_voice_style_test_B_cartoon.mp3` — dirty/hoarse/funny,
  still intelligible.
- **C "extreme"** → `assets/voice/022_processed_extreme/` /
  `outputs/audio/022_voice_style_test_C_extreme.mp3` — exaggerated meme
  distortion, heaviest bitcrush/pitch, `alimiter` still prevents clipping.

**Decision: B "cartoon" is now the locked final post-process chain** for
video 022 (`scripts/postprocess_voice_022.py::FINAL_VARIANT = "cartoon"`).
A stays available as a fallback if a cleaner/safer cut is ever needed; C
stays available as an optional louder/meme-ier alternative. Neither is used
in the final mix by default.

This was purely a tone/dirtiness-level test on the OLD line set — no
ElevenLabs call, no Kling, no video mix, no upload. The finalized 7-line
flow above has not yet been run through ElevenLabs or this post-process
chain; once `generate_voice_022.py --live` produces the new line audio,
`postprocess_voice_022.py --live` must be re-run so the new lines get the
same B-Cartoon treatment before they reach the final mix.

## Mix / loudness direction

- Punch, boxing bell, and toaster-ding SFX: louder and more present than
  prior videos (021/022 cinematic version), audible on phone speakers.
- Must not clip or distort — peak levels stay under a safe ceiling (no
  harsh/painful spikes), same ffmpeg-safe-limiting approach as the existing
  sound-edit script.
- Crowd murmur / hum stays as a low bed under dialogue, never masking the
  voice lines or captions.
