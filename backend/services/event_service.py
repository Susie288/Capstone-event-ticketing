"""Business rules for listing events."""

from models.event import Event
from repositories.event_repository import EventRepository


class EventService:
    def __init__(self, repository: EventRepository | None = None) -> None:
        self.repository = repository or EventRepository()

    def get_events(self) -> list[dict]:
        events = [Event.from_item(item) for item in self.repository.list_events()]
        return [self._with_calculated_status(event) for event in sorted(events, key=lambda item: (item.date, item.time))]

    @staticmethod
    def _with_calculated_status(event: Event) -> dict:
        data = event.to_api()
        if event.available_seats == 0:
            data["status"] = "SOLD_OUT"
        elif event.available_seats <= max(1, event.total_seats // 10):
            data["status"] = "LIMITED"
        else:
            data["status"] = "AVAILABLE"
        return data

