"use client";

import { useCallback, useEffect, useState } from "react";
import { EventItem } from "@/types";
import { fetchEvents } from "@/lib/api";
import { calculateEventStatus } from "@/lib/utils";

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError("We couldn't load events right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Optimistically decrement available seats for a given event after registration. */
  const updateEventSeats = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        const newAvailable = Math.max(0, event.availableSeats - 1);
        const status = calculateEventStatus(newAvailable, event.totalSeats);
        return { ...event, availableSeats: newAvailable, status };
      })
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { events, isLoading, error, refetch: load, updateEventSeats };
}
