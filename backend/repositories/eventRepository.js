/**
 * Persistence operations for events.
 */

const { ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDBDocumentClient } = require("../config/dynamodb");
const { EVENTS_TABLE } = require("../config/environment");

class EventRepository {
  /**
   * @param {Object} [options]
   * @param {Object} [options.client] - DynamoDB Document Client override (for testing).
   */
  constructor({ client } = {}) {
    this.client = client || dynamoDBDocumentClient();
    this.tableName = EVENTS_TABLE;
  }

  /**
   * List all events from the table (handles pagination).
   *
   * @returns {Promise<Object[]>}
   */
  async listEvents() {
    const items = [];
    let lastKey;

    do {
      const response = await this.client.send(
        new ScanCommand({
          TableName: this.tableName,
          ...(lastKey && { ExclusiveStartKey: lastKey }),
        })
      );
      items.push(...(response.Items || []));
      lastKey = response.LastEvaluatedKey;
    } while (lastKey);

    return items;
  }

  /**
   * Get a single event by ID.
   *
   * @param {string} eventId
   * @returns {Promise<Object|null>}
   */
  async getEvent(eventId) {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { event_id: eventId },
      })
    );
    return response.Item || null;
  }
}

module.exports = { EventRepository };
