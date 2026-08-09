/**
 * Validated environment settings.
 */

const EVENTS_TABLE = process.env.EVENTS_TABLE || "event-ticketing-events";
const REGISTRATIONS_TABLE = process.env.REGISTRATIONS_TABLE || "event-ticketing-registrations";
const EMAIL_INDEX = process.env.EMAIL_INDEX || "email-index";
const REGISTRATION_ID_INDEX = process.env.REGISTRATION_ID_INDEX || "registration-id-index";
const REGISTRATION_TOPIC_ARN = process.env.REGISTRATION_TOPIC_ARN || "";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

module.exports = {
  EVENTS_TABLE,
  REGISTRATIONS_TABLE,
  EMAIL_INDEX,
  REGISTRATION_ID_INDEX,
  REGISTRATION_TOPIC_ARN,
  ALLOWED_ORIGIN,
};
