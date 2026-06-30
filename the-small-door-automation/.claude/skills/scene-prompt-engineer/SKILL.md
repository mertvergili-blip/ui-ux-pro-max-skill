---
name: scene-prompt-engineer
description: Use this skill to convert a finished script's scene breakdown into concrete AI video generation prompts (one per scene) with visual, camera, lighting, mood, detail, negative prompt, and continuity notes. Invoke after cinematic-scriptwriter and before kling-video-producer.
---

# Scene Prompt Engineer

Converts each of the 5 scenes from a script into a Kling-ready prompt.

## Per-scene output fields

- `scene_number`
- `duration`
- `visual_prompt` — base style (`prompts/visual_style.md`) + scene-specific
  subject/action/light
- `camera_motion`
- `lighting`
- `mood`
- `details`
- `negative_prompt` — always the full block from `prompts/negative_prompts.md`
- `continuity_notes` — what must stay visually consistent with the previous
  and next scene (object identity, light color, scale of the miniature world)

## Base visual style (always include)

```
cinematic macro shot, miniature hidden world, cozy magical realism, dark room,
warm tiny lights, soft shadows, shallow depth of field, realistic textures,
no logos, no text, no brand packaging, no cartoon style
```

## Original tiny characters (optional, when the scene calls for one)

A scene may feature one original fictional tiny character (conductor,
baker, tailor, clockmaker, hotel clerk, operator, shopkeeper, shadow
figure, miniature silhouette) to bring the world to life. When used:

- Phrase it explicitly as fictional, e.g. "an original tiny operator
  character ... seen as a small cinematic silhouette, no recognizable
  face, no celebrity, no real person, no brand, no copyrighted character".
- Prefer silhouette / backlit / shadow / at-a-distance framing over a
  recognizable close-up human face.
- At most one character per scene, never more prominent than the
  miniature world itself.

## Rules

- One clear subject and one clear action per scene — don't stack more than
  2-3 objects, or the video model loses coherence.
- Negative prompt is mandatory on every single scene, no exceptions.
- Use `scripts/generate_scene_prompts.py` to write
  `outputs/metadata/<video_id>_scenes.json`.
