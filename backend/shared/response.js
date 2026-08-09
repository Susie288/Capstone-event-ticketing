/**
 * Consistent API Gateway proxy responses.
 */

const { ALLOWED_ORIGIN } = require("../config/environment");

/**
 * Build a JSON response with CORS headers for API Gateway.
 *
 * @param {number} statusCode - HTTP status code.
 * @param {*}      body       - Response body (will be JSON-stringified).
 * @returns {{ statusCode: number, headers: Object, body: string }}
 */
function apiResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

/**
 * Build a success response.
 *
 * @param {*}      body       - Response payload.
 * @param {number} [statusCode=200] - HTTP status code.
 */
function success(body, statusCode = 200) {
  return apiResponse(statusCode, body);
}

/**
 * Build an error response.
 *
 * @param {string}  message    - Human-readable error message.
 * @param {number}  statusCode - HTTP status code.
 * @param {string?} code       - Optional machine-readable error code.
 */
function error(message, statusCode, code) {
  const payload = { message };
  if (code) payload.code = code;
  return apiResponse(statusCode, payload);
}

/**
 * Build an OPTIONS preflight response.
 */
function optionsResponse() {
  return apiResponse(204, {});
}

module.exports = { apiResponse, success, error, optionsResponse };
