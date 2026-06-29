#!/usr/bin/env python3
"""Upload a finished, QC-approved video to YouTube as PRIVATE only.

Prerequisites:
  1. Run `python3 scripts/youtube_auth.py` once to create
     credentials/youtube_token.json.
  2. QC status for the video must be `approved_private_upload`.

Defaults to dry-run. Requires --live to perform a real upload.
Public upload is structurally blocked — visibility is hard-coded to 'private'.

Usage:
    python3 scripts/upload_private_youtube.py --video-id 001          # dry-run
    python3 scripts/upload_private_youtube.py --video-id 001 --live    # real upload
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from utils import get_logger, metadata_path, read_video_queue, update_video_row

logger = get_logger("upload_private_youtube", "upload.log")

TOKEN_FILE = ROOT / "credentials" / "youtube_token.json"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

UPLOAD_VISIBILITY = "private"


def get_credentials():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials

    if not TOKEN_FILE.exists():
        raise FileNotFoundError(
            f"Token not found: {TOKEN_FILE}\n"
            "Run `python3 scripts/youtube_auth.py` first."
        )
    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_FILE.write_text(creds.to_json())
    return creds


def get_video_row(video_id: str) -> dict:
    for row in read_video_queue():
        if row["video_id"] == video_id:
            return row
    raise ValueError(f"video_id {video_id} not found in video_queue.csv")


def upload_video(video_id: str, metadata: dict) -> str:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    video_path = ROOT / "outputs" / "final_videos" / f"{video_id}.mp4"
    if not video_path.exists():
        raise FileNotFoundError(
            f"Final video not found: {video_path}\n"
            "Run `python3 scripts/assemble_short.py --video-id {video_id} --live` first."
        )

    creds = get_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    description = metadata["description"] + "\n\n" + " ".join(metadata["hashtags"])

    body = {
        "snippet": {
            "title": metadata["title"],
            "description": description,
            "tags": [tag.lstrip("#") for tag in metadata["hashtags"]],
            "categoryId": "22",
        },
        "status": {
            "privacyStatus": UPLOAD_VISIBILITY,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(str(video_path), mimetype="video/mp4", resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    logger.info("Uploading video_id=%s as private...", video_id)
    while response is None:
        _, response = request.next_chunk()

    youtube_url = f"https://youtu.be/{response['id']}"
    logger.info("Uploaded video_id=%s → %s", video_id, youtube_url)
    return youtube_url


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video-id", required=True)
    parser.add_argument("--live", action="store_true", help="Perform real private upload (requires credentials)")
    args = parser.parse_args()

    row = get_video_row(args.video_id)
    if row.get("qc_status") != "approved_private_upload":
        raise SystemExit(
            f"Refusing to upload: qc_status='{row.get('qc_status')}', "
            "must be 'approved_private_upload'. "
            "Run `scripts/run_qc.py --video-id {args.video_id} --result approved_private_upload` first."
        )

    meta_path = metadata_path(args.video_id, "metadata")
    if not meta_path.exists():
        raise FileNotFoundError(f"Metadata not found: {meta_path}")
    metadata = json.loads(meta_path.read_text())

    if not args.live:
        logger.info(
            "[DRY-RUN] Would upload video_id=%s as private with title: %s",
            args.video_id, metadata["title"],
        )
        print(f"DRY-RUN: would upload '{metadata['title']}' as private.")
        print("Pass --live to perform the real upload.")
        return

    youtube_url = upload_video(args.video_id, metadata)

    update_video_row(
        args.video_id,
        youtube_upload_status="uploaded_private",
        youtube_url=youtube_url,
        publish_status="private_pending",
    )

    ai_note = metadata.get("ai_disclosure_note", "")
    print(f"\nUploaded as private: {youtube_url}")
    if ai_note:
        print(f"\nAI DISCLOSURE NOTE (apply in YouTube Studio before publishing):\n{ai_note}")


if __name__ == "__main__":
    main()
