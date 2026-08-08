"""POST /register and POST /registrations Lambda entry point."""

from repositories.registration_repository import DuplicateRegistrationError, EventUnavailableError
from services.registration_service import EventNotFoundError, RegistrationService
from shared.logger import log
from shared.metrics import request_tracker, track_failed_registration
from shared.response import error, options_response, success
from shared.validators import ValidationError, parse_json_body, validate_registration

FUNCTION_NAME = "RegisterFunction"


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS" or event.get("httpMethod") == "OPTIONS":
        return options_response()

    with request_tracker(FUNCTION_NAME) as ctx:
        try:
            registration = RegistrationService().register(validate_registration(parse_json_body(event)))
            log("info", "registration_created", registration_id=registration["registrationId"], request_id=getattr(context, "aws_request_id", None))
            response = success(registration, 201)
        except ValidationError as exc:
            track_failed_registration("VALIDATION_ERROR")
            response = error(str(exc), 400, "VALIDATION_ERROR")
        except EventNotFoundError as exc:
            track_failed_registration("EVENT_NOT_FOUND")
            response = error(str(exc), 404, "EVENT_NOT_FOUND")
        except DuplicateRegistrationError:
            track_failed_registration("DUPLICATE_REGISTRATION")
            response = error("You are already registered for this event.", 409, "DUPLICATE_REGISTRATION")
        except EventUnavailableError:
            track_failed_registration("EVENT_UNAVAILABLE")
            response = error("This event is sold out or unavailable.", 409, "EVENT_UNAVAILABLE")
        except Exception:
            track_failed_registration("INTERNAL_ERROR")
            log("exception", "registration_failed", request_id=getattr(context, "aws_request_id", None))
            response = error("Unable to create registration.", 500, "INTERNAL_ERROR")

        ctx["status_code"] = response["statusCode"]
        return response

