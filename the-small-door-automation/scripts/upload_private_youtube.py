#!/usr/bin/env python3
"""Upload a finished, QC-approved video to YouTube as PRIVATE only.

Defaults to dry-run. Requires --live AND valid YouTube OAuth credentials in
.env AND qc_status=approved_private_upload in video_queue.csv to perform a
real upload. Never sets visibility to public.

Usage:
    python3 scripts/upload_private_youtube.py --video-id 001            # dry-run
    python3 scripts/upload_private_youtube.py --video-id 001 --live      # real upload (private only)
"""
import argparse
import json

from utils import get_logger, load_env, metadata_path, read_video_queue, safe_log_context, update_video_row

logger = get_logger("upload_private_youtube", "upload.log")


def get_video_row(video_id: str) -> dict:
    for row in read_video_queue():
        if row["video_id"] == video_id:
            return row
    raise ValueError(f"video_id {video_id} not found")


def call_youtube_upload_api(video_id: str, metadata: dict, env: dict, live: bool) -> dict:
    """Placeholder for the real YouTube Data API v3 upload.

    Real implementation: use google-auth-oauthlib + googleapiclient with
    env['YOUTUBE_CLIENT_ID'] / env['YOUTUBE_CLIENT_SECRET'] /
    env['YOUTUBE_REFRESH_TOKEN'], call videos.insert with
    status={'privacyStatus': 'private'}. Never log credentials.
    """
    if not live:
        logger.info("[DRY-RUN] Would upload video_id=%s as private with metadata: %s",
                    video_id, safe_log_context(metadata))
        return {"status": "dry_run", "youtube_url": None}

    if not env.get("YOUTUBE_REFRESH_TOKEN"):
        raise RuntimeError("Live upload requested but YOUTUBE_REFRESH_TOKEN missing from .env")

    # TODO: implement real googleapiclient videos.insert call here.
    raise NotImplementedError("Real YouTube upload is not implemented yet. Add it here before using --live.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()

    row = get_video_row(args.video_id)
    if row.get("qc_status") != "approved_private_upload":
        raise SystemExit(
            f"Refusing to upload: qc_status='{row.get('qc_status')}', "
            "must be 'approved_private_upload'."
        )

    metadata = json.loads(metadata_path(args.video_id, "metadata").read_text())
    env = load_env()

    result = call_youtube_upload_api(args.video_id, metadata, env, args.live)

    update_video_row(
        args.video_id,
        youtube_upload_status="uploaded_private" if args.live else "not_uploaded",
        youtube_url=result.get("youtube_url") or "",
        publish_status="private_pending",
    )
    print(f"Upload result for video_id={args.video_id}: {result['status']}")


if __name__ == "__main__":
    main()
