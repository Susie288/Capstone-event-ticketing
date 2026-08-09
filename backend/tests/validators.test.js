/**
 * Unit tests for shared/validators.js
 */

const {
  ValidationError,
  validateRegistration,
  parseJsonBody,
  stripHtmlTags,
  sanitizeString,
} = require("../shared/validators");

describe("validateRegistration", () => {
  test("normalizes valid registration", () => {
    const data = validateRegistration({
      eventId: "evt-001",
      fullName: "Ada Lovelace",
      email: "ADA@EXAMPLE.COM",
      phone: "0241234567",
    });
    expect(data.email).toBe("ada@example.com");
    expect(data.phone).toBe("0241234567");
    expect(data.event_id).toBe("evt-001");
    expect(data.full_name).toBe("Ada Lovelace");
  });

  test("rejects invalid email", () => {
    expect(() =>
      validateRegistration({
        eventId: "evt-001",
        fullName: "Ada Lovelace",
        email: "invalid",
        phone: "0241234567",
      })
    ).toThrow(ValidationError);
  });

  test("rejects missing phone", () => {
    expect(() =>
      validateRegistration({
        eventId: "evt-001",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
      })
    ).toThrow(ValidationError);
  });

  test("rejects invalid phone digits (too short)", () => {
    expect(() =>
      validateRegistration({
        eventId: "evt-001",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "12345",
      })
    ).toThrow(ValidationError);
  });

  test("rejects invalid phone digits (too long)", () => {
    expect(() =>
      validateRegistration({
        eventId: "evt-001",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "024123456789",
      })
    ).toThrow(ValidationError);
  });

  test("rejects phone with dashes", () => {
    expect(() =>
      validateRegistration({
        eventId: "evt-001",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "024-123-456",
      })
    ).toThrow(ValidationError);
  });
});

describe("parseJsonBody", () => {
  test("parses valid JSON body", () => {
    const event = { body: '{"key": "value"}' };
    expect(parseJsonBody(event)).toEqual({ key: "value" });
  });

  test("throws on missing body", () => {
    expect(() => parseJsonBody({})).toThrow(ValidationError);
  });

  test("decodes base64 body", () => {
    const body = Buffer.from('{"ok": true}').toString("base64");
    const event = { body, isBase64Encoded: true };
    expect(parseJsonBody(event)).toEqual({ ok: true });
  });
});

describe("stripHtmlTags", () => {
  test("removes HTML tags", () => {
    expect(stripHtmlTags("<script>alert('xss')</script>Hello")).toBe(
      "alert('xss')Hello"
    );
  });
});

describe("sanitizeString", () => {
  test("throws on exceeding max length", () => {
    expect(() => sanitizeString("a".repeat(100), 50)).toThrow(ValidationError);
  });
});
