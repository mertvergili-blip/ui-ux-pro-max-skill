---
name: cinematic-scriptwriter
description: Use this skill to turn a video idea (object + hidden_world + hook + twist + final_question) into a full 25-35 second English Shorts script with subtitle timings and a scene breakdown. Invoke after an idea exists in video_queue.csv and before scene-prompt-engineer.
---

# Cinematic Scriptwriter

Writes the full script for one video idea, following the five-part formula
in `data/channel_bible.md` and `prompts/script_templates.md`.

## Script rules

- Very short sentences. Simple English. No long narration.
- First line must be a strong hook.
- Middle must clearly reveal the miniature world.
- Near the end, a small twist must land.
- Last line is always a comment-driving question.
- Not childish, not over-explained, not comedic filler. Poetic but clear.
- Total spoken/subtitle duration: 25–35 seconds.

## Output format (always use this exact structure)

```
Title:
Script:
Subtitle Timings:
Scene Breakdown:
Final Question:
```

- `Subtitle Timings` — one line per subtitle with start–end seconds, e.g.
  `0:00-0:02 — I opened the fridge at 3AM.`
- `Scene Breakdown` — map the script lines into exactly 5 scenes matching the
  five-part formula (Hook, Discovery, Reveal, Twist, Question), each with an
  approximate duration, ready to hand to `scene-prompt-engineer`.

Use `scripts/generate_script.py` to scaffold this output into
`outputs/metadata/<video_id>_script.json`.
