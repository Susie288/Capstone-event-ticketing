/**
 * GET /registrations/{email} Lambda entry point.
 */

const { RegistrationService } = require("../../services/registrationService");
const { log } = require("../../shared/logger");
const { requestTracker } = require("../../shared/metrics");
const { error, optionsResponse, success } = require("../../shared/response");
const { ValidationError, requirePathParameter } = require("../../shared/validators");

const FUNCTION_NAME = "GetRegistrationsFunction";

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
      const email = requirePathParameter(event, "email").toLowerCase();
      const registrations = await new RegistrationService().registrationsForEmail(email);
      response = success(registrations);
    } catch (err) {
      if (err instanceof ValidationError) {
        response = error(err.message, 400, "VALIDATION_ERROR");
      } else {
        log("error", "registrations_list_failed", {
          request_id: context?.awsRequestId || null,
          error: String(err),
        });
        response = error("Unable to retrieve registrations.", 500, "INTERNAL_ERROR");
      }
    }
    ctx.statusCode = response.statusCode;
    return response;
  });
};
