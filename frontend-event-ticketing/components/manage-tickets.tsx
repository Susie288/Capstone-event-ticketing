"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Ticket, Loader2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RegistrationResponse } from "@/types";
import { fetchRegistrations, cancelRegistration } from "@/lib/api";

interface ManageTicketsProps {
  onTicketCancelled?: () => void;
}

export function ManageTickets({ onTicketCancelled }: ManageTicketsProps) {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await fetchRegistrations(email.trim());
      setRegistrations(data);
      setSearchedEmail(email.trim());
    } catch (err: any) {
      setError(err.message || "Failed to find registrations.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      await cancelRegistration(id);
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.registrationId === id ? { ...reg, status: "CANCELLED" } : reg
        )
      );
      setSuccessMessage("Registration successfully cancelled. Seats have been restored.");
      if (onTicketCancelled) {
        onTicketCancelled();
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel registration.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
      <div className="max-w-xl">
        <div className="flex items-center gap-2 text-accent">
          <Ticket className="h-5 w-5" />
          <h3 className="font-display text-xl font-semibold text-foreground">Look up your tickets</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email address you used during registration to view or cancel existing bookings.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Input
            type="email"
            placeholder="Enter your registered email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pr-10"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Find Bookings
            </>
          )}
        </Button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3.5 text-xs text-success">
          <RefreshCw className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {searchedEmail && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 space-y-4"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Results for <span className="text-foreground">{searchedEmail}</span> ({registrations.length})
            </h4>

            {registrations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Ticket className="mx-auto h-8 w-8 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-medium">No registrations found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  We couldn&apos;t find any bookings matching this email.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {registrations.map((reg) => (
                  <div
                    key={reg.registrationId}
                    className="relative flex flex-col justify-between rounded-xl border border-border bg-secondary/30 p-5 transition-all hover:border-border/80"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            ID: {reg.registrationId}
                          </span>
                          <h5 className="font-display font-semibold leading-tight">{reg.eventName}</h5>
                        </div>
                        <Badge
                          variant={reg.status === "CONFIRMED" ? "default" : "destructive"}
                          className="shrink-0"
                        >
                          {reg.status}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
                        <p><span className="text-foreground/70">Name:</span> {reg.fullName}</p>
                        <p><span className="text-foreground/70">Email:</span> {reg.email}</p>
                        <p><span className="text-foreground/70">Booked:</span> {new Date(reg.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-border/50 pt-4">
                      {reg.status === "CONFIRMED" ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          disabled={cancellingId === reg.registrationId}
                          onClick={() => handleCancel(reg.registrationId)}
                        >
                          {cancellingId === reg.registrationId ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel Registration
                            </>
                          )}
                        </Button>
                      ) : (
                        <p className="text-center text-xs italic text-muted-foreground">
                          This booking was cancelled.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
