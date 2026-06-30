# Video 022 — V2 Kling Visual Generation Plan

Status: **PENDING** — V2 voice + audio is finalized (see
`data/video_022_v2_final_plan.md`). This document governs the V2 visual
generation pass. The V1 visual render (currently at
`outputs/final_videos/022_final.mp4`) is superseded and must NOT be used as
the base for the final mix.

No Kling generation is performed here. This is a planning/briefing document
only — actual generation requires explicit human `--live` approval and valid
credentials in `.env`.

---

## Core visual brief

**Concept:** Tiny bread-slice boxers fighting inside a toaster. Must read
as "bread slices boxing inside a toaster" instantly, even at 9:16 on a
phone screen with sound off.

**WTF-readability rule:** Every scene must prioritize visual clarity over
style. A viewer who has never seen the channel must understand the setup
within 1–2 seconds of each scene appearing. If clarity and style conflict,
clarity wins.

**Format:** 9:16 vertical, 25–30s total, 5 scenes.

---

## Character specs (must hold across all scenes)

**wheat_bread (light-colored fighter):**
- Clearly a light-colored bread slice (white or wheat-yellow).
- Red boxing gloves — always visible, consistent.
- Expressive face: eyes, eyebrows, mouth drawn on or embedded in the bread.
- Small arms and legs, proportioned for "tiny fighter" readability.
- Loud, shrill, cocky posture — leaning forward, pointing, animated.
- Never dark, never mistaken for rye.

**dark_rye (dark-colored fighter):**
- Clearly a dark rye/brown bread slice — darker than wheat by obvious contrast.
- Blue boxing gloves — always visible, consistent.
- Expressive face: same style as wheat, same scale.
- Small arms and legs.
- Calm, low-energy, deadpan posture — standing straight, arms down or
  loosely raised; never animated/excited except at the punch moment.
- Never light, never mistaken for wheat.

**referee_crumb:**
- Tiny crumb-like character in a white shirt + bow tie.
- Clearly smaller than both fighters.
- Only in scenes 1 and 3 (ring announcer bark + fighters facing off).

**crowd_crumbs:**
- Rows of tiny crumb/bread-like spectators around the ring.
- No individual detail needed — chaotic background crowd is fine.
- Present in all scenes as background, most prominent in scene 4 (reaction).

---

## Scene-by-scene Kling prompt direction

### Scene 1 — Hook (0–3s)
**What must happen:**
- An exterior shot of a toaster on a kitchen counter.
- The toaster shakes slightly. The lever trembles.
- Warm orange light leaks from the slots — implies something inside.
- Caption area: top 20% and bottom 15% must stay clear.

**Camera:** Static or very slow push-in. No fast cuts.
**Mood:** Mysterious, slightly absurd, tiny hints of energy.
**Negative:** No character visible yet. No boxing ring visible. No hands
reaching in. Not dark. Not horror-coded.

---

### Scene 2 — Reveal (3–8s)
**What must happen:**
- Camera moves INTO the toaster slot (or cuts inside).
- Inside: a clear, readable tiny boxing ring made of toast crumbs and
  glowing wires used as ropes. Ring posts visible at corners.
- Crumb crowd visible around the ring, cheering.
- The ring must be unmistakably a boxing ring, not an abstract space.
- Caption area: top 20% and bottom 15% must stay clear.

**Camera:** Move from exterior into interior, or hard cut inside.
**Mood:** Surreal, WTF, but immediately readable.
**Negative:** Abstract shapes. Unclear what the ring is. Too dark.
No characters yet — fighters appear in Scene 3.

---

### Scene 3 — Fighters (8–15s)
**What must happen:**
- Both bread fighters are in the ring, clearly readable, facing each other.
- wheat_bread (light, red gloves) on one side — animated, leaning in,
  talking trash (cocky posture).
