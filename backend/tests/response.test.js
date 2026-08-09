/**
 * Unit tests for shared/response.js
 */

const { success, error, optionsResponse } = require("../shared/response");

describe("success", () => {
  test("success response is API Gateway compatible", () => {
    const response = success({ ok: true });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true });
    expect(response.headers["Content-Type"]).toBe("application/json");
  });

  test("success with custom status code", () => {
    const response = success({ id: "123" }, 201);
    expect(response.statusCode).toBe(201);
  });
});

describe("error", () => {
  test("error response includes message and code", () => {
    const response = error("Not found", 404, "NOT_FOUND");
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Not found");
    expect(body.code).toBe("NOT_FOUND");
  });

  test("error response without code", () => {
    const response = error("Bad request", 400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Bad request");
    expect(body.code).toBeUndefined();
  });
});

describe("optionsResponse", () => {
  test("returns 204 with CORS headers", () => {
    const response = optionsResponse();
    expect(response.statusCode).toBe(204);
    expect(response.headers["Access-Control-Allow-Methods"]).toBe(
      "GET,POST,DELETE,OPTIONS"
    );
  });
});
