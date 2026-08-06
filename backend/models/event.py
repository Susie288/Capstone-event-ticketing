"""Event mapping utilities."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Event:
    id: str
    name: str
    description: str
    date: str
    time: str
    venue: str
    organizer: str
    total_seats: int
    available_seats: int
    status: str
    image_url: str | None = None

    @classmethod
    def from_item(cls, item: dict[str, Any]) -> "Event":
        return cls(
            id=item["event_id"], name=item["name"], description=item.get("description", ""),
            date=item.get("date", ""), time=item.get("time", ""), venue=item.get("venue", ""),
            organizer=item.get("organizer", ""), total_seats=int(item.get("total_seats", 0)),
            available_seats=int(item.get("available_seats", 0)), status=item.get("status", "AVAILABLE"),
            image_url=item.get("image_url"),
        )

    def to_api(self) -> dict[str, Any]:
        return {
            "id": self.id, "name": self.name, "description": self.description, "date": self.date,
            "time": self.time, "venue": self.venue, "organizer": self.organizer,
            "imageUrl": self.image_url, "totalSeats": self.total_seats,
            "availableSeats": self.available_seats, "status": self.status,
        }

