export type EventStatus = "AVAILABLE" | "LIMITED" | "SOLD_OUT";

export interface EventItem {
  id: string;
  name: string;
  description: string;
  date: string; // ISO date, e.g. 2026-09-12
  time: string; // "HH:mm"
  venue: string;
  organizer: string;
  imageUrl?: string;
  totalSeats: number;
  availableSeats: number;
  status: EventStatus;
}

export interface RegistrationPayload {
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface RegistrationResponse {
  registrationId: string;
  eventId: string;
  eventName: string;
  fullName: string;
  email: string;
  status: "CONFIRMED";
  createdAt: string;
}
