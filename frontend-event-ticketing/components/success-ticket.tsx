"use client";

import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistrationResponse } from "@/types";

interface SuccessTicketProps {
  data: RegistrationResponse;
  onRegisterAnother: () => void;
}

export function SuccessTicket({ data, onRegisterAnother }: SuccessTicketProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-card p-8 text-center shadow-xl"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success"
      >
        <CheckCircle2 className="h-9 w-9" />
      </motion.div>

      <h3 className="mt-5 font-display text-2xl font-semibold">Registration successful</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        You&apos;re confirmed. A copy of this ticket has been sent to your email address.
      </p>

      <div className="ticket-shape mx-auto mt-8 max-w-sm rounded-2xl border border-border bg-secondary/40 p-6 text-left animate-ticket-pop">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Registered for</p>
            <p className="font-display text-lg font-semibold leading-snug">{data.eventName}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <QrCode className="h-5 w-5" />
          </span>
        </div>

        <div className="ticket-perforation my-5" />

        <dl className="grid grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <dt className="text-muted-foreground">Registration ID</dt>
            <dd className="mt-1 font-semibold text-accent">{data.registrationId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="mt-1 font-semibold text-success">{data.status}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="mt-1 font-semibold text-foreground">{data.fullName}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-1 font-semibold text-foreground">{data.email}</dd>
          </div>
        </dl>
      </div>

      <Button variant="outline" size="lg" className="mt-8" onClick={onRegisterAnother}>
        <RotateCcw className="h-4 w-4" />
        Register another attendee
      </Button>
    </motion.div>
  );
}
