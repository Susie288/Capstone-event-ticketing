"""GET /events Lambda entry point."""

from shared.logger import log
from shared.response import error, options_response, success
from services.event_service import EventService


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS" or event.get("httpMethod") == "OPTIONS":
        return options_response()
    try:
        events = EventService().get_events()
        log("info", "events_listed", count=len(events), request_id=getattr(context, "aws_request_id", None))
        return success(events)
    except Exception:
        log("exception", "events_list_failed", request_id=getattr(context, "aws_request_id", None))
        return error("Unable to retrieve events.", 500, "INTERNAL_ERROR")

