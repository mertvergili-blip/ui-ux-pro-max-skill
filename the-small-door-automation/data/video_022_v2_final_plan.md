# Video 022 — V2 FINAL Plan (toaster bread-boxing match, censored trash-talk)

Status: **finalized script/timing/censor plan**, tracked here so it survives
even if `outputs/metadata/*.json` (gitignored, local-only) is lost. This is
the canonical reference for the V2 rebuild of video 022 — supersedes the
original clean-TTS V1 voice test and the OLD 6-line voice set.

## Why this file exists

`022_script.json` and `022_scenes.json` under `outputs/metadata/` hold the
same plan in machine-readable form, but `the-small-door-automation/.gitignore`
excludes all `*.json` files repo-wide, so those are never committed. This
`.md` file is the durable, git-tracked source of truth for the V2 plan.

## Final 7-line voice flow

Replaces the OLD 6-line set (`assets/voice/022/`, now archived — see below).
Original wording; no lines copied verbatim from any reference material. No
slurs, no hate speech, no attack on a real person.

| # | id | Start | Scene | Speaker | Line | Note |
|---|---|---|---|---|---|---|
| 1 | `01_referee_round_one` | 0.4s | 1 | referee_crumb | "Round one!" | sharp, small, cracked announcer bark |
| 2 | `02_wheat_burnt_rye` | 8.5s | 3 | wheat_bread | "You're burnt, rye." | cocky, loud, shrill trash talk |
| 3 | `03_rye_say_that_again` | 10.3s | 3 | dark_rye | "Say that again." | cold, low, deadpan — first sign of danger |
| 4 | `04_wheat_fuck_you_up_mate` | 11.8s | 3 | wheat_bread | "I'll fuck you up, mate." | shrill, British bar-fight 'mate' energy; **spoken uncensored in audio, caption-only censor** |
| 5 | `05_rye_wrong_toaster` | 15.0s | 4 | dark_rye | "Wrong toaster." | calm, near-whisper, pre-punch — no censor needed |
| — | — | ~18s | 4 | — | [ONE PUNCH] | boxing bell + punch thump, no dialogue |
| 6 | `06_crowd_ohhh` | 18.3s | 4 | crowd_crumbs | "OHHH!" | chaotic multi-layer reaction burst |
| 7 | `07_rye_breakfast_over_bitch` | 26.0s | 5 | dark_rye | "Breakfast is over, bitch." | calm, dry, triumphant; **spoken uncensored in audio, caption-only censor** |

Source of truth for ids/text/timing: `scripts/generate_voice_022.py::VOICE_LINES`.

## Timing plan (30s total, 5-scene structure)

- Scene 1 — Hook (0–3s): referee bark at 0.4s.
- Scene 2 — Reveal (3–8s): no dialogue, boxing-ring reveal.
- Scene 3 — Fighters (8–15s): wheat trash talk (8.5s) → rye cold reply
  (10.3s) → wheat escalation, uncensored audio/censored caption (11.8s).
- Scene 4 — Turnaround punch (15–22s): rye cold pre-punch line (15.0s) →
  punch (~18s) → crowd gasp (18.3s).
- Scene 5 — Final (22–30s): rye calm victory line, uncensored audio/censored
  caption (26.0s).

## Caption flow

