/**
 * Unit tests for services/registrationService.js
 */

// Mock the uuid module
jest.mock("uuid", () => ({ v4: () => "test-uuid-1234" }));

// Mock the config/dynamodb module so it doesn't try to connect
jest.mock("../config/dynamodb", () => ({
  dynamoDBClient: jest.fn(),
  dynamoDBDocumentClient: jest.fn(),
}));

const {
  RegistrationService,
  EventNotFoundError,
} = require("../services/registrationService");

describe("RegistrationService", () => {
  test("register publishes to SNS topic", async () => {
    const mockEventRepo = {
      getEvent: jest.fn().mockResolvedValue({ name: "Tech Conference 2026" }),
    };
    const mockRegRepo = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    const mockSns = {
      send: jest.fn().mockResolvedValue({}),
    };

    const service = new RegistrationService({
      eventRepository: mockEventRepo,
      registrationRepository: mockRegRepo,
      snsClient: mockSns,
    });
    service.topicArn = "arn:aws:sns:us-east-1:123456789012:test-topic";

    const result = await service.register({
      event_id: "evt-1",
      full_name: "John Doe",
      email: "john@example.com",
      phone: "0241234567",
    });

    expect(result.status).toBe("CONFIRMED");
    expect(result.registrationId).toBe("test-uuid-1234");

    // Should have called SNS send twice: once for subscribe, once for publish
    expect(mockSns.send).toHaveBeenCalledTimes(2);

    // First call should be the subscribe
    const subscribeCall = mockSns.send.mock.calls[0][0];
    expect(subscribeCall.input.TopicArn).toBe(
      "arn:aws:sns:us-east-1:123456789012:test-topic"
    );
    expect(subscribeCall.input.Protocol).toBe("email");
    expect(subscribeCall.input.Endpoint).toBe("john@example.com");

    // Second call should be the publish
    const publishCall = mockSns.send.mock.calls[1][0];
    expect(publishCall.input.TopicArn).toBe(
      "arn:aws:sns:us-east-1:123456789012:test-topic"
    );
    expect(publishCall.input.Subject).toContain("Tech Conference 2026");
  });

  test("register raises EventNotFoundError", async () => {
    const mockEventRepo = {
      getEvent: jest.fn().mockResolvedValue(null),
    };

    const service = new RegistrationService({
      eventRepository: mockEventRepo,
    });

    await expect(
      service.register({
        event_id: "invalid",
        full_name: "John",
        email: "john@example.com",
        phone: "0241234567",
      })
    ).rejects.toThrow(EventNotFoundError);
  });
});
