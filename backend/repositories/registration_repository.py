"""Transactional DynamoDB operations for registrations."""

from typing import Any

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from config.dynamodb import dynamodb_client, dynamodb_resource
from config.environment import (
    EMAIL_INDEX,
    EVENTS_TABLE,
    REGISTRATIONS_TABLE,
    REGISTRATION_ID_INDEX,
)


class DuplicateRegistrationError(Exception):
    pass


class EventUnavailableError(Exception):
    pass


class RegistrationNotFoundError(Exception):
    pass


class RegistrationRepository:
    def __init__(self, table: Any | None = None, client: Any | None = None) -> None:
        resource = dynamodb_resource()
        self.table = table or resource.Table(REGISTRATIONS_TABLE)
        self.client = client or dynamodb_client()

    def create(self, registration: dict[str, Any]) -> None:
        try:
            self.client.transact_write_items(
                TransactItems=[
                    {
                        "Update": {
                            "TableName": EVENTS_TABLE,
                            "Key": {
                                "event_id": {
                                    "S": registration["event_id"]
                                }
                            },
                            "UpdateExpression": (
                                "SET available_seats = available_seats - :one"
                            ),
                            "ConditionExpression": (
                                "attribute_exists(event_id) "
                                "AND available_seats > :zero"
                            ),
                            "ExpressionAttributeValues": {
                                ":one": {
                                    "N": "1"
                                },
                                ":zero": {
                                    "N": "0"
                                }
                            },
                        }
                    },
                    {
                        "Put": {
                            "TableName": REGISTRATIONS_TABLE,
                            "Item": _serialize(registration),
                            "ConditionExpression": (
                                "attribute_not_exists(event_id) "
                                "AND attribute_not_exists(email)"
                            ),
                        }
                    },
                ]
            )

        except ClientError as exc:
            reasons = exc.response.get("CancellationReasons", [])

            # Registration already exists
            if (
                len(reasons) > 1
                and reasons[1].get("Code") == "ConditionalCheckFailed"
            ):
                raise DuplicateRegistrationError from exc

            # Event missing, sold out, or another transaction failure
            raise EventUnavailableError from exc

    def list_by_email(self, email: str) -> list[dict[str, Any]]:
        response = self.table.query(
            IndexName=EMAIL_INDEX,
            KeyConditionExpression=Key("email").eq(email),
        )
        return response.get("Items", [])

    def get_by_registration_id(
        self,
        registration_id: str
    ) -> dict[str, Any] | None:
        response = self.table.query(
            IndexName=REGISTRATION_ID_INDEX,
            KeyConditionExpression=Key("registration_id").eq(registration_id),
            Limit=1,
        )
        return (response.get("Items") or [None])[0]

    def cancel(self, registration: dict[str, Any]) -> None:
        if registration.get("status") == "CANCELLED":
            return

        try:
            self.client.transact_write_items(
                TransactItems=[
                    {
                        "Update": {
                            "TableName": REGISTRATIONS_TABLE,
                            "Key": {
                                "event_id": {
                                    "S": registration["event_id"]
                                },
                                "email": {
                                    "S": registration["email"]
                                },
                            },
                            "UpdateExpression": (
                                "SET #status = :cancelled"
                            ),
                            "ConditionExpression": (
                                "#status <> :cancelled"
                            ),
                            "ExpressionAttributeNames": {
                                "#status": "status"
                            },
                            "ExpressionAttributeValues": {
                                ":cancelled": {
                                    "S": "CANCELLED"
                                }
                            },
                        }
                    },
                    {
                        "Update": {
                            "TableName": EVENTS_TABLE,
                            "Key": {
                                "event_id": {
                                    "S": registration["event_id"]
                                }
                            },
                            "UpdateExpression": (
                                "SET available_seats = available_seats + :one"
                            ),
                            "ExpressionAttributeValues": {
                                ":one": {
                                    "N": "1"
                                }
                            },
                        }
                    },
                ]
            )

        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code", "")
            reasons = exc.response.get("CancellationReasons", [])

            if error_code == "ResourceNotFoundException" or (
                error_code == "TransactionCanceledException"
                and any(r.get("Code") == "ConditionalCheckFailed" for r in reasons)
            ):
                raise RegistrationNotFoundError from exc
            raise


def _serialize(item: dict[str, Any]) -> dict[str, dict[str, str]]:
    return {
        key: {
            "S": str(value)
        }
        for key, value in item.items()
    }