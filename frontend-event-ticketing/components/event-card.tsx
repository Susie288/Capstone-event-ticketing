"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventItem } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

const STATUS_META: Record<EventItem["status"], { label: string; variant: "success" | "warning" | "destructive" }> = {
  AVAILABLE: { label: "Available", variant: "success" },
  LIMITED: { label: "Limited", variant: "warning" },
  SOLD_OUT: { label: "Sold Out", variant: "destructive" },
};

interface EventCardProps {
  event: EventItem;
  onViewDetails: (event: EventItem) => void;
  onRegister: (event: EventItem) => void;
}

export function EventCard({ event, onViewDetails, onRegister }: EventCardProps) {
  const status = STATUS_META[event.status];
  const soldOut = event.status === "SOLD_OUT";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="h-full"
    >
      <Card className="group flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
        <div className="relative h-44 w-full overflow-hidden bg-secondary">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <Badge variant={status.variant} className="absolute right-3 top-3 shadow-sm">
            {status.label}
          </Badge>
        </div>

        <CardContent className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-semibold leading-snug">{event.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>

          <div className="mt-4 space-y-2 text-sm">
            <InfoRow icon={<CalendarDays className="h-4 w-4" />} text={formatDate(event.date)} />
            <InfoRow icon={<Clock className="h-4 w-4" />} text={formatTime(event.time)} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} text={event.venue} />
            <InfoRow
              icon={<Users className="h-4 w-4" />}
              text={soldOut ? "No seats remaining" : `${event.availableSeats} seats left`}
            />
          </div>

          <div className="mt-5 flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(event)}>
              View Details
            </Button>
            <Button
              variant="accent"
              size="sm"
              className="flex-1"
              disabled={soldOut}
              onClick={() => onRegister(event)}
            >
              {soldOut ? "Sold Out" : "Register"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="text-foreground/90">{text}</span>
    </div>
  );
}
