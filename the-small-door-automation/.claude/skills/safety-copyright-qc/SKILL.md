---
name: safety-copyright-qc
description: Use this skill to run final quality, copyright, safety, and brand-fit checks on a video before it is uploaded as private. Invoke after assembly, before youtube-private-uploader. Must always run — no video skips QC.
---

# Safety & Copyright QC

Runs the final checklist before a video is allowed to reach
`youtube-private-uploader`.

## Checklist

- Does the first 2 seconds create curiosity?
- Is the tiny world clearly visible?
- Does the video fit The Small Door universe?
- Are subtitles short and readable?
- Does the sound design support the atmosphere?
- Is there a small twist at the end?
- Is there a comment-driving question?
- Is the video too similar to previous videos?
- Any copyrighted character/logo/brand present?
- Any real person, recognizable real face, or real-person impression
  present? (original fictional tiny characters in silhouette/shadow are
  allowed — flag only if a character reads as a real/recognizable person)
- Does it look like a kids' channel?
- Is it too bright/toy-like/cartoonish?
- Is an AI disclosure note needed?
- Is the private-upload rule respected (no public upload path triggered)?

## Result (must be exactly one of)

- `approved_private_upload`
- `needs_revision`
- `needs_manual_review`
- `rejected`

Write the result and any failed checklist items to `data/qc_log.csv` and set
`qc_status` in `data/video_queue.csv`. Use `scripts/run_qc.py` to scaffold
this. Never let a video proceed to upload without a QC result recorded.
