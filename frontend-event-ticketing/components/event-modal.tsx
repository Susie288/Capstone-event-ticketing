"use client";

import Image from "next/image";
import { CalendarDays, Clock, MapPin, User, Users, CalendarRange } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EventItem } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_META: Record<EventItem["status"], { label: string; variant: "success" | "warning" | "destructive" }> = {
  AVAILABLE: { label: "Available", variant: "success" },
  LIMITED: { label: "Limited", variant: "warning" },
  SOLD_OUT: { label: "Sold Out", variant: "destructive" },
};

interface EventModalProps {
  event: EventItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (event: EventItem) => void;
}

export function EventModal({ event, open, onOpenChange, onRegister }: EventModalProps) {
  if (!event) return null;
  const status = STATUS_META[event.status];
  const soldOut = event.status === "SOLD_OUT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <div className="relative h-52 w-full overflow-hidden rounded-t-2xl bg-secondary">
          {event.imageUrl ? (
            <Image src={event.imageUrl} alt={event.name} fill sizes="600px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <Badge variant={status.variant} className="absolute right-4 top-4 shadow-sm">
            {status.label}
          </Badge>
        </div>

        <div className="px-6 pb-6">
          <h2 className="font-display text-2xl font-semibold leading-tight">{event.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{event.description}</p>

          <Separator className="my-5" />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Date" value={formatDate(event.date)} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={formatTime(event.time)} />
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Venue" value={event.venue} />
            <DetailRow icon={<User className="h-4 w-4" />} label="Organizer" value={event.organizer} />
            <DetailRow
              icon={<Users className="h-4 w-4" />}
              label="Remaining seats"
              value={soldOut ? "0 of " + event.totalSeats : `${event.availableSeats} of ${event.totalSeats}`}
            />
            <DetailRow icon={<CalendarRange className="h-4 w-4" />} label="Status" value={status.label} />
          </dl>

          <Button
            variant="accent"
            size="lg"
            className="mt-7 w-full"
            disabled={soldOut}
            onClick={() => onRegister(event)}
          >
            {soldOut ? "Sold Out" : "Register for this event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
