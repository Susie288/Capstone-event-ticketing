/**
 * DynamoDB client and Document Client factories.
 *
 * Uses AWS SDK v3 with lazy initialisation so the clients
 * are created once and reused across warm Lambda invocations.
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

let _client = null;
let _docClient = null;

/**
 * Returns a low-level DynamoDB client (singleton).
 */
function dynamoDBClient() {
  if (!_client) {
    _client = new DynamoDBClient({});
  }
  return _client;
}

/**
 * Returns a DynamoDB Document Client (singleton).
 * The Document Client marshals/unmarshals DynamoDB attribute values
 * automatically so callers work with plain JavaScript objects.
 */
function dynamoDBDocumentClient() {
  if (!_docClient) {
    _docClient = DynamoDBDocumentClient.from(dynamoDBClient(), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return _docClient;
}

module.exports = { dynamoDBClient, dynamoDBDocumentClient };
