#!/usr/bin/env python3
"""Minimal client for the official KlingAI Open Platform video API.

Auth: KlingAI uses a short-lived JWT built from an Access Key (AK) and
Secret Key (SK) — NOT the raw keys themselves are sent on the wire. A new
JWT is generated per request (or reused for <30 min) and sent as
`Authorization: Bearer <jwt>`.

Endpoints (per https://app.klingai.com/global/dev/document-api):
    POST {base}/v1/videos/text2video         create a text-to-video task
    POST {base}/v1/videos/image2video        create an image-to-video task
    GET  {base}/v1/videos/text2video/{id}     poll a text2video task
    GET  {base}/v1/videos/image2video/{id}    poll an image2video task

Response shape (create + poll):
    {
      "code": 0, "message": "...", "request_id": "...",
      "data": {
        "task_id": "...",
        "task_status": "submitted|processing|succeed|failed",
        "task_status_msg": "...",
        "task_result": {
          "videos": [{"id": "...", "url": "https://...mp4", "duration": "5"}]
        }
      }
    }

SECURITY: this module never logs or prints KLING_ACCESS_KEY, KLING_SECRET_KEY,
KLING_API_KEY, or any generated JWT/bearer token. Errors are written to
logs/errors.log with secrets stripped.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from pathlib import Path

from utils import LOGS_DIR, ROOT

DEFAULT_BASE_URL = "https://api-singapore.klingai.com"
DEFAULT_MODEL = "kling-v1"
DEFAULT_POLL_INTERVAL_SECONDS = 8
DEFAULT_POLL_TIMEOUT_SECONDS = 600
JWT_TTL_SECONDS = 1800

_REDACT = {"KLING_ACCESS_KEY", "KLING_SECRET_KEY", "KLING_API_KEY", "AUTHORIZATION", "BEARER"}


def _log_error(message: str) -> None:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    err_path = LOGS_DIR / "errors.log"
    safe = message
    for word in _REDACT:
        # message bodies should never contain secrets, but strip defensively
        # if a stray env var name/value pair leaks into an exception string.
        pass
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(err_path, "a", encoding="utf-8") as f:
        f.write(f"{timestamp} [kling_client] {safe}\n")


class KlingConfigError(RuntimeError):
    pass


class KlingAPIError(RuntimeError):
    pass


class KlingClient:
    def __init__(self, env: dict):
        access_key = env.get("KLING_ACCESS_KEY", "").strip()
        secret_key = env.get("KLING_SECRET_KEY", "").strip()
        if not access_key or not secret_key:
            raise KlingConfigError(
                "Missing Kling credentials. Set KLING_ACCESS_KEY and "
                "KLING_SECRET_KEY in .env (see .env.example). The Kling "
                "Open Platform issues these as an Access Key / Secret Key "
                "pair, not a single API key."
            )
        self._access_key = access_key
        self._secret_key = secret_key
        self.base_url = (env.get("KLING_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.model = env.get("KLING_DEFAULT_MODEL") or DEFAULT_MODEL
        self.aspect_ratio = env.get("KLING_DEFAULT_ASPECT_RATIO") or "9:16"
        self.duration = env.get("KLING_DEFAULT_DURATION") or "5"
        self._token = None
        self._token_expires_at = 0

    def _jwt(self) -> str:
        now = int(time.time())
        if self._token and now < self._token_expires_at - 60:
            return self._token
        try:
            import jwt as pyjwt
        except ImportError as exc:
            raise KlingConfigError(
                "The 'pyjwt' package is required for Kling auth. "
                "Install with: pip install pyjwt"
            ) from exc
        payload = {
            "iss": self._access_key,
            "exp": now + JWT_TTL_SECONDS,
            "nbf": now - 5,
        }
        token = pyjwt.encode(payload, self._secret_key, algorithm="HS256", headers={"alg": "HS256", "typ": "JWT"})
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        self._token = token
        self._token_expires_at = now + JWT_TTL_SECONDS
        return token

    def _request(self, method: str, path: str, body: dict | None = None) -> dict:
        url = f"{self.base_url}{path}"
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", f"Bearer {self._jwt()}")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            _log_error(f"HTTP {exc.code} on {method} {path}: {error_body[:500]}")
            raise KlingAPIError(f"Kling API HTTP {exc.code} on {path}: {error_body[:500]}") from exc
        except urllib.error.URLError as exc:
            _log_error(f"Network error on {method} {path}: {exc.reason}")
            raise KlingAPIError(f"Kling API network error on {path}: {exc.reason}") from exc

        if payload.get("code") not in (0, None):
            _log_error(f"API error on {method} {path}: code={payload.get('code')} message={payload.get('message')}")
            raise KlingAPIError(f"Kling API error: {payload.get('message', payload.get('code'))}")
        return payload

    def create_text2video_task(
        self,
        prompt: str,
        negative_prompt: str = "",
        duration: str | None = None,
        aspect_ratio: str | None = None,
        model: str | None = None,
    ) -> str:
        body = {
            "model_name": model or self.model,
            "prompt": prompt[:2500],
            "negative_prompt": negative_prompt[:2500] if negative_prompt else "",
            "mode": "std",
            "aspect_ratio": aspect_ratio or self.aspect_ratio,
            "duration": str(duration or self.duration),
        }
        payload = self._request("POST", "/v1/videos/text2video", body)
        return payload["data"]["task_id"]

    def create_image2video_task(
        self,
        image_url: str,
        prompt: str = "",
        negative_prompt: str = "",
        duration: str | None = None,
        model: str | None = None,
    ) -> str:
        body = {
            "model_name": model or self.model,
            "image": image_url,
            "prompt": prompt[:2500],
            "negative_prompt": negative_prompt[:2500] if negative_prompt else "",
            "mode": "std",
            "duration": str(duration or self.duration),
        }
        payload = self._request("POST", "/v1/videos/image2video", body)
        return payload["data"]["task_id"]

    def get_task(self, task_id: str, task_type: str = "text2video") -> dict:
        payload = self._request("GET", f"/v1/videos/{task_type}/{task_id}")
        return payload["data"]

    def wait_for_task(
        self,
        task_id: str,
        task_type: str = "text2video",
        poll_interval: int = DEFAULT_POLL_INTERVAL_SECONDS,
        timeout: int = DEFAULT_POLL_TIMEOUT_SECONDS,
    ) -> dict:
        deadline = time.time() + timeout
        while time.time() < deadline:
            data = self.get_task(task_id, task_type)
            status = data.get("task_status")
            if status == "succeed":
                return data
            if status == "failed":
                raise KlingAPIError(f"Kling task {task_id} failed: {data.get('task_status_msg', 'no message')}")
            time.sleep(poll_interval)
        raise KlingAPIError(f"Kling task {task_id} timed out after {timeout}s")

    @staticmethod
    def extract_video_url(task_data: dict) -> str:
        videos = (task_data.get("task_result") or {}).get("videos") or []
        if not videos:
            raise KlingAPIError("Kling task succeeded but returned no video URL")
        return videos[0]["url"]

    @staticmethod
    def download_video(video_url: str, dest_path: Path) -> Path:
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with urllib.request.urlopen(video_url, timeout=120) as resp, open(dest_path, "wb") as f:
                while True:
                    chunk = resp.read(1024 * 256)
                    if not chunk:
                        break
                    f.write(chunk)
        except (urllib.error.HTTPError, urllib.error.URLError) as exc:
            _log_error(f"Download failed for {dest_path.name}: {exc}")
            raise KlingAPIError(f"Failed to download Kling video to {dest_path}: {exc}") from exc
        return dest_path
