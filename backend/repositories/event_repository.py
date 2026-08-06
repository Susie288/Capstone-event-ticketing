"""Persistence operations for events."""

from typing import Any

from config.dynamodb import dynamodb_resource
from config.environment import EVENTS_TABLE


class EventRepository:
    def __init__(self, table: Any | None = None) -> None:
        self.table = table or dynamodb_resource().Table(EVENTS_TABLE)

    def list_events(self) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        response = self.table.scan()
        items.extend(response.get("Items", []))
        while response.get("LastEvaluatedKey"):
            response = self.table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
        return items

    def get_event(self, event_id: str) -> dict[str, Any] | None:
        return self.table.get_item(Key={"event_id": event_id}).get("Item")

