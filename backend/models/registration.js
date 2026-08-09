/**
 * Registration mapping utilities.
 */

class Registration {
  /**
   * @param {Object} props
   * @param {string} props.registrationId
   * @param {string} props.eventId
   * @param {string} props.eventName
   * @param {string} props.fullName
   * @param {string} props.email
   * @param {string} props.phone
   * @param {string} props.status
   * @param {string} props.createdAt
   */
  constructor({ registrationId, eventId, eventName, fullName, email, phone, status, createdAt }) {
    this.registrationId = registrationId;
    this.eventId = eventId;
    this.eventName = eventName;
    this.fullName = fullName;
    this.email = email;
    this.phone = phone;
    this.status = status;
    this.createdAt = createdAt;
  }

  /**
   * Convert to a camelCase API response object.
   *
   * @returns {Object}
   */
  toApi() {
    return {
      registrationId: this.registrationId,
      eventId: this.eventId,
      eventName: this.eventName,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  /**
   * Create a Registration from a DynamoDB item.
   *
   * @param {Object} item - Raw DynamoDB item.
   * @returns {Registration}
   */
  static fromItem(item) {
    const requiredFields = [
      "registration_id", "event_id", "event_name", "full_name",
      "email", "status", "created_at",
    ];
    const missing = requiredFields.filter(
      (f) => item[f] === undefined || item[f] === null
    );
    if (missing.length > 0) {
      throw new Error(`Missing required registration fields: ${missing.join(", ")}`);
    }
    return new Registration({
      registrationId: String(item.registration_id),
      eventId: String(item.event_id),
      eventName: String(item.event_name),
      fullName: String(item.full_name),
      email: String(item.email),
      phone: String(item.phone || ""),
      status: String(item.status),
      createdAt: String(item.created_at),
    });
  }

  /**
   * Convert to a snake_case DynamoDB item.
   *
   * @returns {Object}
   */
  toDynamoItem() {
    return {
      registration_id: this.registrationId,
      event_id: this.eventId,
      event_name: this.eventName,
      full_name: this.fullName,
      email: this.email,
      phone: this.phone,
      status: this.status,
      created_at: this.createdAt,
    };
  }
}

module.exports = { Registration };
