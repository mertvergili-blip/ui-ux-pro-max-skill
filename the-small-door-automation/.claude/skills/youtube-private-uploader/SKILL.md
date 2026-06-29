---
name: youtube-private-uploader
description: Use this skill to upload a QC-approved final video to YouTube as private (never public) with full metadata. Invoke only after safety-copyright-qc returns approved_private_upload. Never performs a real upload without explicit human confirmation and real credentials.
---

# YouTube Private Uploader

Uploads one finished video to YouTube with `visibility=private`.

## Hard rules

- Never upload public. `UPLOAD_VISIBILITY` must be `private` (see `.env.example`).
- Only proceed if `data/video_queue.csv` shows `qc_status=approved_private_upload`.
- Attach title, description, and hashtags from
  `outputs/metadata/<video_id>_metadata.json`.
- Generate (but do not auto-apply) the AI disclosure note — the human applies
  it and makes the final public/private decision in YouTube Studio.
- After a successful upload, update `data/video_queue.csv`:
  `youtube_upload_status`, `youtube_url`, `publish_status=private_pending`.
- Never log OAuth tokens, client secrets, or API keys.
- `scripts/upload_private_youtube.py` must default to `--dry-run` and require
  an explicit `--live` flag plus valid `.env` credentials to perform a real
  upload.
