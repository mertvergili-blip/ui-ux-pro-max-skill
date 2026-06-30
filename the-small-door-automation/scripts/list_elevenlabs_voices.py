#!/usr/bin/env python3
"""List the voices available in the configured ElevenLabs account, so a
voice_id can be picked for each video 022 character without digging
through the ElevenLabs dashboard by hand.

Read-only: calls GET /v1/voices and prints name / voice_id / category /
labels for each voice. Never generates audio, never uploads anywhere.

SECURITY: ELEVENLABS_API_KEY is read only from .env (or the real process
environment) and is never printed, logged, or written anywhere. If the key
is missing, the script just prints "ELEVENLABS_API_KEY missing" and exits.

Usage:
    python3 scripts/list_elevenlabs_voices.py
"""
import json
import sys
import urllib.error
import urllib.request

from utils import load_env

ELEVENLABS_VOICES_URL = "https://api.elevenlabs.io/v1/voices"


def fetch_voices(api_key: str) -> list[dict]:
    req = urllib.request.Request(
        ELEVENLABS_VOICES_URL,
        headers={"xi-api-key": api_key, "Accept": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("voices", [])


def main():
    env = load_env()
    api_key = env.get("ELEVENLABS_API_KEY")
    if not api_key:
        print("ELEVENLABS_API_KEY missing")
        sys.exit(1)

    try:
        voices = fetch_voices(api_key)
    except urllib.error.HTTPError as exc:
        # Never include headers/body here - they could echo the request,
        # but keep it minimal and key-free regardless.
        print(f"ElevenLabs request failed: HTTP {exc.code}")
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"ElevenLabs request failed: {exc.reason}")
        sys.exit(1)

    if not voices:
        print("No voices found on this ElevenLabs account.")
        return

    print(f"{'name':<28} {'voice_id':<24} {'category':<14} labels")
    print("-" * 90)
    for v in voices:
        name = v.get("name", "")
        voice_id = v.get("voice_id", "")
        category = v.get("category", "")
        labels = v.get("labels") or {}
        labels_str = ", ".join(f"{k}={val}" for k, val in labels.items())
        print(f"{name:<28} {voice_id:<24} {category:<14} {labels_str}")


if __name__ == "__main__":
    main()
