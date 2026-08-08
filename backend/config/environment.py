"""Validated environment settings."""

import os





EVENTS_TABLE = os.getenv("EVENTS_TABLE", "event-ticketing-events")
REGISTRATIONS_TABLE = os.getenv("REGISTRATIONS_TABLE", "event-ticketing-registrations")
EMAIL_INDEX = os.getenv("EMAIL_INDEX", "email-index")
REGISTRATION_ID_INDEX = os.getenv("REGISTRATION_ID_INDEX", "registration-id-index")
REGISTRATION_TOPIC_ARN = os.getenv("REGISTRATION_TOPIC_ARN", "")