- dark_rye (dark, blue gloves) on the other side — calm, still, deadpan.
- referee_crumb between them or at ringside.
- At the trash-talk moment, the speaking character should be centered or
  slightly larger in frame — camera favors whoever is speaking.
- wheat_bread's mouth should be visibly open / animated on its lines.
- dark_rye stays still and calm until "Say that again." — then locks eyes.
- Caption area clear.

**Camera:** Two-shot of both fighters, slight push-in on wheat_bread
during its lines, slight reframe to dark_rye for its reply.
**Mood:** Playful, funny, rising tension.
**Negative:** Real humans. Real boxing. Violent-looking. Dark/muddy.
Characters look identical (they must be clearly distinguishable by color).

---

### Scene 4 — Turnaround punch (15–22s)
**What must happen:**
- dark_rye (calm) speaks "Wrong toaster." — close-up or medium shot,
  barely moves.
- ONE clear punch: dark_rye throws a single punch with the blue glove —
  motion must read clearly: arm extends toward wheat_bread.
- wheat_bread reacts dramatically and falls backward onto crumbs.
  Fall must be readable: wheat falls, crumbs scatter, crowd reacts.
- crowd_crumbs: chaotic, arms up, reacting (can be blurred/fast).
- Caption area clear on the punch frame itself.

**Camera:** Wide to show both fighters → push-in to dark_rye for the
"Wrong toaster." beat → full wide or slight pull-out for the punch →
slow-motion or clear-frame for wheat_bread falling.
**Mood:** Sudden, funny, satisfying. The punch is soft/playful — not
violent or bloody.
**Negative:** Gore. Blood. Scary impact. Unclear what hit what.
wheat_bread must visibly fall — not just stumble.

---

### Scene 5 — Final (22–30s)
**What must happen:**
- The toaster dings (lever pops up with a spark or glow).
- dark_rye pops out of the toaster wearing a tiny championship belt
  AND still wearing blue boxing gloves. Crumbs cheer inside/around it.
- dark_rye faces camera, deadpan/calm — delivers final line.
- The kitchen looks normal again (toaster on counter, morning light).
- Caption area clear.

**Camera:** Interior wide shot of ring → cut to exterior: toaster pops,
dark_rye rises out of the slot triumphantly.
**Mood:** Absurd, funny, satisfying resolution.
**Negative:** Missing the belt (it must be visible). dark_rye popping out
must be readable — not ambiguous. Too dark.

---

## Caption area rule (all scenes)

Captions will be burned in post. Each Kling frame must keep:
- Top 20% of frame visually clear (or low-detail background only).
- Bottom 15% of frame clear.
- Main action centered vertically between 20%–85%.

---

## What NOT to generate

- No real humans. No real faces. No celebrities. No recognizable characters
  from any IP. No brand logos or readable text on the toaster.
- No blood, gore, or realistic violence.
- No horror or dark aesthetic.
- No cheap kids-cartoon style or plastic toy look.
- No messy/abstract AI output where the characters are unrecognizable.
- No extra limbs or distorted faces.

---

## Output spec

- Resolution: 1080×1920 (9:16 vertical).
- Duration per scene: see timing plan in `data/video_022_v2_final_plan.md`.
- Format: MP4 (H.264 or better).
- Saved to: `outputs/kling/022_v2_scene_<N>.mp4` (one file per scene).
- Tracked in: `outputs/metadata/022_kling_results.json` (local, gitignored).

---

## Next step after Kling generation

Once all 5 scene clips are approved:
1. Run `assemble_short.py` to concatenate → `outputs/final_videos/022_v2_assembled.mp4`.
2. Run `mix_voice_and_sfx_022.py --live` to overlay the V2 B-Cartoon voice +
   SFX bed → `outputs/final_videos/022_v2_voice_mix.mp4`.
3. Burn captions (censored form) via `subtitle-and-edit-planner` output.
4. Run `safety-copyright-qc` → human approval → private upload only.
