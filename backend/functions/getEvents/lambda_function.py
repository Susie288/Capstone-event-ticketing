"""GET /events Lambda entry point."""

from shared.logger import log
from shared.metrics import request_tracker
from shared.response import error, options_response, success
from services.event_service import EventService

FUNCTION_NAME = "GetEventsFunction"


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS" or event.get("httpMethod") == "OPTIONS":
        return options_response()

    with request_tracker(FUNCTION_NAME) as ctx:
        try:
            events = EventService().get_events()
            log("info", "events_listed", count=len(events), request_id=getattr(context, "aws_request_id", None))
            response = success(events)
        except Exception:
            log("exception", "events_list_failed", request_id=getattr(context, "aws_request_id", None))
            response = error("Unable to retrieve events.", 500, "INTERNAL_ERROR")

        ctx["status_code"] = response["statusCode"]
        return response


