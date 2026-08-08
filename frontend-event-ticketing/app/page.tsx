"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { RegistrationForm } from "@/components/registration-form";
import { SuccessTicket } from "@/components/success-ticket";
import { EventsSection } from "@/components/events-section";
import { EventModal } from "@/components/event-modal";
import { Footer } from "@/components/footer";
import { useEvents } from "@/hooks/use-events";
import { EventItem, RegistrationResponse } from "@/types";

export default function Home() {
  const { events, isLoading, error, refetch, updateEventSeats } = useEvents();

  const [presetEventId, setPresetEventId] = useState<string | undefined>(undefined);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);

  const [modalEvent, setModalEvent] = useState<EventItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const goToForm = (event: EventItem) => {
    setModalOpen(false);
    setPresetEventId(event.id);
    setRegistration(null);
    requestAnimationFrame(() => {
      document.querySelector("#register")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const openDetails = (event: EventItem) => {
    setModalEvent(event);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero events={events} />

        <section id="register" className="container py-20 md:py-28">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Step 1 of 1</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Event Registration
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Pick an event, add your details, and you&apos;re in. Your confirmation and
                registration ID are generated instantly — nothing to print beforehand.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Instant confirmation by email
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Live seat availability per event
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  No account or app required
                </li>
              </ul>
            </div>

            <div className="mx-auto w-full max-w-md">
              <AnimatePresence mode="wait">
                {registration ? (
                  <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SuccessTicket
                      data={registration}
                      onRegisterAnother={() => {
                        setRegistration(null);
                        setPresetEventId(undefined);
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <RegistrationForm
                      events={events}
                      isLoadingEvents={isLoading}
                      presetEventId={presetEventId}
                      onSuccess={(data) => {
                        updateEventSeats(data.eventId);
                        setRegistration(data);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <EventsSection
          events={events}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onViewDetails={openDetails}
          onRegister={goToForm}
        />
      </main>
      <Footer />

      <EventModal event={modalEvent} open={modalOpen} onOpenChange={setModalOpen} onRegister={goToForm} />
    </div>
  );
}