Censored swears are always rendered censored on screen, even though both
profanity lines are now spoken uncensored in the audio (see "Bleep/censor
rules" below) — never spelled out in full.

| Time | Caption |
|---|---|
| 0:00–0:03 | I heard yelling / from my toaster. |
| 0:03–0:06 | It wasn't making toast. |
| 0:06–0:08 | It was a fight. |
| 0:08–0:10 | "You're burnt, rye." |
| 0:10–0:12 | "Say that again." |
| 0:12–0:15 | "I'll f\*\*\* you up, mate." |
| 0:15–0:18 | "Wrong toaster." |
| 0:18–0:20 | ONE PUNCH. |
| 0:20–0:23 | White bread / went down. |
| 0:23–0:26 | The toaster dinged. |
| 0:26–0:28 | "Breakfast is over, b\*\*\*\*." |
| 0:28–0:30 | Should I eat / the winner? |

## Bleep/censor rules

Two lines require censoring: line 4 ("I'll fuck you up, mate.") and line 7
("Breakfast is over, bitch."). Both now use the same strategy: audio
uncensored, caption-only censor. Neither line uses a "beep" TTS placeholder
anymore — both earlier beep-placeholder versions were rejected by the user
as too artificial/unfunny.

- **Line 4**: sent to and spoken by ElevenLabs exactly as written —
  `"I'll fuck you up, mate."` — no beep placeholder, no censor tone applied
  in the mix. Only the **caption** is censored: `"I'll f*** you up, mate."`.
- **Line 7**: sent to and spoken by ElevenLabs exactly as written —
  `"Breakfast is over, bitch."` — no beep placeholder, no censor tone
  applied in the mix. Only the **caption** is censored:
  `"Breakfast is over, b****."`.

In both cases the caption is rendered censored, never spelled out in full,
even though the corresponding audio is uncensored.

## V2 visual direction

Same readable, expressive anthropomorphic bread-boxer visual style as the
existing `outputs/metadata/022_scenes.json` (unchanged this round — visual
prompts are not part of this voice-flow update):

- Wheat/white bread = light color, red gloves, loud/shrill/cocky.
- Dark rye bread = dark color, blue gloves, calm/deadpan/cold (wins).
- Original tiny referee + crumb crowd characters, no real people, no
  celebrities, no brands/logos, no copyrighted characters.
- WTF-readability priority: viewer must understand "bread slices are boxing
  inside a toaster" on sight, sound off.
- 25–35s, 9:16 vertical, private upload by default (channel hard rules,
  `CLAUDE.md`).

## Voice post-process chain: B-Cartoon is FINAL

`scripts/postprocess_voice_022.py::FINAL_VARIANT = "cartoon"` is the locked
post-process chain for the final mix — dirty/hoarse/funny adult-animation
energy, still fully intelligible. The "light" and "extreme" variants remain
available as fallback/optional alternatives only; neither is used in the
final mix by default.

Once the new 7 raw lines are generated live, they must be run through
`postprocess_voice_022.py --live` (B-Cartoon chain) before reaching the
final mix — raw ElevenLabs output is never used unprocessed in the final
video.

## Old test material — will NOT be published

The following are tone/dirtiness-level tests only, on the OLD 6-line set,
and must never be treated as final or uploaded:

- `outputs/final_videos/022_voice_test.mp4` — V1 clean-ElevenLabs voice
  test mix.
- `outputs/audio/022_voice_style_test_v1.mp3` — V1 single-variant
  post-process montage.
- `outputs/audio/022_voice_style_test_A_light.mp3`,
  `..._B_cartoon.mp3`, `..._C_extreme.mp3` — A/B/C tone-test montages,
  built from the OLD 6-line voice set, kept only as reference for which
  post-process intensity ("B cartoon") to use on the NEW final lines.
- The OLD 6 raw voice files themselves, archived at
  `assets/voice/022_archive_old_6_lines/` (moved out of
  `assets/voice/022/` so that directory is clean for the new final 7
  lines).
- The superseded line-4 beep version (`04_wheat_beep_you_up.mp3` raw and
  `04_wheat_beep_you_up_processed.mp3` B-Cartoon-processed), replaced by
  `04_wheat_fuck_you_up_mate.mp3` / `04_wheat_fuck_you_up_mate_processed.mp3`.
- The superseded line-7 beep version (`07_rye_breakfast_over_beep.mp3` raw
  and `07_rye_breakfast_over_beep_processed.mp3` B-Cartoon-processed),
  replaced by `07_rye_breakfast_over_bitch.mp3` /
  `07_rye_breakfast_over_bitch_processed.mp3`.

Both superseded line-4 and line-7 sets are archived (not deleted) at
`assets/voice/022_archive_superseded_lines/`, out of both
`assets/voice/022/` and `assets/voice/022_processed_cartoon/`, so they
cannot accidentally be picked up by the final mix.

None of the above are final. The final pipeline output for video 022 is the
not-yet-built render using the 7-line flow in this document, processed
through the B-Cartoon chain, and is subject to the channel's private-upload
default and manual human approval before any public release.
