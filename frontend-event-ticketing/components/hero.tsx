"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventItem } from "@/types";

function scrollTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
}

interface HeroProps {
  events?: EventItem[];
}

export function Hero({ events = [] }: HeroProps) {
  const liveEventsCount = events.length > 0 ? events.length : 4;
  const reservedSeats = events.length > 0
    ? events.reduce((sum, e) => sum + Math.max(0, e.totalSeats - e.availableSeats), 0)
    : 600;
  const seatsDisplay = events.length > 0 ? `${reservedSeats}` : "600+";

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_10%,transparent_70%)]" />
      <div className="absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-accent/20 blur-[110px]" />
      <div className="absolute top-40 left-[-10%] h-72 w-72 rounded-full bg-primary/20 blur-[110px]" />

      <div className="container relative flex flex-col items-center gap-14 py-20 md:flex-row md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 text-center md:text-left"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Live registrations, instant confirmation
          </div>

          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Event Registration
            <br />
            <span className="text-shimmer">&amp; Ticketing System</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:mx-0 md:text-lg">
            Browse upcoming events, reserve a seat, and receive your ticket in
            under a minute — no printing, no queueing, no spreadsheets.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <Button size="lg" variant="accent" onClick={() => scrollTo("#register")} className="group w-full sm:w-auto">
              Register Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("#events")} className="w-full sm:w-auto">
              Browse Events
            </Button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-8 md:justify-start">
            <Stat value={String(liveEventsCount)} label="Live events" />
            <Stat value={seatsDisplay} label="Seats reserved" />
            <Stat value="< 60s" label="To register" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative flex-1"
        >
          <TicketIllustration />
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="font-mono text-xl font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function TicketIllustration() {
  return (
    <div className="relative mx-auto max-w-sm animate-float-slow">
      <div className="ticket-shape rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Admit One</p>
            <p className="font-display text-lg font-semibold">CloudForward Summit</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
            <QrCode className="h-5 w-5" />
          </span>
        </div>

        <div className="my-5 ticket-perforation" />

        <div className="grid grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="mt-1 font-semibold text-foreground">Sep 12, 2026</p>
          </div>
          <div>
            <p className="text-muted-foreground">Time</p>
            <p className="mt-1 font-semibold text-foreground">09:00 AM</p>
          </div>
          <div>
            <p className="text-muted-foreground">Seat</p>
            <p className="mt-1 font-semibold text-foreground">GA-128</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ref</p>
            <p className="mt-1 font-semibold text-accent">EVT-26-A93F1</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -left-6 hidden rotate-[-8deg] rounded-2xl border border-border bg-card px-4 py-3 shadow-xl sm:block">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
        <p className="text-sm font-semibold text-success">Confirmed</p>
      </div>
    </div>
  );
}
