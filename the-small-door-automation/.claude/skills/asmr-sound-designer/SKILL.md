---
name: asmr-sound-designer
description: Use this skill to create the per-scene ambience/SFX sound plan for a video. No narrator, no copyrighted music. Invoke after scene-prompt-engineer, alongside or before subtitle-and-edit-planner.
---

# ASMR Sound Designer

Builds the sound design plan for one video — atmosphere only, never dialogue.

## Rules

- No narrator voice-over.
- No copyrighted/licensed music.
- Short ASMR sounds + ambience that support, never overpower, the visuals.
- Use royalty-free or self-produced sound sources only.
- One ambience/SFX list per scene (5 scenes per video).

## Sound palette (reference)

fridge hum, soft rain, wooden drawer creak, paper rustle, tiny bell,
distant train, soft steam, ceramic clink, candle flicker, glass resonance,
clock ticking, tiny footsteps, warm room tone, soft door creak, cold air.

## Output format per scene

```
scene_number:
ambience:
sfx: [list]
transition_sound:
```

Write the full plan to `outputs/metadata/<video_id>_sound.json` (see
`prompts/sound_templates.md`).
