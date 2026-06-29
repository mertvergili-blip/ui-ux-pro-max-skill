#!/usr/bin/env python3
"""Perform the one-time YouTube OAuth 2.0 flow and save a reusable token.

Usage:
    python3 scripts/youtube_auth.py

What it does:
  1. Reads credentials/youtube_client_secret.json (Desktop App credentials).
  2. Opens a browser window for Google login / consent.
  3. Saves the resulting token to credentials/youtube_token.json.
  4. Prints the authenticated channel title so you can confirm the right
     account is connected.

What it does NOT do:
  - Upload anything.
  - Set anything public.
  - Modify any video or channel settings.

Run this script exactly once from the project root to authorise the pipeline.
After that, upload_private_youtube.py reads the saved token automatically.
"""

import sys
from pathlib import Path

# ── Ensure scripts/ is importable regardless of cwd ────────────────────────
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

CLIENT_SECRET_FILE = ROOT / "credentials" / "youtube_client_secret.json"
TOKEN_FILE = ROOT / "credentials" / "youtube_token.json"


def get_credentials() -> Credentials:
    creds: Credentials | None = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        if not CLIENT_SECRET_FILE.exists():
            raise FileNotFoundError(
                f"Client secret file not found: {CLIENT_SECRET_FILE}\n"
                "Download it from Google Cloud Console → APIs & Services → "
                "Credentials and save as credentials/youtube_client_secret.json"
            )
        flow = InstalledAppFlow.from_client_secrets_file(
            str(CLIENT_SECRET_FILE), SCOPES
        )
        creds = flow.run_local_server(port=0)

    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(creds.to_json())
    print(f"Token saved to {TOKEN_FILE}")
    return creds


def verify_channel(creds: Credentials) -> None:
    youtube = build("youtube", "v3", credentials=creds)
    response = youtube.channels().list(part="snippet", mine=True).execute()
    items = response.get("items", [])
    if not items:
        print("WARNING: no channels found for this account.")
        return
    channel = items[0]["snippet"]
    print(f"\nConnected channel: {channel['title']}")
    print(f"Channel ID: {items[0]['id']}")
    print("\nAuth complete. You can now use upload_private_youtube.py --live")


def main() -> None:
    print("Starting YouTube OAuth flow...")
    print("Scope: youtube.upload (private upload only)")
    print(f"Client secret: {CLIENT_SECRET_FILE}")
    print()
    creds = get_credentials()
    verify_channel(creds)


if __name__ == "__main__":
    main()
