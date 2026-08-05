import axios from "axios";
import { EventItem, RegistrationPayload, RegistrationResponse } from "@/types";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { generateRegistrationId } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Wire-up notes for the AWS side (API Gateway + Lambda + DynamoDB):
 *  GET  /events            -> list events (id, name, description, date, time,
 *                              venue, organizer, imageUrl, totalSeats, availableSeats, status)
 *  POST /registrations     -> body: { eventId, fullName, email, phone }
 *                              returns: { registrationId, eventId, eventName, fullName, email, status, createdAt }
 *
 * Until NEXT_PUBLIC_API_BASE_URL is set, calls fall back to local mock data so
 * the interface stays fully usable during frontend development.
 */

export async function fetchEvents(): Promise<EventItem[]> {
  if (!API_BASE_URL) {
    await simulateLatency();
    return MOCK_EVENTS;
  }
  const { data } = await apiClient.get<EventItem[]>("/events");
  return data;
}

export async function submitRegistration(
  payload: RegistrationPayload
): Promise<RegistrationResponse> {
  if (!API_BASE_URL) {
    await simulateLatency();
    const event = MOCK_EVENTS.find((e) => e.id === payload.eventId);
    if (!event) throw new Error("Selected event was not found.");
    if (event.status === "SOLD_OUT") throw new Error("This event is sold out.");
    return {
      registrationId: generateRegistrationId(),
      eventId: event.id,
      eventName: event.name,
      fullName: payload.fullName,
      email: payload.email,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };
  }
  const { data } = await apiClient.post<RegistrationResponse>("/registrations", payload);
  return data;
}

function simulateLatency() {
  return new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));
}
