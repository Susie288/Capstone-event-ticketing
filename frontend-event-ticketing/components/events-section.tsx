"use client";

import { motion } from "framer-motion";
import { AlertCircle, CalendarX2 } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventItem } from "@/types";

interface EventsSectionProps {
  events: EventItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewDetails: (event: EventItem) => void;
  onRegister: (event: EventItem) => void;
}

export function EventsSection({ events, isLoading, error, onRetry, onViewDetails, onRegister }: EventsSectionProps) {
  return (
    <section id="events" className="container py-20 md:py-28">
      <div className="mx-auto mb-12 max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">What&apos;s on</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Available Events</h2>
        <p className="mt-3 text-muted-foreground">
          Everything currently open for registration. Seats update in real time.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-2xl border border-border p-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium text-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border p-10 text-center">
          <CalendarX2 className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No events are open for registration right now.</p>
          <p className="text-sm text-muted-foreground">Check back soon — new events are added regularly.</p>
        </div>
      )}

      {!isLoading && !error && events.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <EventCard event={event} onViewDetails={onViewDetails} onRegister={onRegister} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
