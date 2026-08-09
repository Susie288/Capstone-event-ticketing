/**
 * Business rules for listing events.
 */

const { Event } = require("../models/event");
const { EventRepository } = require("../repositories/eventRepository");

class EventService {
  /**
   * @param {Object} [options]
   * @param {Object} [options.repository] - EventRepository override (for testing).
   */
  constructor({ repository } = {}) {
    this.repository = repository || new EventRepository();
  }

  /**
   * Retrieve all events, sorted by date and time, with computed status.
   *
   * @returns {Promise<Object[]>}
   */
  async getEvents() {
    const items = await this.repository.listEvents();
    const events = items.map((item) => Event.fromItem(item));

    events.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
    });

    return events.map((event) => EventService._withCalculatedStatus(event));
  }

  /**
   * Compute a display status based on remaining seat availability.
   *
   * @param {Event} event
   * @returns {Object} - API-ready event object with computed status.
   */
  static _withCalculatedStatus(event) {
    const data = event.toApi();
    if (event.availableSeats === 0) {
      data.status = "SOLD_OUT";
    } else if (event.availableSeats <= Math.max(1, Math.floor(event.totalSeats / 10))) {
      data.status = "LIMITED";
    } else {
      data.status = "AVAILABLE";
    }
    return data;
  }
}

module.exports = { EventService };
