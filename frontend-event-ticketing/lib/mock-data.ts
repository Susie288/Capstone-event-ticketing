import { EventItem } from "@/types";

// Used only as an offline fallback so the UI is fully explorable before the
// AWS API Gateway endpoint is wired up. lib/api.ts always tries the real API first.
export const MOCK_EVENTS: EventItem[] = [
  {
    id: "evt_001",
    name: "CloudForward Summit",
    description:
      "A day of deep-dive sessions on serverless architecture, cost optimization, and platform engineering with practitioners from across the region.",
    date: "2026-09-12",
    time: "09:00",
    venue: "Accra International Conference Centre",
    organizer: "CloudForward Community",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
    totalSeats: 300,
    availableSeats: 128,
    status: "AVAILABLE",
  },
  {
    id: "evt_002",
    name: "Product Design Intensive",
    description:
      "Hands-on workshop covering design systems, interaction patterns, and portfolio critique with senior product designers.",
    date: "2026-09-20",
    time: "10:30",
    venue: "Kempinski Hotel, Gold Coast City",
    organizer: "DesignHouse Studio",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
    totalSeats: 80,
    availableSeats: 14,
    status: "LIMITED",
  },
  {
    id: "evt_003",
    name: "Founders & Funding Night",
    description:
      "An evening of pitch sessions and investor conversations for early-stage founders building across fintech, health, and logistics.",
    date: "2026-08-29",
    time: "17:30",
    venue: "The Alisa Hotel Rooftop",
    organizer: "Venture Circle",
    imageUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
    totalSeats: 150,
    availableSeats: 0,
    status: "SOLD_OUT",
  },
  {
    id: "evt_004",
    name: "Data Engineering Bootcamp",
    description:
      "Three intensive tracks on pipeline design, warehouse modeling, and real-time streaming, capped with a group capstone.",
    date: "2026-10-04",
    time: "08:30",
    venue: "Ashesi University Conference Hall",
    organizer: "DataStack Africa",
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    totalSeats: 120,
    availableSeats: 67,
    status: "AVAILABLE",
  },
];
