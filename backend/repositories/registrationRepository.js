/**
 * Transactional DynamoDB operations for registrations.
 */

const {
  TransactWriteItemsCommand,
} = require("@aws-sdk/client-dynamodb");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDBClient, dynamoDBDocumentClient } = require("../config/dynamodb");
const {
  EVENTS_TABLE,
  REGISTRATIONS_TABLE,
  EMAIL_INDEX,
  REGISTRATION_ID_INDEX,
} = require("../config/environment");

class DuplicateRegistrationError extends Error {
  constructor(message = "Duplicate registration.") {
    super(message);
    this.name = "DuplicateRegistrationError";
  }
}

class EventUnavailableError extends Error {
  constructor(message = "Event unavailable.") {
    super(message);
    this.name = "EventUnavailableError";
  }
}

class RegistrationNotFoundError extends Error {
  constructor(message = "Registration not found.") {
    super(message);
    this.name = "RegistrationNotFoundError";
  }
}

class RegistrationRepository {
  /**
   * @param {Object} [options]
   * @param {Object} [options.client]    - Low-level DynamoDB client override.
   * @param {Object} [options.docClient] - DynamoDB Document Client override.
   */
  constructor({ client, docClient } = {}) {
    this.client = client || dynamoDBClient();
    this.docClient = docClient || dynamoDBDocumentClient();
  }

  /**
   * Create a new registration using an atomic DynamoDB transaction.
   * Decrements available_seats in EventsTable and inserts a new
   * registration record in RegistrationsTable.
   *
   * @param {Object} registration - Registration data (snake_case keys).
   */
  async create(registration) {
    try {
      await this.client.send(
        new TransactWriteItemsCommand({
          TransactItems: [
            {
              Update: {
                TableName: EVENTS_TABLE,
                Key: {
                  event_id: { S: registration.event_id },
                },
                UpdateExpression: "SET available_seats = available_seats - :one",
                ConditionExpression:
                  "attribute_exists(event_id) AND available_seats > :zero",
                ExpressionAttributeValues: {
                  ":one": { N: "1" },
                  ":zero": { N: "0" },
                },
              },
            },
            {
              Put: {
                TableName: REGISTRATIONS_TABLE,
                Item: serialize(registration),
                ConditionExpression:
                  "attribute_not_exists(event_id) AND attribute_not_exists(email)",
              },
            },
          ],
        })
      );
    } catch (err) {
      const reasons = err.CancellationReasons || [];

      // Registration already exists
      if (
        reasons.length > 1 &&
        reasons[1] &&
        reasons[1].Code === "ConditionalCheckFailed"
      ) {
        throw new DuplicateRegistrationError();
      }

      // Event missing, sold out, or another transaction failure
      throw new EventUnavailableError();
    }
  }

  /**
   * List registrations for a given email using the email-index GSI.
   *
   * @param {string} email
   * @returns {Promise<Object[]>}
   */
  async listByEmail(email) {
    const response = await this.docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        IndexName: EMAIL_INDEX,
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );
    return response.Items || [];
  }

  /**
   * Look up a registration by its registration_id using the
   * registration-id-index GSI.
   *
   * @param {string} registrationId
   * @returns {Promise<Object|null>}
   */
  async getByRegistrationId(registrationId) {
    const response = await this.docClient.send(
      new QueryCommand({
        TableName: REGISTRATIONS_TABLE,
        IndexName: REGISTRATION_ID_INDEX,
        KeyConditionExpression: "registration_id = :rid",
        ExpressionAttributeValues: { ":rid": registrationId },
        Limit: 1,
      })
    );
    return (response.Items && response.Items[0]) || null;
  }

  /**
   * Cancel a registration — sets status to CANCELLED and restores
   * the seat count in EventsTable.
   *
   * @param {Object} registration - The registration record to cancel.
   */
  async cancel(registration) {
    if (registration.status === "CANCELLED") {
      return;
    }

    try {
      await this.client.send(
        new TransactWriteItemsCommand({
          TransactItems: [
            {
              Update: {
                TableName: REGISTRATIONS_TABLE,
                Key: {
                  event_id: { S: registration.event_id },
                  email: { S: registration.email },
                },
                UpdateExpression: "SET #status = :cancelled",
                ConditionExpression: "#status <> :cancelled",
                ExpressionAttributeNames: { "#status": "status" },
                ExpressionAttributeValues: {
                  ":cancelled": { S: "CANCELLED" },
                },
              },
            },
            {
              Update: {
                TableName: EVENTS_TABLE,
                Key: {
                  event_id: { S: registration.event_id },
                },
                UpdateExpression: "SET available_seats = available_seats + :one",
                ExpressionAttributeValues: {
                  ":one": { N: "1" },
                },
              },
            },
          ],
        })
      );
    } catch (err) {
      const errorCode = err.name || "";
      const reasons = err.CancellationReasons || [];

      if (
        errorCode === "ResourceNotFoundException" ||
        (errorCode === "TransactionCanceledException" &&
          reasons.some((r) => r.Code === "ConditionalCheckFailed"))
      ) {
        throw new RegistrationNotFoundError();
      }
      throw err;
    }
  }
}

/**
 * Serialize a plain JS object to DynamoDB attribute value map.
 *
 * @param {Object} item
 * @returns {Object} - DynamoDB-formatted item with { S: "..." } values.
 */
function serialize(item) {
  const result = {};
  for (const [key, value] of Object.entries(item)) {
    result[key] = { S: String(value) };
  }
  return result;
}

module.exports = {
  RegistrationRepository,
  DuplicateRegistrationError,
  EventUnavailableError,
  RegistrationNotFoundError,
};
