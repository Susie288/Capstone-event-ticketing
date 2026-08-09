/**
 * GET /events Lambda entry point.
 */

const { log } = require("../../shared/logger");
const { requestTracker } = require("../../shared/metrics");
const { error, optionsResponse, success } = require("../../shared/response");
const { EventService } = require("../../services/eventService");

const FUNCTION_NAME = "GetEventsFunction";

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
      const events = await new EventService().getEvents();
      log("info", "events_listed", {
        count: events.length,
        request_id: context?.awsRequestId || null,
      });
      response = success(events);
    } catch (err) {
      log("error", "events_list_failed", {
        request_id: context?.awsRequestId || null,
        error: String(err),
      });
      response = error("Unable to retrieve events.", 500, "INTERNAL_ERROR");
    }
    ctx.statusCode = response.statusCode;
    return response;
  });
};
