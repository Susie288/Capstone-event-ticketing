"""Validated environment settings."""

import os


def required_setting(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


EVENTS_TABLE = os.getenv("EVENTS_TABLE", "event-ticketing-events")
REGISTRATIONS_TABLE = os.getenv("REGISTRATIONS_TABLE", "event-ticketing-registrations")
EMAIL_INDEX = os.getenv("EMAIL_INDEX", "email-index")
REGISTRATION_ID_INDEX = os.getenv("REGISTRATION_ID_INDEX", "registration-id-index")

