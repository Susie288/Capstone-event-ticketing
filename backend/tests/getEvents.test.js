/**
 * Unit tests for functions/getEvents/index.js
 */

jest.mock("../services/eventService");
const { EventService } = require("../services/eventService");
const { handler } = require("../functions/getEvents/index");

describe("GetEvents Handler", () => {
  test("returns 200 and events array on success", async () => {
    const mockEvents = [
      { id: "evt-1", name: "AWS Community Day", status: "AVAILABLE" },
    ];
    EventService.prototype.getEvents = jest.fn().mockResolvedValue(mockEvents);

    const event = { httpMethod: "GET" };
    const context = { awsRequestId: "test-req-id" };

    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockEvents);
  });

  test("handles missing context gracefully", async () => {
    const mockEvents = [];
    EventService.prototype.getEvents = jest.fn().mockResolvedValue(mockEvents);

    const event = { httpMethod: "GET" };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual([]);
  });

  test("returns 204 on OPTIONS request", async () => {
    const event = { httpMethod: "OPTIONS" };
    const result = await handler(event, {});
    expect(result.statusCode).toBe(204);
  });

  test("returns 500 when service throws an error", async () => {
    EventService.prototype.getEvents = jest
      .fn()
      .mockRejectedValue(new Error("DynamoDB error"));

    const event = { httpMethod: "GET" };
    const context = { awsRequestId: "test-req-id" };

    const result = await handler(event, context);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Unable to retrieve events.");
    expect(body.code).toBe("INTERNAL_ERROR");
  });
});
