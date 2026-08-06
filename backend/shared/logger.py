"""Structured logging helpers for CloudWatch."""

import json
import logging
import os
from typing import Any


logger = logging.getLogger("event_ticketing")
logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())


def log(level: str, message: str, **context: Any) -> None:
    """Emit one JSON log line that CloudWatch Logs Insights can query."""
    payload = {"message": message, **context}
    getattr(logger, level.lower(), logger.info)(json.dumps(payload, default=str))

