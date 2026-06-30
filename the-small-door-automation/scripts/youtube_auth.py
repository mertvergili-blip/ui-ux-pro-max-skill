#!/usr/bin/env python3
"""Perform the one-time YouTube OAuth 2.0 flow and save a reusable token.

This runs in two steps because this environment is headless (no local
browser to catch the OAuth redirect):

Step 1 — get the authorization URL:
    python3 scripts/youtube_auth.py --get-url

Open the printed URL in your own browser, sign in with the Google account
that owns "The Small Door" channel, approve, and copy the code Google shows
you.

Step 2 — exchange that code for a token:
    python3 scripts/youtube_auth.py --code "PASTE_CODE_HERE"

This saves credentials/youtube_token.json and prints the connected channel
name to confirm the right account is linked.

What it does NOT do:
  - Upload anything.
  - Set anything public.
  - Modify any video or channel settings.
"""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

CLIENT_SECRET_FILE = ROOT / "credentials" / "youtube_client_secret.json"
TOKEN_FILE = ROOT / "credentials" / "youtube_token.json"
# Temporary PKCE verifier, written by --get-url and consumed by --code.
# Step 1 and step 2 run as separate processes, so the verifier can't just
# live in memory. Deleted as soon as the token exchange succeeds.
VERIFIER_FILE = ROOT / "credentials" / ".pkce_verifier"

# Matches the redirect_uris registered in the Desktop App client secret JSON.
# After you approve in your browser, it will try to load http://localhost/...
# and fail to connect (expected, nothing is listening there) — but the
# authorization code will be visible in the browser's address bar as the
# `code=` query parameter. Copy it from there.
REDIRECT_URI = "http://localhost"


def make_flow() -> InstalledAppFlow:
    if not CLIENT_SECRET_FILE.exists():
        raise FileNotFoundError(
            f"Client secret file not found: {CLIENT_SECRET_FILE}\n"
            "Save it as credentials/youtube_client_secret.json first."
        )
    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_FILE), SCOPES)
    flow.redirect_uri = REDIRECT_URI
    return flow


def print_auth_url() -> None:
    flow = make_flow()
    auth_url, _ = flow.authorization_url(prompt="consent")
    VERIFIER_FILE.parent.mkdir(parents=True, exist_ok=True)
    VERIFIER_FILE.write_text(flow.code_verifier)
    print("\n" + "=" * 70)
    print("1. Open this URL in your browser:")
    print(auth_url)
    print("=" * 70)
    print("2. Sign in with the Google account for 'The Small Door' channel.")
    print("3. Click Allow.")
    print("4. Your browser will try to open http://localhost/... and show")
    print("   'this site can't be reached' — that is expected, ignore it.")
    print("5. Look at the address bar. Copy everything after 'code=' and")
    print("   before the next '&' symbol. That is your authorization code.")
    print("6. Send that code back here.")


def exchange_code(code: str) -> None:
    if not VERIFIER_FILE.exists():
        raise FileNotFoundError(
            "No pending authorization found. Run --get-url first, then "
            "use the code from that same run."
        )
    flow = make_flow()
    flow.code_verifier = VERIFIER_FILE.read_text().strip()
    flow.fetch_token(code=code)
    creds = flow.credentials
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(creds.to_json())
    VERIFIER_FILE.unlink(missing_ok=True)
    print(f"Token saved to {TOKEN_FILE}")
    verify_channel(creds)


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
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--get-url", action="store_true", help="Print the authorization URL (step 1)")
    group.add_argument("--code", help="Authorization code from Google (step 2)")
    args = parser.parse_args()

    if args.get_url:
        print_auth_url()
    elif args.code:
        exchange_code(args.code.strip())


if __name__ == "__main__":
    main()
