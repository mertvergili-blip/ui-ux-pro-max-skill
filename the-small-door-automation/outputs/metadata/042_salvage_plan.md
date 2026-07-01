# Video 042 — Salvage / Edit Plan
# Status: NO NEW GENERATION — analysis of existing raw clips only
# Created: 2026-07-01
# Rule in effect: Kling / ElevenLabs / voice / mix / caption burn / upload — NONE performed.

Source clips analyzed (unchanged, not modified, not deleted):
```
assets/raw_clips/042/scene_01.mp4  (5.10s)
assets/raw_clips/042/scene_02.mp4  (5.10s)
assets/raw_clips/042/scene_03.mp4  (10.43s)
assets/raw_clips/042/scene_04.mp4  (10.43s)
assets/raw_clips/042/scene_05.mp4  (10.43s)
```

Method: frames extracted at 1s intervals per scene (ffmpeg, read-only), reviewed
visually. No frames written back into the source clips.

---

## A) Usable scenes

| Scene | Verdict | Reasoning |
|-------|---------|-----------|
| 1 | **SAFE — use in full/trimmed** | Generic phone, red curtain, no characters, no text/logo/UI at any sampled point. |
| 2 | **SAFE — use in full** | Battery (pale-yellow head, red cape, spotlight) fills frame, mouth visibly open/closed on aria lines, generic dark audience in background. No human-like figure, no text/logo/UI at any point across the clip. Body reads as a black ribbed cylinder rather than the specced pale body — a color deviation, but it is still clearly an object-character, not a human. Acceptable. |
| 3 | **SAFE — use in full, solo Battery reframe** | Charger never appears anywhere in this clip's 10.43s (verified at 1s intervals, start to end) — but Battery alone (same pale head + red cape/robe) is consistent, expressive, no human-like figure, no text/logo/UI at any point. This is the best material for the "one-person unnecessary dramatic opera" reframe. |
| 4 | **CUT FROM FINAL — do not use** | A human-presenting bald bearded figure in a red robe is on screen in EVERY sampled frame across the full 10.43s, standing next to a yellow bottle-shaped object with no cape. There is no clean window (checked at 1s resolution) and no reliable horizontal crop that isolates the yellow object without also showing the human-like figure in a meaningful number of frames — the two characters share centered/overlapping frame space throughout. Unsalvageable without a retry, which is out of scope now. |
| 5 | **CUT FROM FINAL, except one optional crop (see B/D)** | A small human-like running figure (pink/red skin tone, white shirt, human proportions) is present in the bottom ~25-30% of frame in every sampled frame across the full clip. The upper ~65-70% of frame (cape + spotlight + hands, face barely visible) never contains this figure at any timestamp — a top-crop could technically be used very briefly as a static "final pose" cutaway (see D), but the pose does not read as a collapse (looks more like a static held pose, arms up, entire clip) — value is marginal. Do not use the full frame at any point. |

---

## B) Safest edit flow (18-22s target, no forcing 25-27s)

Proposed cut, using only Scene 1 + 2 + 3 (all fully clean), optionally capped by a
cropped Scene 5 coda:

| Order | Source | In-point | Out-point | Used length | Notes |
|-------|--------|----------|-----------|-------------|-------|
| 1 | scene_01.mp4 | 0.0s | 3.0s | 3.0s | Full curtain-close-up beat; use the earlier part of the clip (curtain still visibly red/dramatic) rather than the very end. |
| 2 | scene_02.mp4 | 0.0s | 5.1s | 5.1s | Use in full — this is the strongest, cleanest shot in the batch. |
| 3 | scene_03.mp4 | 0.0s | 8.0s | 8.0s | Use the first 8s of the 10.43s clip (drop the last ~2.4s only for pacing, not because of any defect — the whole clip is clean). |
| 4 (optional) | scene_05.mp4 | 0.2s | 2.2s | 2.0s | **Top-crop only**: crop out the bottom ~30-35% of frame height (removes the running human-like figure entirely, at any timestamp in this clip) to leave just the cape + tightening spotlight as a closing freeze/near-static cutaway before cut-to-black + chime. Purely a mood/coda beat, not a "collapse." |

**Total without optional coda:** 3.0 + 5.1 + 8.0 = **16.1s**
**Total with optional Scene 5 top-crop coda:** 16.1 + 2.0 = **18.1s**

Scene 4 is fully excluded — no portion of it is safe to use.

This lands at the **low end (16-18s)** of a Shorts-viable runtime, well under the
25-27s originally planned. Recommend using the Scene 5 top-crop coda to reach
~18s and give the ending a beat before the chime, rather than stretching
Scene 1-3 artificially.

### How to hide the Scene 4/5 problem characters if more footage is needed later
- Scene 4: no crop/blur/short-use is reliable — the human-like figure occupies
  shared frame space with the other character throughout. Only a full retry fixes this.
- Scene 5: a **vertical top-crop (top ~65% of frame height)** removes the running
  figure at every timestamp in the clip and is safe to use for any duration
  within the clip, not just briefly — but the resulting shot is a near-static
  pose, not a collapse, so its narrative value is limited to a short (1-3s) coda.

