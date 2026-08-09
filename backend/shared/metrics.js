/**
 * Custom CloudWatch metrics for API observability.
 *
 * Publishes metrics to the 'EventTicketingSystem' namespace so CloudWatch
 * dashboards and alarms can track request counts, failed registrations,
 * and Lambda execution duration.
 */

const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require("@aws-sdk/client-cloudwatch");
const { log } = require("./logger");

const NAMESPACE = "EventTicketingSystem";

let _cloudwatchClient = null;

/**
 * Lazy-initialise the CloudWatch client (re-used across warm starts).
 */
function getClient() {
  if (!_cloudwatchClient) {
    _cloudwatchClient = new CloudWatchClient({});
  }
  return _cloudwatchClient;
}

/**
 * Publish a single custom metric data point to CloudWatch.
 *
 * @param {string}  metricName  - Metric name.
 * @param {number}  value       - Metric value.
 * @param {string}  unit        - CloudWatch unit (e.g. "Count", "Milliseconds").
 * @param {Array?}  dimensions  - Optional array of { Name, Value } objects.
 */
async function emitMetric(metricName, value, unit, dimensions) {
  try {
    const metricData = {
      MetricName: metricName,
      Value: value,
      Unit: unit,
    };
    if (dimensions && dimensions.length > 0) {
      metricData.Dimensions = dimensions;
    }
    await getClient().send(
      new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: [metricData],
      })
    );
  } catch (err) {
    // Metrics should never break the request — log and continue.
    log("warning", "metric_publish_failed", { metric: metricName, error: String(err) });
  }
}

/**
 * Record an API request with success/failure categorisation.
 *
 * @param {string} functionName - Lambda function name.
 * @param {number} statusCode   - HTTP response status code.
 */
async function trackRequest(functionName, statusCode) {
  const status = statusCode >= 200 && statusCode < 400 ? "Success" : "Error";
  await emitMetric("ApiRequestCount", 1, "Count", [
    { Name: "FunctionName", Value: functionName },
    { Name: "Status", Value: status },
  ]);
}

/**
 * Record a failed registration attempt with a reason dimension.
 *
 * @param {string} reason - Failure reason code.
 */
async function trackFailedRegistration(reason) {
  await emitMetric("FailedRegistrations", 1, "Count", [
    { Name: "Reason", Value: reason },
  ]);
}

/**
 * Record Lambda handler execution time in milliseconds.
 *
 * @param {string} functionName - Lambda function name.
 * @param {number} durationMs   - Duration in milliseconds.
 */
async function trackDuration(functionName, durationMs) {
  await emitMetric("HandlerDuration", durationMs, "Milliseconds", [
    { Name: "FunctionName", Value: functionName },
  ]);
}

/**
 * Wrapper that tracks duration and request count automatically.
 *
 * Replaces the Python context manager pattern. The handler function
 * receives a `ctx` object where it should set `ctx.statusCode`.
 *
 * @param {string}   functionName - Lambda function identifier.
 * @param {Function} handler      - Async function(ctx) that performs work.
 * @returns {*} The return value of the handler function.
 *
 * @example
 *   return requestTracker("RegisterFunction", async (ctx) => {
 *     const response = await doWork();
 *     ctx.statusCode = response.statusCode;
 *     return response;
 *   });
 */
async function requestTracker(functionName, handler) {
  const ctx = { statusCode: 500 };
  const start = process.hrtime.bigint();
  try {
    const result = await handler(ctx);
    return result;
  } finally {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    await trackRequest(functionName, ctx.statusCode);
    await trackDuration(functionName, durationMs);
  }
}

module.exports = {
  emitMetric,
  trackRequest,
  trackFailedRegistration,
  trackDuration,
  requestTracker,
};
