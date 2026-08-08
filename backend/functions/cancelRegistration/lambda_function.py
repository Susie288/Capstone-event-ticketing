"""DELETE /registration/{id} Lambda entry point."""

from repositories.registration_repository import RegistrationNotFoundError
from services.registration_service import RegistrationService
from shared.logger import log
from shared.metrics import request_tracker
from shared.response import error, options_response, success
from shared.validators import ValidationError, require_path_parameter

FUNCTION_NAME = "CancelRegistrationFunction"


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS" or event.get("httpMethod") == "OPTIONS":
        return options_response()

    with request_tracker(FUNCTION_NAME) as ctx:
        try:
            registration_id = require_path_parameter(event, "id")
            response = success(RegistrationService().cancel(registration_id))
        except ValidationError as exc:
            response = error(str(exc), 400, "VALIDATION_ERROR")
        except RegistrationNotFoundError as exc:
            response = error(str(exc), 404, "REGISTRATION_NOT_FOUND")
        except Exception:
            log("exception", "registration_cancel_failed", request_id=getattr(context, "aws_request_id", None))
            response = error("Unable to cancel registration.", 500, "INTERNAL_ERROR")

        ctx["status_code"] = response["statusCode"]
        return response


