"""Shared helpers for The Small Door automation scripts."""
import csv
import json
import logging
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
OUTPUTS_DIR = ROOT / "outputs"
LOGS_DIR = ROOT / "logs"
VIDEO_QUEUE_CSV = DATA_DIR / "video_queue.csv"

SENSITIVE_KEYS = {
    "ANTHROPIC_API_KEY", "KLING_ACCESS_KEY", "KLING_SECRET_KEY",
    "KLING_API_KEY", "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET",
    "YOUTUBE_REFRESH_TOKEN", "GOOGLE_SERVICE_ACCOUNT_JSON",
    "ELEVENLABS_API_KEY",
}


def get_logger(name: str, log_file: str) -> logging.Logger:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.FileHandler(LOGS_DIR / log_file)
        handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
        logger.addHandler(handler)
        logger.addHandler(logging.StreamHandler())
        logger.setLevel(logging.INFO)
    return logger


def safe_log_context(context: dict) -> dict:
    """Strip anything that looks like a secret before logging."""
    return {k: v for k, v in context.items() if k.upper() not in SENSITIVE_KEYS}


def load_env(env_path: Path = None) -> dict:
    """Minimal .env loader, no external dependency."""
    env_path = env_path or (ROOT / ".env")
    env = dict(os.environ)
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    return env


def read_video_queue() -> list[dict]:
    with open(VIDEO_QUEUE_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_video_queue(rows: list[dict]) -> None:
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    with open(VIDEO_QUEUE_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def update_video_row(video_id: str, **fields) -> None:
    rows = read_video_queue()
    found = False
    for row in rows:
        if row["video_id"] == video_id:
            row.update({k: str(v) for k, v in fields.items()})
            found = True
            break
    if not found:
        raise ValueError(f"video_id {video_id} not found in video_queue.csv")
    write_video_queue(rows)


def metadata_path(video_id: str, suffix: str) -> Path:
    out = OUTPUTS_DIR / "metadata"
    out.mkdir(parents=True, exist_ok=True)
    return out / f"{video_id}_{suffix}.json"


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
