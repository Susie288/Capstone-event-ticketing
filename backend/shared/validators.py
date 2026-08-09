"""Request parsing and validation shared by Lambda handlers."""

import base64
import json
import re
from typing import Any


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_PATTERN = re.compile(r"^\d{10}$")
EVENT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")

# Maximum allowed lengths for text fields to prevent abuse.
MAX_EVENT_ID_LENGTH = 64
MAX_NAME_LENGTH = 80
MAX_EMAIL_LENGTH = 254
MAX_PHONE_LENGTH = 20
MAX_PATH_PARAM_LENGTH = 256


class ValidationError(ValueError):
    """Raised when an API request is invalid."""


def strip_html_tags(value: str) -> str:
    """Remove HTML/script tags from a string to prevent injection."""
    return HTML_TAG_PATTERN.sub("", value)


def sanitize_string(value: str, max_length: int) -> str:
    """Strip HTML tags, collapse whitespace, and enforce max length."""
    cleaned = strip_html_tags(value).strip()
    if len(cleaned) > max_length:
        raise ValidationError(
            f"Field exceeds maximum length of {max_length} characters."
        )
    return cleaned


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
    event_id = sanitize_string(str(payload.get("eventId", "")), MAX_EVENT_ID_LENGTH)
    full_name = sanitize_string(str(payload.get("fullName", "")), MAX_NAME_LENGTH)
    email = sanitize_string(str(payload.get("email", "")), MAX_EMAIL_LENGTH).lower()
    phone = sanitize_string(str(payload.get("phone", "")), MAX_PHONE_LENGTH)

    if not event_id:
        raise ValidationError("eventId is required.")
    if not EVENT_ID_PATTERN.fullmatch(event_id):
        raise ValidationError("eventId contains invalid characters.")
    if not 2 <= len(full_name) <= MAX_NAME_LENGTH:
        raise ValidationError("fullName must be between 2 and 80 characters.")
    if not EMAIL_PATTERN.fullmatch(email):
        raise ValidationError("email must be a valid email address.")
    if not phone:
        raise ValidationError("phone is required.")
    if not PHONE_PATTERN.fullmatch(phone):
        raise ValidationError("phone must be a valid 10-digit phone number.")
    return {"event_id": event_id, "full_name": full_name, "email": email, "phone": phone}


def require_path_parameter(event: dict[str, Any], name: str) -> str:
    value = sanitize_string(
        (event.get("pathParameters") or {}).get(name, ""), MAX_PATH_PARAM_LENGTH
    )
    if not value:
        raise ValidationError(f"Path parameter '{name}' is required.")
    return value


