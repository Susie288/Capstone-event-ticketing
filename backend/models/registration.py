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
        return cls(**{field: item.get(field, "") for field in cls.__dataclass_fields__})

