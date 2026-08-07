"""Consistent API Gateway proxy responses."""

import json
import os
from typing import Any


def api_response(status_code: int, body: Any) -> dict[str, Any]:
    """Build a JSON response with CORS headers for API Gateway."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": os.getenv("ALLOWED_ORIGIN", "*"),
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        },
        "body": json.dumps(body, default=str),
    }


def success(body: Any, status_code: int = 200) -> dict[str, Any]:
    return api_response(status_code, body)


def error(message: str, status_code: int, code: str | None = None) -> dict[str, Any]:
    payload: dict[str, str] = {"message": message}
    if code:
        payload["code"] = code
    return api_response(status_code, payload)


def options_response() -> dict[str, Any]:
    return api_response(204, {})

