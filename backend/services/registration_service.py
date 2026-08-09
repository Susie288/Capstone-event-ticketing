"""Business rules for event registrations."""

from datetime import UTC, datetime
from uuid import uuid4

from config.environment import REGISTRATION_TOPIC_ARN
from models.registration import Registration
from repositories.event_repository import EventRepository
from repositories.registration_repository import RegistrationNotFoundError, RegistrationRepository
from shared.logger import log


class EventNotFoundError(Exception):
    pass


class RegistrationService:
    def __init__(
        self,
        event_repository: EventRepository | None = None,
        registration_repository: RegistrationRepository | None = None,
        sns_client=None,
    ) -> None:
        self.events = event_repository or EventRepository()
        self.registrations = registration_repository or RegistrationRepository()
        self.sns = sns_client
        self.topic_arn = REGISTRATION_TOPIC_ARN

    def register(self, data: dict[str, str]) -> dict:
        event = self.events.get_event(data["event_id"])
        if not event:
            raise EventNotFoundError("The selected event was not found.")
        registration = Registration(
            registration_id=str(uuid4()),
            event_id=data["event_id"],
            event_name=event["name"],
            full_name=data["full_name"],
            email=data["email"],
            phone=data["phone"],
            status="CONFIRMED",
            created_at=datetime.now(UTC).isoformat(),
        )
        self.registrations.create(registration.__dict__)
        self._notify_sns(registration, event["name"])
        return registration.to_api()

    def _notify_sns(self, registration: Registration, event_name: str) -> None:
        if not self.topic_arn:
            log("info", "sns_publish_skipped", reason="REGISTRATION_TOPIC_ARN not set")
            return
        try:
            if self.sns is None:
                import boto3
                self.sns = boto3.client("sns")

            # Subscribe attendee's email to the SNS topic for email notification & subscription confirmation
            if registration.email:
                try:
                    self.sns.subscribe(
                        TopicArn=self.topic_arn,
                        Protocol="email",
                        Endpoint=registration.email,
                    )
                    log("info", "sns_subscribed", email=registration.email, registration_id=registration.registration_id)
                except Exception as sub_exc:
                    log("warning", "sns_subscribe_failed", error=str(sub_exc), email=registration.email)

            message = (
                f"New Event Registration Confirmed!\n\n"
                f"Event Name: {event_name}\n"
                f"Registration ID: {registration.registration_id}\n"
                f"Attendee Name: {registration.full_name}\n"
                f"Attendee Email: {registration.email}\n"
                f"Attendee Phone: {registration.phone or 'N/A'}\n"
                f"Registered At: {registration.created_at}\n"
            )
            self.sns.publish(
                TopicArn=self.topic_arn,
                Subject=f"Registration Confirmed: {event_name}",
                Message=message,
            )
            log("info", "sns_published", registration_id=registration.registration_id)
        except Exception as exc:
            log("error", "sns_publish_failed", error=str(exc), registration_id=registration.registration_id)

    def registrations_for_email(self, email: str) -> list[dict]:
        return [Registration.from_item(item).to_api() for item in self.registrations.list_by_email(email.lower())]

    def cancel(self, registration_id: str) -> dict:
        registration = self.registrations.get_by_registration_id(registration_id)
        if not registration:
            raise RegistrationNotFoundError("Registration was not found.")
        self.registrations.cancel(registration)
        return {"registrationId": registration_id, "status": "CANCELLED", "message": "Registration cancelled successfully."}

