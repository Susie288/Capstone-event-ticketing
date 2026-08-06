"""POST /register and POST /registrations Lambda entry point."""

from repositories.registration_repository import DuplicateRegistrationError, EventUnavailableError
from services.registration_service import EventNotFoundError, RegistrationService
from shared.logger import log
from shared.response import error, options_response, success
from shared.validators import ValidationError, parse_json_body, validate_registration


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS" or event.get("httpMethod") == "OPTIONS":
        return options_response()
    try:
        registration = RegistrationService().register(validate_registration(parse_json_body(event)))
        log("info", "registration_created", registration_id=registration["registrationId"], request_id=getattr(context, "aws_request_id", None))
        return success(registration, 201)
    except ValidationError as exc:
        return error(str(exc), 400, "VALIDATION_ERROR")
    except EventNotFoundError as exc:
        return error(str(exc), 404, "EVENT_NOT_FOUND")
    except DuplicateRegistrationError:
        return error("You are already registered for this event.", 409, "DUPLICATE_REGISTRATION")
    except EventUnavailableError:
        return error("This event is sold out or unavailable.", 409, "EVENT_UNAVAILABLE")
    except Exception:
        log("exception", "registration_failed", request_id=getattr(context, "aws_request_id", None))
        return error("Unable to create registration.", 500, "INTERNAL_ERROR")

