/**
 * POST /register and POST /registrations Lambda entry point.
 */

const {
  DuplicateRegistrationError,
  EventUnavailableError,
} = require("../../repositories/registrationRepository");
const {
  RegistrationService,
  EventNotFoundError,
} = require("../../services/registrationService");
const { log } = require("../../shared/logger");
const { requestTracker, trackFailedRegistration } = require("../../shared/metrics");
const { error, optionsResponse, success } = require("../../shared/response");
const {
  ValidationError,
  parseJsonBody,
  validateRegistration,
} = require("../../shared/validators");

const FUNCTION_NAME = "RegisterFunction";

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
      const body = parseJsonBody(event);
      const data = validateRegistration(body);
      const registration = await new RegistrationService().register(data);
      log("info", "registration_created", {
        registration_id: registration.registrationId,
        request_id: context?.awsRequestId || null,
      });
      response = success(registration, 201);
    } catch (err) {
      if (err instanceof ValidationError) {
        await trackFailedRegistration("VALIDATION_ERROR");
        response = error(err.message, 400, "VALIDATION_ERROR");
      } else if (err instanceof EventNotFoundError) {
        await trackFailedRegistration("EVENT_NOT_FOUND");
        response = error(err.message, 404, "EVENT_NOT_FOUND");
      } else if (err instanceof DuplicateRegistrationError) {
        await trackFailedRegistration("DUPLICATE_REGISTRATION");
        response = error(
          "You are already registered for this event.",
          409,
          "DUPLICATE_REGISTRATION"
        );
      } else if (err instanceof EventUnavailableError) {
        await trackFailedRegistration("EVENT_UNAVAILABLE");
        response = error(
          "This event is sold out or unavailable.",
          409,
          "EVENT_UNAVAILABLE"
        );
      } else {
        await trackFailedRegistration("INTERNAL_ERROR");
        log("error", "registration_failed", {
          request_id: context?.awsRequestId || null,
          error: String(err),
        });
        response = error("Unable to create registration.", 500, "INTERNAL_ERROR");
      }
    }
    ctx.statusCode = response.statusCode;
    return response;
  });
};
