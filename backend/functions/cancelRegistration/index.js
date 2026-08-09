/**
 * DELETE /registration/{id} Lambda entry point.
 */

const { RegistrationNotFoundError } = require("../../repositories/registrationRepository");
const { RegistrationService } = require("../../services/registrationService");
const { log } = require("../../shared/logger");
const { requestTracker } = require("../../shared/metrics");
const { error, optionsResponse, success } = require("../../shared/response");
const { ValidationError, requirePathParameter } = require("../../shared/validators");

const FUNCTION_NAME = "CancelRegistrationFunction";

exports.handler = async (event, context) => {
  const httpMethod =
    (event.requestContext && event.requestContext.http && event.requestContext.http.method) ||
    event.httpMethod;

  if (httpMethod === "OPTIONS") {
    return optionsResponse();
  }

  return requestTracker(FUNCTION_NAME, async (ctx) => {
    let response;
    try {
      const registrationId = requirePathParameter(event, "id");
      const result = await new RegistrationService().cancel(registrationId);
      response = success(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        response = error(err.message, 400, "VALIDATION_ERROR");
      } else if (err instanceof RegistrationNotFoundError) {
        response = error(err.message, 404, "REGISTRATION_NOT_FOUND");
      } else {
        log("error", "registration_cancel_failed", {
          request_id: context?.awsRequestId || null,
          error: String(err),
        });
        response = error("Unable to cancel registration.", 500, "INTERNAL_ERROR");
      }
    }
    ctx.statusCode = response.statusCode;
    return response;
  });
};
