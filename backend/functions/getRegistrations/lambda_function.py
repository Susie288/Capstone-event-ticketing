"""GET /registrations/{email} Lambda entry point."""

from services.registration_service import RegistrationService
from shared.logger import log
from shared.metrics import request_tracker
from shared.response import error, options_response, success
from shared.validators import ValidationError, require_path_parameter

FUNCTION_NAME = "GetRegistrationsFunction"


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS" or event.get("httpMethod") == "OPTIONS":
        return options_response()

    with request_tracker(FUNCTION_NAME) as ctx:
        try:
            email = require_path_parameter(event, "email").lower()
            response = success(RegistrationService().registrations_for_email(email))
        except ValidationError as exc:
            response = error(str(exc), 400, "VALIDATION_ERROR")
        except Exception:
            log("exception", "registrations_list_failed", request_id=getattr(context, "aws_request_id", None))
            response = error("Unable to retrieve registrations.", 500, "INTERNAL_ERROR")

        ctx["status_code"] = response["statusCode"]
        return response


