/**
 * Request parsing and validation shared by Lambda handlers.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;
const EVENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const HTML_TAG_PATTERN = /<[^>]+>/g;

// Maximum allowed lengths for text fields to prevent abuse.
const MAX_EVENT_ID_LENGTH = 64;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 20;
const MAX_PATH_PARAM_LENGTH = 256;

/**
 * Custom error class for validation failures.
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Remove HTML/script tags from a string to prevent injection.
 *
 * @param {string} value
 * @returns {string}
 */
function stripHtmlTags(value) {
  return value.replace(HTML_TAG_PATTERN, "");
}

/**
 * Strip HTML tags, collapse whitespace, and enforce max length.
 *
 * @param {string} value
 * @param {number} maxLength
 * @returns {string}
 */
function sanitizeString(value, maxLength) {
  const cleaned = stripHtmlTags(value).trim();
  if (cleaned.length > maxLength) {
    throw new ValidationError(
      `Field exceeds maximum length of ${maxLength} characters.`
    );
  }
  return cleaned;
}

/**
 * Parse and validate a JSON body from an API Gateway event.
 *
 * @param {Object} event - API Gateway proxy event.
 * @returns {Object}     - Parsed JSON body.
 */
function parseJsonBody(event) {
  let { body } = event;
  if (!body) {
    throw new ValidationError("Request body is required.");
  }
  if (event.isBase64Encoded) {
    body = Buffer.from(body, "base64").toString("utf-8");
  }
  let parsed;
  try {
    parsed = typeof body === "string" ? JSON.parse(body) : body;
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
  if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  return parsed;
}

/**
 * Validate a registration payload.
 *
 * @param {Object} payload - Raw request body.
 * @returns {{ event_id: string, full_name: string, email: string, phone: string }}
 */
function validateRegistration(payload) {
  const eventId = sanitizeString(String(payload.eventId || ""), MAX_EVENT_ID_LENGTH);
  const fullName = sanitizeString(String(payload.fullName || ""), MAX_NAME_LENGTH);
  const email = sanitizeString(String(payload.email || ""), MAX_EMAIL_LENGTH).toLowerCase();
  const phone = sanitizeString(String(payload.phone || ""), MAX_PHONE_LENGTH);

  if (!eventId) {
    throw new ValidationError("eventId is required.");
  }
  if (!EVENT_ID_PATTERN.test(eventId)) {
    throw new ValidationError("eventId contains invalid characters.");
  }
  if (fullName.length < 2 || fullName.length > MAX_NAME_LENGTH) {
    throw new ValidationError("fullName must be between 2 and 80 characters.");
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError("email must be a valid email address.");
  }
  if (!phone) {
    throw new ValidationError("phone is required.");
  }
  if (!PHONE_PATTERN.test(phone)) {
    throw new ValidationError("phone must be a valid 10-digit phone number.");
  }

  return { event_id: eventId, full_name: fullName, email, phone };
}

/**
 * Extract and validate a path parameter from the API Gateway event.
 *
 * @param {Object} event - API Gateway proxy event.
 * @param {string} name  - Path parameter name.
 * @returns {string}
 */
function requirePathParameter(event, name) {
  const raw = (event.pathParameters || {})[name] || "";
  const value = sanitizeString(raw, MAX_PATH_PARAM_LENGTH);
  if (!value) {
    throw new ValidationError(`Path parameter '${name}' is required.`);
  }
  return value;
}

module.exports = {
  ValidationError,
  stripHtmlTags,
  sanitizeString,
  parseJsonBody,
  validateRegistration,
  requirePathParameter,
};
