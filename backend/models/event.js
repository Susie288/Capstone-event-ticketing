/**
 * Event mapping utilities.
 */

class Event {
  /**
   * @param {Object} props
   * @param {string} props.id
   * @param {string} props.name
   * @param {string} props.description
   * @param {string} props.date
   * @param {string} props.time
   * @param {string} props.venue
   * @param {string} props.organizer
   * @param {number} props.totalSeats
   * @param {number} props.availableSeats
   * @param {string} props.status
   * @param {string|null} [props.imageUrl]
   */
  constructor({ id, name, description, date, time, venue, organizer, totalSeats, availableSeats, status, imageUrl }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.date = date;
    this.time = time;
    this.venue = venue;
    this.organizer = organizer;
    this.totalSeats = totalSeats;
    this.availableSeats = availableSeats;
    this.status = status;
    this.imageUrl = imageUrl || null;
  }

  /**
   * Create an Event from a DynamoDB item.
   *
   * @param {Object} item - Raw DynamoDB item.
   * @returns {Event}
   */
  static fromItem(item) {
    return new Event({
      id: item.event_id,
      name: item.name,
      description: item.description || "",
      date: item.date || "",
      time: item.time || "",
      venue: item.venue || "",
      organizer: item.organizer || "",
      totalSeats: parseInt(item.total_seats || "0", 10),
      availableSeats: parseInt(item.available_seats || "0", 10),
      status: item.status || "AVAILABLE",
      imageUrl: item.image_url || null,
    });
  }

  /**
   * Convert to a camelCase API response object.
   *
   * @returns {Object}
   */
  toApi() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      date: this.date,
      time: this.time,
      venue: this.venue,
      organizer: this.organizer,
      imageUrl: this.imageUrl,
      totalSeats: this.totalSeats,
      availableSeats: this.availableSeats,
      status: this.status,
    };
  }
}

module.exports = { Event };
