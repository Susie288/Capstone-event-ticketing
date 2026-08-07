"""GET /registrations/{email} Lambda entry point."""

from services.registration_service import RegistrationService
from shared.logger import log
from shared.response import error, options_response, success
from shared.validators import ValidationError, require_path_parameter


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS" or event.get("httpMethod") == "OPTIONS":
        return options_response()
    try:
        email = require_path_parameter(event, "email").lower()
        return success(RegistrationService().registrations_for_email(email))
    except ValidationError as exc:
        return error(str(exc), 400, "VALIDATION_ERROR")
    except Exception:
        log("exception", "registrations_list_failed", request_id=getattr(context, "aws_request_id", None))
        return error("Unable to retrieve registrations.", 500, "INTERNAL_ERROR")

