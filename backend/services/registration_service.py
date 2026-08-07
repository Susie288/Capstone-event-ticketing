"""Business rules for event registrations."""

from datetime import UTC, datetime
from uuid import uuid4

from models.registration import Registration
from repositories.event_repository import EventRepository
from repositories.registration_repository import RegistrationNotFoundError, RegistrationRepository


class EventNotFoundError(Exception):
    pass


class RegistrationService:
    def __init__(self, event_repository: EventRepository | None = None, registration_repository: RegistrationRepository | None = None) -> None:
        self.events = event_repository or EventRepository()
        self.registrations = registration_repository or RegistrationRepository()

    def register(self, data: dict[str, str]) -> dict:
        event = self.events.get_event(data["event_id"])
        if not event:
            raise EventNotFoundError("The selected event was not found.")
        registration = Registration(
            registration_id=str(uuid4()), event_id=data["event_id"], event_name=event["name"],
            full_name=data["full_name"], email=data["email"], phone=data["phone"], status="CONFIRMED",
            created_at=datetime.now(UTC).isoformat(),
        )
        self.registrations.create(registration.__dict__)
        return registration.to_api()

    def registrations_for_email(self, email: str) -> list[dict]:
        return [Registration.from_item(item).to_api() for item in self.registrations.list_by_email(email.lower())]

    def cancel(self, registration_id: str) -> dict:
        registration = self.registrations.get_by_registration_id(registration_id)
        if not registration:
            raise RegistrationNotFoundError("Registration was not found.")
        self.registrations.cancel(registration)
        return {"registrationId": registration_id, "status": "CANCELLED", "message": "Registration cancelled successfully."}

