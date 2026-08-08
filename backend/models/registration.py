"""Registration mapping utilities."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Registration:
    registration_id: str
    event_id: str
    event_name: str
    full_name: str
    email: str
    phone: str
    status: str
    created_at: str

    def to_api(self) -> dict[str, Any]:
        return {
            "registrationId": self.registration_id, "eventId": self.event_id,
            "eventName": self.event_name, "fullName": self.full_name, "email": self.email,
            "phone": self.phone, "status": self.status, "createdAt": self.created_at,
        }

    @classmethod
    def from_item(cls, item: dict[str, Any]) -> "Registration":
        required_fields = {
            "registration_id", "event_id", "event_name", "full_name",
            "email", "status", "created_at"
        }
        missing = [f for f in required_fields if f not in item or item[f] is None]
        if missing:
            raise ValueError(f"Missing required registration fields: {', '.join(missing)}")
        return cls(
            registration_id=str(item["registration_id"]),
            event_id=str(item["event_id"]),
            event_name=str(item["event_name"]),
            full_name=str(item["full_name"]),
            email=str(item["email"]),
            phone=str(item.get("phone") or ""),
            status=str(item["status"]),
            created_at=str(item["created_at"]),
        )

