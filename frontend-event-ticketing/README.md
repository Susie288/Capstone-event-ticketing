# Event Registration & Ticketing System

A modern, single-page event registration and ticketing frontend built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and shadcn/ui-style components. Designed to connect to an AWS Serverless REST API (API Gateway + Lambda + DynamoDB).

## Design direction

The signature visual motif is the **ticket stub**: a dashed perforation with punched circular notches, reused across the hero illustration, event cards, and the post-registration confirmation ticket — tying the visual language directly back to what the product does. Typography pairs Space Grotesk (display) with Inter (body) and IBM Plex Mono for ticket IDs, dates, and seat codes, so anything ticket-like reads like a boarding pass. The palette is a deep ink-navy paired with a warm ticket-gold accent, with dedicated success/warning/destructive tokens for seat-status badges.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your API Gateway base URL
npm run dev
```

Open http://localhost:3000.

If `NEXT_PUBLIC_API_BASE_URL` is left unset, the app runs entirely on local mock data (see `lib/mock-data.ts`) so the UI is fully explorable before your AWS backend is wired up.

## Connecting to your AWS API

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to your API Gateway stage URL, then implement two endpoints (see `lib/api.ts` for the exact request/response shapes expected by the UI):

- `GET /events` — returns the list of events (id, name, description, date, time, venue, organizer, imageUrl, totalSeats, availableSeats, status).
- `POST /registrations` — body `{ eventId, fullName, email, phone }`, returns `{ registrationId, eventId, eventName, fullName, email, status, createdAt }`.

`status` should be one of `AVAILABLE`, `LIMITED`, or `SOLD_OUT` — the UI maps these to the green/amber/red badges.

## Project structure

```
app/                  App Router entry (layout, globals.css, page.tsx)
components/           Feature components (navbar, hero, forms, cards, modal, footer)
components/ui/        shadcn/ui-style primitives (button, card, dialog, select, etc.)
hooks/use-events.ts   Data-fetching hook for the events list
lib/api.ts            Axios client + AWS endpoint contract (with mock fallback)
lib/validations.ts    Zod schema for the registration form
types/index.ts        Shared TypeScript types
```

## Notes

- Form validation is handled with React Hook Form + Zod (required fields, email format, loading + disabled state while submitting).
- Toasts (success/error) use Sonner.
- Dark mode is powered by `next-themes` and toggles from the navbar; it respects system preference by default.
- All animation respects `prefers-reduced-motion`.