---

## C) Simplified story reframe (matches available footage)

New direction: **"The phone's 1% battery doesn't charge — it performs an
unnecessary, fully-committed one-person opera death scene."**

Revised beat structure (matches only Scene 1-3, optionally +5-coda):

1. **Scene 1 (0-3s):** Phone at 1%, curtain begins to reveal a stage.
2. **Scene 2 (3-8.1s):** Battery revealed center stage, full aria, cape billowing,
   sings its first grief lines.
3. **Scene 3 (8.1-16.1s):** Battery continues its solo monologue, building to the
   punchline and final whispered line — no second on-screen character needed.
4. **Optional Scene 5 coda (16.1-18.1s):** Cape + spotlight held/tightening,
   cut to black, chime.

Charger's role is demoted from an on-screen character to an **off-screen voice
only** (see D) — this actually matches the footage we have and turns the
Scene 3/4/5 generation gap into a legitimate creative choice (a diva who
doesn't even let her one supporter get on stage) rather than a visible defect.

---

## D) Revised voice/caption suggestion (NOT generated — proposal only)

No ElevenLabs calls made. This is a text proposal for future approval.

| Beat | Speaker | Line (audio) | Caption |
|------|---------|---------------|---------|
| Scene 2 | Battery (on-screen) | "I gave everything. Every percent. Every bar." | "I gave everything.\nEvery percent. Every bar." |
| Scene 2→3 | Battery (on-screen) | "Tell the WiFi... I tried." | "Tell the WiFi...\nI tried." |
| Scene 3 | Charger (**off-screen voice only**, never shown) | "You're literally next to the charger." | "You're literally\nnext to the charger." |
| Scene 3 | Battery (on-screen) | "I'm in the middle of dying." | "I'm in the middle\nof dying." |
| Scene 3 | Charger (off-screen) | "You've been at one percent for six hours." | "You've been at 1%\nfor six hours." |
| Scene 3 | Battery (on-screen) | "Then let me die dramatically." | "Then let me die\ndramatically." |
| Scene 5 coda / black | (no character — text only) | (single chime, no line) | "Should I charge it\nor let it perform?" |

Notes:
- Charger having **zero on-screen appearance** is now a deliberate device, not a
  cover-up: "the diva ignores her only supporter so completely he never even
  gets in frame" is consistent with Battery's established selfishness.
- Lines shortened from the original 042_script.json per the user's direction;
  the "Spotify"/"Spotily" brand-safety line is dropped in this shortened cut
  since there is no clean footage window left to host it without forcing
  runtime back toward 25-27s. Can be re-added if the video is ever extended
  with a future regenerated scene.
- Mouth movement note: Scene 2 and Scene 3 both show Battery's mouth opening
  and closing at multiple sampled points — real lip-sync still not supported
  by the pipeline, so timing the (future, not-yet-generated) voice lines to
  the existing mouth-open moments in the footage (rather than the reverse)
  will read best.

---

## E) Text / logo / UI / brand QC (existing clips)

Checked at 1-second intervals across all 5 clips (46 total frames reviewed).

**Result: no text, no caption, no logo, no UI, no brand marks found in any
frame of any of the 5 clips.** This axis is clean across the board, including
in Scene 4 and Scene 5 (whose problem is character design/continuity, not
text/branding).

---

## F) Human-like figure QC

| Scene | Human-like figure present? | Timestamps to avoid |
|-------|------------------------------|----------------------|
| 1 | No | n/a |
| 2 | No | n/a |
| 3 | No | n/a |
| 4 | **Yes — bald, bearded, human-proportioned figure in a red robe** | Present for the **entire clip, 0.0s-10.43s**, no safe window. Do not use any part of this clip in the final cut. |
| 5 | **Yes — small running figure, human proportions, skin-toned, white shirt** | Present in the **bottom ~30% of frame for the entire clip, 0.0s-10.43s**. A **top-crop (top ~65% of frame height only)** removes it at every timestamp, so a cropped version can be used; the full, uncropped frame must never be used at any timestamp. |

---

## G) Final decision

**This video IS salvageable with the existing clips**, but only by narrowing
the story to a Battery solo performance (Scene 1 + 2 + 3, optionally + a
top-cropped Scene 5 coda) and cutting Scene 4 entirely and Scene 5's
uncropped footage entirely.

- **Recommended final duration: ~16-18 seconds** (16.1s without the optional
  coda, 18.1s with it). This is short of the original 25-27s target — if the
  channel needs the fuller runtime, Scene 3/4/5 will need a future regeneration
  pass (separate approval required, not performed now).
- video_queue.csv status updated to reflect "usable-but-needs-editorial-cut"
  rather than a plain generation success (see item 4 below).

---

## Next steps (not performed in this pass)
1. Human approves this salvage plan and the shortened story direction.
2. subtitle-and-edit-planner (or manual) builds the actual FFmpeg trim/crop
   list from section B.
3. Only then: voice lines (ElevenLabs, separate approval), sound design, mix,
   QC, upload — none of which are in scope for this pass.
