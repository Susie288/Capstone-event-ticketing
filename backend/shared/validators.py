"""Request parsing and validation shared by Lambda handlers."""

import base64
import json
import re
from typing import Any


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_PATTERN = re.compile(r"^[+]?[-()\d\s]{7,20}$")


class ValidationError(ValueError):
    """Raised when an API request is invalid."""


def parse_json_body(event: dict[str, Any]) -> dict[str, Any]:
    body = event.get("body")
    if not body:
        raise ValidationError("Request body is required.")
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")
    try:
        parsed = json.loads(body) if isinstance(body, str) else body
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValidationError("Request body must be valid JSON.") from exc
    if not isinstance(parsed, dict):
        raise ValidationError("Request body must be a JSON object.")
    return parsed


def validate_registration(payload: dict[str, Any]) -> dict[str, str]:
    event_id = str(payload.get("eventId", "")).strip()
    full_name = str(payload.get("fullName", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    phone = str(payload.get("phone", "")).strip()
    if not event_id:
        raise ValidationError("eventId is required.")
    if not 2 <= len(full_name) <= 80:
        raise ValidationError("fullName must be between 2 and 80 characters.")
    if not EMAIL_PATTERN.fullmatch(email):
        raise ValidationError("email must be a valid email address.")
    if phone and not PHONE_PATTERN.fullmatch(phone):
        raise ValidationError("phone must be a valid phone number.")
    return {"event_id": event_id, "full_name": full_name, "email": email, "phone": phone}


def require_path_parameter(event: dict[str, Any], name: str) -> str:
    value = (event.get("pathParameters") or {}).get(name, "").strip()
    if not value:
        raise ValidationError(f"Path parameter '{name}' is required.")
    return value

