#!/usr/bin/env python3
"""Minimal client for Google's Gemini 2.5 Flash Image model ("Nano Banana").

Used as the preferred image generator for character reference sheets (see
generate_character_reference.py) — Nano Banana is specifically strong at
consistent, toy-like character sheets and multi-view identity locking,
which is the exact problem that caused 042's character drift (see
data/ai_video_quality_research_2026.md).

Auth: a single API key (GEMINI_API_KEY or NANOBANANA_API_KEY in .env),
free to obtain at https://aistudio.google.com/apikey. Sent as a query
param on the REST endpoint, matching Google's documented REST usage (no
SDK dependency, consistent with this project's plain-urllib style).

Endpoint (per https://ai.google.dev/gemini-api/docs/image-generation):
    POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}

Response shape:
    {
      "candidates": [{
        "content": {"parts": [
          {"text": "..."},
          {"inline_data": {"mime_type": "image/png", "data": "<base64>"}}
        ]}
      }]
    }

SECURITY: this module never logs or prints GEMINI_API_KEY/NANOBANANA_API_KEY.
Errors are written to logs/errors.log with the key stripped from the URL
before logging.
"""
from __future__ import annotations

import base64
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

from utils import LOGS_DIR

DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com"
DEFAULT_MODEL = "gemini-2.5-flash-image"


class NanoBananaConfigError(RuntimeError):
    pass


class NanoBananaAPIError(RuntimeError):
    pass


def _log_error(message: str) -> None:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(LOGS_DIR / "errors.log", "a", encoding="utf-8") as f:
        f.write(f"{timestamp} [nanobanana_client] {message}\n")


class NanoBananaClient:
    def __init__(self, env: dict):
        api_key = (env.get("GEMINI_API_KEY") or env.get("NANOBANANA_API_KEY") or "").strip()
        if not api_key:
            raise NanoBananaConfigError(
                "Missing Nano Banana credentials. Set GEMINI_API_KEY (or "
                "NANOBANANA_API_KEY) in .env — get a free key at "
                "https://aistudio.google.com/apikey"
            )
        self._api_key = api_key
        self.base_url = (env.get("GEMINI_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.model = env.get("NANOBANANA_MODEL") or DEFAULT_MODEL

    def generate_image(self, prompt: str, negative_prompt: str = "") -> bytes:
        """Returns raw image bytes for the first generated image."""
        full_prompt = prompt if not negative_prompt else f"{prompt}\n\nAvoid: {negative_prompt}"
        body = {"contents": [{"parts": [{"text": full_prompt[:4000]}]}]}
        url = f"{self.base_url}/v1beta/models/{self.model}:generateContent?key={self._api_key}"
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            _log_error(f"HTTP {exc.code} on generateContent: {error_body[:500]}")
            raise NanoBananaAPIError(f"Nano Banana API HTTP {exc.code}: {error_body[:500]}") from exc
        except urllib.error.URLError as exc:
            _log_error(f"Network error on generateContent: {exc.reason}")
            raise NanoBananaAPIError(f"Nano Banana API network error: {exc.reason}") from exc

        candidates = payload.get("candidates") or []
        if not candidates:
            raise NanoBananaAPIError(f"Nano Banana returned no candidates: {json.dumps(payload)[:300]}")

        for part in candidates[0].get("content", {}).get("parts", []):
            inline = part.get("inline_data") or part.get("inlineData")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])

        raise NanoBananaAPIError("Nano Banana response had no inline image data (only text?)")

    def check_auth(self) -> dict:
        """Lightweight, low-cost credential check — a single tiny prompt.

        Note: unlike Kling's check_auth, this DOES call generateContent
        (Gemini has no separate free auth-probe endpoint), so it consumes
        a small amount of quota/credit. Keep the prompt minimal.
        """
        try:
            self.generate_image("a single red circle on white background")
            return {"auth_ok": True, "detail": "key accepted, tiny test image generated"}
        except NanoBananaAPIError as exc:
            msg = str(exc)
            if "HTTP 401" in msg or "HTTP 403" in msg or "API_KEY_INVALID" in msg:
                return {"auth_ok": False, "detail": "key rejected (401/403/invalid)"}
            raise

    @staticmethod
    def save_image(image_bytes: bytes, dest_path: Path) -> Path:
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(image_bytes)
        return dest_path
