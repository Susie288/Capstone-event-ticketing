/**
 * Unit tests for repositories/registrationRepository.js
 */

// Mock the config/dynamodb module so it doesn't try to connect
jest.mock("../config/dynamodb", () => ({
  dynamoDBClient: jest.fn(),
  dynamoDBDocumentClient: jest.fn(),
}));

const {
  RegistrationRepository,
  RegistrationNotFoundError,
} = require("../repositories/registrationRepository");

describe("RegistrationRepository.cancel", () => {
  test("raises RegistrationNotFoundError on ConditionalCheckFailed", async () => {
    const mockClient = {
      send: jest.fn().mockRejectedValue(
        Object.assign(new Error("TransactionCanceledException"), {
          name: "TransactionCanceledException",
          CancellationReasons: [
            { Code: "ConditionalCheckFailed" },
            { Code: "None" },
          ],
        })
      ),
    };

    const repo = new RegistrationRepository({
      client: mockClient,
      docClient: {},
    });

    await expect(
      repo.cancel({
        event_id: "evt-1",
        email: "test@example.com",
        status: "CONFIRMED",
      })
    ).rejects.toThrow(RegistrationNotFoundError);
  });

  test("re-raises other client errors", async () => {
    const mockClient = {
      send: jest.fn().mockRejectedValue(
        Object.assign(new Error("ProvisionedThroughputExceededException"), {
          name: "ProvisionedThroughputExceededException",
          CancellationReasons: [],
        })
      ),
    };

    const repo = new RegistrationRepository({
      client: mockClient,
      docClient: {},
    });

    await expect(
      repo.cancel({
        event_id: "evt-1",
        email: "test@example.com",
        status: "CONFIRMED",
      })
    ).rejects.toThrow("ProvisionedThroughputExceededException");
  });

  test("skips already cancelled registrations", async () => {
    const mockClient = { send: jest.fn() };

    const repo = new RegistrationRepository({
      client: mockClient,
      docClient: {},
    });

    await repo.cancel({
      event_id: "evt-1",
      email: "test@example.com",
      status: "CANCELLED",
    });

    // Should not call DynamoDB at all
    expect(mockClient.send).not.toHaveBeenCalled();
  });
});
