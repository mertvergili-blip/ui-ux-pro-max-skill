# Video 022 — Viral Caption Plan (TikTok/Reels style)

Status: planning only. No render performed.

## Style

Bold white text, thick black outline/drop shadow, centered near the middle
of the frame (not small bottom-corner subtitles), TikTok/Reels viral
caption look, high contrast, readable on a phone screen at a glance.
Critical words/punch moments rendered larger or stronger. Final question
rendered large and clear.

- Max 3-5 words per line.
- Lines synced tightly to the action/voice beat they describe.
- Punch-moment captions (scene 4) hit harder/bigger than the rest.
- Censored swears are always rendered censored on screen (`f***`, `b****`),
  never spelled out in full. Two strategies coexist: line 4 ("I'll f*** you
  up, mate.") is spoken uncensored in the audio — only the caption is
  censored, no audio beep; line 7 ("Breakfast is over, b****.") is censored
  in both audio (beep) and caption, so the caption never gets ahead of or
  contradicts that beep.

## Caption flow (finalized 7-line voice flow)

| Time | Caption |
|---|---|
| 0:00–0:03 | I heard yelling / from my toaster. |
| 0:03–0:06 | It wasn't making toast. |
| 0:06–0:08 | It was a fight. |
| 0:08–0:10 | "You're burnt, rye." |
| 0:10–0:12 | "Say that again." |
| 0:12–0:15 | "I'll f*** you up, mate." |
| 0:15–0:18 | "Wrong toaster." |
| 0:18–0:20 | ONE PUNCH. |
| 0:20–0:23 | White bread / went down. |
| 0:23–0:26 | The toaster dinged. |
| 0:26–0:28 | "Breakfast is over, b****." |
| 0:28–0:30 | Should I eat / the winner? |

## Implementation note

Existing `subtitle-and-edit-planner` / `assemble_short.py` pipeline burns
bottom-aligned small subtitles by default. Centered/bold/large viral-style
captions are a new rendering requirement and will need either a new ASS
style (font size, position, outline) or a separate caption-burn step before
this can run live — to be implemented when live generation is approved,
not part of this planning-only update.
