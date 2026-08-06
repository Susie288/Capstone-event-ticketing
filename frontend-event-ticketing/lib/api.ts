import axios from "axios";
import { EventItem, RegistrationPayload, RegistrationResponse } from "@/types";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { generateRegistrationId } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * AWS Backend Integration:
 *
 * API Gateway + Lambda + DynamoDB
 *
 * GET  /events
 *
 * POST /registrations
 *
 * Frontend payload:
 * {
 *   eventId,
 *   fullName,
 *   email,
 *   phone
 * }
 *
 * Backend payload:
 * {
 *   event_id,
 *   fullName,
 *   email,
 *   phone
 * }
 *
 * Backend success response:
 * {
 *   registrationId,
 *   eventId,
 *   eventName,
 *   fullName,
 *   email,
 *   status,
 *   createdAt
 * }
 *
 * Backend error response example:
 * {
 *   message: "Email is already registered for this event."
 * }
 *
 * Until NEXT_PUBLIC_API_BASE_URL is configured,
 * frontend uses mock data for development.
 */


/**
 * Fetch all available events
 */
export async function fetchEvents(): Promise<EventItem[]> {
  if (!API_BASE_URL) {
    await simulateLatency();
    return MOCK_EVENTS;
  }

  try {
    const { data } = await apiClient.get<EventItem[]>("/events");

    return data;

  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Unable to load events.";

    throw new Error(message);
  }
}


/**
 * Register a user for an event
 */
export async function submitRegistration(
  payload: RegistrationPayload
): Promise<RegistrationResponse> {

  /**
   * Mock mode (when AWS API URL is not configured)
   */
  if (!API_BASE_URL) {
    await simulateLatency();

    const event = MOCK_EVENTS.find(
      (item) => item.id === payload.eventId
    );

    if (!event) {
      throw new Error("Selected event was not found.");
    }

    if (event.status === "SOLD_OUT") {
      throw new Error("This event is sold out.");
    }

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


  /**
   * AWS API Gateway + Lambda registration
   */
  try {
    const { data } = await apiClient.post<RegistrationResponse>(
      "/registrations",
      {
        eventId: payload.eventId,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
      }
    );

    return data;

  } catch (error: any) {

    /**
     * Extract backend error message
     *
     * Supports:
     * {
     *   message: "Email already registered"
     * }
     *
     * or:
     *
     * {
     *   error: "Email already registered"
     * }
     */
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Registration failed. Please try again.";

    throw new Error(message);
  }
}


/**
 * Simulates network delay when running frontend without AWS backend.
 */
function simulateLatency() {
  return new Promise((resolve) =>
    setTimeout(
      resolve,
      700 + Math.random() * 500
    )
  );
}