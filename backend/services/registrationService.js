/**
 * Business rules for event registrations.
 */

const { v4: uuidv4 } = require("uuid");
const { SNSClient, PublishCommand, SubscribeCommand } = require("@aws-sdk/client-sns");
const { REGISTRATION_TOPIC_ARN } = require("../config/environment");
const { Registration } = require("../models/registration");
const { EventRepository } = require("../repositories/eventRepository");
const {
  RegistrationRepository,
  RegistrationNotFoundError,
} = require("../repositories/registrationRepository");
const { log } = require("../shared/logger");

class EventNotFoundError extends Error {
  constructor(message = "The selected event was not found.") {
    super(message);
    this.name = "EventNotFoundError";
  }
}

class RegistrationService {
  /**
   * @param {Object} [options]
   * @param {Object} [options.eventRepository]        - EventRepository override.
   * @param {Object} [options.registrationRepository]  - RegistrationRepository override.
   * @param {Object} [options.snsClient]               - SNS client override (for testing).
   */
  constructor({ eventRepository, registrationRepository, snsClient } = {}) {
    this.events = eventRepository || new EventRepository();
    this.registrations = registrationRepository || new RegistrationRepository();
    this.sns = snsClient || null;
    this.topicArn = REGISTRATION_TOPIC_ARN;
  }

  /**
   * Register an attendee for an event.
   *
   * @param {{ event_id: string, full_name: string, email: string, phone: string }} data
   * @returns {Promise<Object>} - API-formatted registration object.
   */
  async register(data) {
    const event = await this.events.getEvent(data.event_id);
    if (!event) {
      throw new EventNotFoundError();
    }

    const registration = new Registration({
      registrationId: uuidv4(),
      eventId: data.event_id,
      eventName: event.name,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    });

    await this.registrations.create(registration.toDynamoItem());
    await this._notifySns(registration, event.name);
    return registration.toApi();
  }

  /**
   * Send SNS notification after successful registration.
   *
   * @param {Registration} registration
   * @param {string}       eventName
   */
  async _notifySns(registration, eventName) {
    if (!this.topicArn) {
      log("info", "sns_publish_skipped", { reason: "REGISTRATION_TOPIC_ARN not set" });
      return;
    }
    try {
      if (!this.sns) {
        this.sns = new SNSClient({});
      }

      // Subscribe attendee's email to the SNS topic for email notification & subscription confirmation
      if (registration.email) {
        try {
          await this.sns.send(
            new SubscribeCommand({
              TopicArn: this.topicArn,
              Protocol: "email",
              Endpoint: registration.email,
            })
          );
          log("info", "sns_subscribed", {
            email: registration.email,
            registration_id: registration.registrationId,
          });
        } catch (subErr) {
          log("warning", "sns_subscribe_failed", {
            error: String(subErr),
            email: registration.email,
          });
        }
      }

      const message =
        `New Event Registration Confirmed!\n\n` +
        `Event Name: ${eventName}\n` +
        `Registration ID: ${registration.registrationId}\n` +
        `Attendee Name: ${registration.fullName}\n` +
        `Attendee Email: ${registration.email}\n` +
        `Attendee Phone: ${registration.phone || "N/A"}\n` +
        `Registered At: ${registration.createdAt}\n`;

      await this.sns.send(
        new PublishCommand({
          TopicArn: this.topicArn,
          Subject: `Registration Confirmed: ${eventName}`,
          Message: message,
        })
      );
      log("info", "sns_published", { registration_id: registration.registrationId });
    } catch (err) {
      log("error", "sns_publish_failed", {
        error: String(err),
        registration_id: registration.registrationId,
      });
    }
  }

  /**
   * List registrations for a given email.
   *
   * @param {string} email
   * @returns {Promise<Object[]>}
   */
  async registrationsForEmail(email) {
    const items = await this.registrations.listByEmail(email.toLowerCase());
    return items.map((item) => Registration.fromItem(item).toApi());
  }

  /**
   * Cancel a registration by its registration ID.
   *
   * @param {string} registrationId
   * @returns {Promise<Object>}
   */
  async cancel(registrationId) {
    const registration = await this.registrations.getByRegistrationId(registrationId);
    if (!registration) {
      throw new RegistrationNotFoundError("Registration was not found.");
    }
    await this.registrations.cancel(registration);
    return {
      registrationId,
      status: "CANCELLED",
      message: "Registration cancelled successfully.",
    };
  }
}

module.exports = { RegistrationService, EventNotFoundError };
