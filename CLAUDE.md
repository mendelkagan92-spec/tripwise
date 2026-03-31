# Tripwise — Master Build Plan

## App Overview

**Tripwise** is a full-stack, mobile-first vacation planning web app. It lets users plan trips with hour-by-hour itineraries, manage reservations, import bookings from spreadsheets, and — most importantly — forward confirmation emails to a unique per-trip email address that uses Claude AI to automatically parse and create reservations/events. It also includes community-driven place flags and tips, embedded Google Maps, and PWA support for mobile installation.

**Why:** Vacation planning is fragmented across emails, spreadsheets, and booking apps. Tripwise consolidates everything into one timeline with automated email parsing as the killer feature.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Database ORM | Prisma | 5.x |
| Database | PostgreSQL | 15+ |
| Auth | NextAuth.js | 4.x |
| AI Parsing | Anthropic Claude API (claude-sonnet-4-6) | latest SDK |
| Email Inbound | Postmark Inbound Webhooks | — |
| Email Outbound | Postmark Outbound | — |
| Spreadsheet Import | SheetJS (xlsx) | 0.20.x |
| Maps | Google Maps JavaScript API + Geocoding API | — |
| Fonts | Google Fonts (DM Sans, Fraunces) | — |
| Deployment | Vercel | — |

---

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime    @default(now())
  accounts      Account[]
  sessions      Session[]
  trips         Trip[]
  placeFlags    PlaceFlag[]
  placeTips     PlaceTip[]
  tipVotes      TipVote[]
}

model Trip {
  id           String        @id @default(cuid())
  userId       String
  name         String
  destination  String
  emoji        String        @default("✈️")
  startDate    DateTime
  endDate      DateTime
  createdAt    DateTime      @default(now())
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  events       Event[]
  reservations Reservation[]
  tripEmail    TripEmail?
  inboundEmails InboundEmail[]
}

model TripEmail {
  id        String   @id @default(cuid())
  tripId    String   @unique
  address   String   @unique
  createdAt DateTime @default(now())
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
}

model Event {
  id                 String       @id @default(cuid())
  tripId             String
  name               String
  type               EventType
  date               DateTime
  time               String?      // HH:MM format
  duration           String?      // e.g. "2h", "1h30m"
  location           String?
  lat                Float?
  lng                Float?
  confirmationNumber String?
  notes              String?      @db.Text
  createdAt          DateTime     @default(now())
  trip               Trip         @relation(fields: [tripId], references: [id], onDelete: Cascade)
  reservation        Reservation?
}

enum EventType {
  Flight
  Hotel
  Restaurant
  Attraction
  Transport
  Other
}

model Reservation {
  id           String            @id @default(cuid())
  tripId       String
  eventId      String            @unique
  status       ReservationStatus @default(Confirmed)
  rawEmailId   String?
  createdAt    DateTime          @default(now())
  trip         Trip              @relation(fields: [tripId], references: [id], onDelete: Cascade)
  event        Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  inboundEmail InboundEmail?     @relation(fields: [rawEmailId], references: [id])
}

enum ReservationStatus {
  Confirmed
  Pending
}

model InboundEmail {
  id           String        @id @default(cuid())
  tripId       String
  fromEmail    String
  subject      String
  bodyText     String        @db.Text
  parsedAt     DateTime?
  parseSuccess Boolean       @default(false)
  createdAt    DateTime      @default(now())
  trip         Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  reservations Reservation[]
}

model Place {
  id            String      @id @default(cuid())
  googlePlaceId String?     @unique
  name          String
  city          String
  lat           Float?
  lng           Float?
  createdAt     DateTime    @default(now())
  flags         PlaceFlag[]
  tips          PlaceTip[]

  @@unique([name, city])
}

model PlaceFlag {
  id        String   @id @default(cuid())
  placeId   String
  userId    String
  type      String   // "tourist_trap", "overpriced", "skip_it", "hidden_gem"
  note      String?
  createdAt DateTime @default(now())
  place     Place    @relation(fields: [placeId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PlaceTip {
  id        String    @id @default(cuid())
  placeId   String
  userId    String
  content   String
  createdAt DateTime  @default(now())
  place     Place     @relation(fields: [placeId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  votes     TipVote[]
}

model TipVote {
  id        String   @id @default(cuid())
  tipId     String
  userId    String
  createdAt DateTime @default(now())
  tip       PlaceTip @relation(fields: [tipId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tipId, userId])
}
```

### Schema Notes
- `Account`, `Session`, `VerificationToken` are required by NextAuth.js for the database adapter.
- `TipVote` is a join table enforcing one vote per user per tip (upvote system).
- `TripEmail.address` stores the full generated email address (e.g. `paris2025-abc123@trips.tripwise.app`).
- `Event.time` is stored as a string `HH:MM` for simplicity in display; `Event.date` is a `DateTime` used for date-level grouping.
- `Place` has a compound unique on `[name, city]` as a fallback when no Google Place ID is available.

---

## Features — Subtasks with Checkboxes

### 1. Project Setup & Database
- [ ] Initialize Next.js 14 with App Router + TypeScript
- [ ] Install and configure Tailwind CSS (dark theme)
- [ ] Install Prisma, configure PostgreSQL datasource
- [ ] Write full `schema.prisma` (all models above)
- [ ] Run `prisma migrate dev` to create tables
- [ ] Create `/lib/prisma.ts` singleton client
- [ ] Set up Google Fonts (DM Sans + Fraunces) in layout
- [ ] Create base layout with dark theme (`#0a0a0f` background)
- [ ] Create bottom navigation bar component (Home, Itinerary, Bookings, Map, Inbox)

### 2. Authentication (Google OAuth)
- [ ] Install `next-auth` and `@next-auth/prisma-adapter`
- [ ] Create `/app/api/auth/[...nextauth]/route.ts` with Google provider
- [ ] Configure Prisma adapter for NextAuth
- [ ] Create sign-in page (`/app/login/page.tsx`)
- [ ] Add session provider wrapper in root layout
- [ ] Protect routes — redirect unauthenticated users to login
- [ ] Display user avatar + name in header when logged in

### 3. Trips CRUD
- [ ] `POST /api/trips` — create trip (name, destination, emoji, startDate, endDate)
- [ ] `GET /api/trips` — list all trips for current user
- [ ] `PUT /api/trips/[id]` — update trip
- [ ] `DELETE /api/trips/[id]` — delete trip (cascade events, reservations, emails)
- [ ] Dashboard page (`/app/page.tsx`) showing trip cards
- [ ] Each card shows: emoji, destination, dates, countdown to departure
- [ ] Status badge: "Upcoming" or "Past" based on dates
- [ ] Create trip modal/form
- [ ] Edit trip modal/form
- [ ] Delete confirmation dialog

### 4. Events / Itinerary (Manual)
- [ ] `POST /api/events` — create event
- [ ] `GET /api/events?tripId=X` — list events for a trip
- [ ] `PUT /api/events/[id]` — update event
- [ ] `DELETE /api/events/[id]` — delete event
- [ ] Itinerary page (`/app/trips/[id]/itinerary/page.tsx`)
- [ ] Group events by date, sort by time within each day
- [ ] Hour-by-hour timeline view with event type icons
- [ ] Color-coded event type badges (Flight=blue, Hotel=purple, Restaurant=orange, Attraction=green, Transport=gray, Other=white)
- [ ] Add event form (all fields: name, type, date, time, duration, location, confirmation number, notes)
- [ ] Edit event inline or via modal
- [ ] Delete event with confirmation

### 5. Excel / CSV Import
- [ ] Install `xlsx` (SheetJS) library
- [ ] `POST /api/events/import` — receives parsed rows, creates events
- [ ] Import page/modal accessible from itinerary view
- [ ] File upload component (accepts `.xlsx`, `.csv`)
- [ ] Parse file client-side with SheetJS
- [ ] Auto-detect columns using fuzzy matching:
  - "Date", "date", "Day" → date
  - "Time", "time", "Start Time" → time
  - "Type", "Category" → type
  - "Name", "Activity", "Event", "Title" → name
  - "Location", "Place", "Address", "Where" → location
  - "Duration", "Length", "How Long" → duration
  - "Confirmation", "Conf #", "Booking Ref", "Reference" → confirmationNumber
  - "Notes", "Comments", "Details" → notes
- [ ] Column mapping preview screen (user can adjust detected mappings)
- [ ] Data preview table before import
- [ ] Import button that creates all events
- [ ] Success/error feedback
- [ ] Downloadable blank `.xlsx` template with correct headers

### 6. Reservations View
- [ ] `GET /api/reservations?tripId=X` — list reservations with event data
- [ ] Reservations page (`/app/trips/[id]/reservations/page.tsx`)
- [ ] Organized by category tabs/sections: Flights, Hotels, Restaurants, Activities
- [ ] Each card shows: name, date, time, confirmation number, status badge
- [ ] Status: Confirmed (green) / Pending (amber)
- [ ] Link to associated event in itinerary

### 7. Email Inbox + Claude Parsing (Core Feature)
- [ ] Install `@anthropic-ai/sdk`
- [ ] Create `/lib/anthropic.ts` — Claude client wrapper
- [ ] Install `postmark` SDK
- [ ] Create `/lib/postmark.ts` — Postmark client wrapper
- [ ] Generate unique email address on trip creation: `{slug}-{randomId}@trips.tripwise.app`
- [ ] `POST /api/inbound-email` — Postmark webhook endpoint
  - [ ] Verify webhook signature/token
  - [ ] Look up trip by recipient email address
  - [ ] Store raw email in `InboundEmail` table
  - [ ] Send email body to Claude API with extraction prompt
  - [ ] Parse Claude JSON response
  - [ ] Create `Event` + `Reservation` records from parsed data
  - [ ] Update `InboundEmail` with `parsedAt` + `parseSuccess`
- [ ] Inbox page (`/app/trips/[id]/inbox/page.tsx`)
  - [ ] List all inbound emails for the trip
  - [ ] Show sender, subject, date, "Parsed ✓" or "Failed ✗" badge
  - [ ] Click to expand and see parsed data
  - [ ] Manual re-parse button for failed emails
- [ ] Display trip email address prominently with copy button
- [ ] Claude system prompt: "You are a travel assistant. Extract structured reservation data from this confirmation email. Return JSON with fields: type (Flight/Hotel/Restaurant/Activity), name, date (YYYY-MM-DD), time (HH:MM), confirmation_number, location, duration, notes. If multiple reservations exist in one email, return an array."
- [ ] Handle known providers: Air France, Delta, United, Southwest, American, Marriott, Hilton, Airbnb, Booking.com, OpenTable, Resy, Viator, GetYourGuide

### 8. Google Maps
- [ ] `POST /api/geocode` — geocode a location string, cache result in Event (lat/lng)
- [ ] Map page (`/app/trips/[id]/map/page.tsx`)
- [ ] Embed Google Maps with `@react-google-maps/api` or `@vis.gl/react-google-maps`
- [ ] Plot pins for all events that have lat/lng
- [ ] Color-coded pins by event type (same color scheme as itinerary)
- [ ] Click pin to see event details in info window
- [ ] "Open in Google Maps" link for each event (uses `https://www.google.com/maps/search/?api=1&query=lat,lng`)
- [ ] Geocode locations on event creation/edit (if location provided and no lat/lng)
- [ ] Search/filter bar to filter visible pins by name or type
- [ ] Store coordinates in DB to avoid repeat geocoding

### 9. Community Place Flags & Tips
- [ ] `POST /api/places` — create or find a place
- [ ] `POST /api/places/[id]/flags` — flag a place (tourist_trap, overpriced, skip_it, hidden_gem)
- [ ] `GET /api/places/[id]/flags` — get flags for a place
- [ ] `POST /api/places/[id]/tips` — add a tip
- [ ] `GET /api/places/[id]/tips` — get tips sorted by vote count
- [ ] `POST /api/places/[id]/tips/[tipId]/vote` — upvote a tip (toggle)
- [ ] Community browse page (`/app/community/page.tsx`) — browse flagged places by city
- [ ] In itinerary view: show amber warning badge on events whose location matches a flagged place (e.g. "⚠️ 4 users flagged this as a tourist trap")
- [ ] Expandable tips section under each event/place
- [ ] Positive tip types: "locals love this", "book 2 weeks ahead", "go at sunset"

### 10. PWA
- [ ] Create `/public/manifest.json` with app name, icons, theme color, display: standalone
- [ ] Create app icons (192x192, 512x512) — simple generated icons
- [ ] Create service worker (`/public/sw.js`) with offline fallback
- [ ] Register service worker in root layout
- [ ] Create offline fallback page
- [ ] Add `<meta>` tags for iOS Safari (apple-mobile-web-app-capable, status-bar-style)
- [ ] Add splash screen images for iOS
- [ ] Test "Add to Home Screen" flow

### 11. Email Notifications
- [ ] Create `/lib/postmark.ts` outbound email function (if not already done)
- [ ] `POST /api/notifications/send` — internal endpoint to trigger notifications
- [ ] Day-before reminder: for each trip day, send email at 6pm the day before summarizing the next day's events
- [ ] Flight reminder: 3 hours before departure, send email with flight details
- [ ] Cron job or Vercel Cron to check for upcoming notifications
- [ ] Create `vercel.json` with cron configuration
- [ ] Email template: clean, simple HTML showing event details

---

## Build Order (Strict Sequence)

```
Phase 1: Foundation
  1. Project setup (Next.js, Tailwind, fonts, layout, nav)
  2. Prisma schema + database migration
     └─ No dependencies

Phase 2: Auth
  3. NextAuth + Google OAuth + Prisma adapter
     └─ Depends on: Phase 1 (schema must include Account/Session/User)

Phase 3: Core Data
  4. Trips CRUD + Dashboard
     └─ Depends on: Auth (trips belong to users)
  5. Events CRUD + Itinerary timeline
     └─ Depends on: Trips (events belong to trips)

Phase 4: Import
  6. Excel/CSV import with SheetJS
     └─ Depends on: Events (imports create events)

Phase 5: Reservations
  7. Reservations view
     └─ Depends on: Events (reservations link to events)

Phase 6: Email Intelligence
  8. Postmark inbound webhook + Claude parsing
     └─ Depends on: Events + Reservations (creates both)
     └─ Depends on: Trip email address generation

Phase 7: Maps
  9. Google Maps integration + geocoding
     └─ Depends on: Events (pins come from event locations)

Phase 8: Community
  10. Place flags + tips + upvotes
      └─ Depends on: Events + Maps (places linked to events)

Phase 9: PWA
  11. manifest.json + service worker + offline page
      └─ No hard dependencies, but best done after UI is stable

Phase 10: Notifications
  12. Email notifications via Postmark outbound + Vercel Cron
      └─ Depends on: Events (reads upcoming events)
      └─ Depends on: Postmark setup from Phase 6
```

---

## API Routes Summary

| Method | Route | Purpose |
|---|---|---|
| `*` | `/api/auth/[...nextauth]` | NextAuth handlers |
| `GET` | `/api/trips` | List user's trips |
| `POST` | `/api/trips` | Create trip |
| `PUT` | `/api/trips/[id]` | Update trip |
| `DELETE` | `/api/trips/[id]` | Delete trip |
| `GET` | `/api/events?tripId=X` | List events for a trip |
| `POST` | `/api/events` | Create event |
| `PUT` | `/api/events/[id]` | Update event |
| `DELETE` | `/api/events/[id]` | Delete event |
| `POST` | `/api/events/import` | Import events from spreadsheet |
| `GET` | `/api/events/template` | Download blank import template |
| `GET` | `/api/reservations?tripId=X` | List reservations for a trip |
| `POST` | `/api/inbound-email` | Postmark inbound webhook |
| `POST` | `/api/geocode` | Geocode a location string |
| `GET` | `/api/places?city=X` | List places by city |
| `POST` | `/api/places` | Create/find a place |
| `GET` | `/api/places/[id]/flags` | Get flags for a place |
| `POST` | `/api/places/[id]/flags` | Flag a place |
| `GET` | `/api/places/[id]/tips` | Get tips for a place |
| `POST` | `/api/places/[id]/tips` | Add a tip |
| `POST` | `/api/places/[id]/tips/[tipId]/vote` | Upvote/unvote a tip |
| `POST` | `/api/notifications/send` | Trigger notification check |

---

## API Integrations

### 1. Google OAuth (NextAuth)
- **Console:** https://console.cloud.google.com → APIs & Services → Credentials
- **Endpoints used:** Google's OAuth 2.0 (handled by NextAuth)
- **Env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 2. Anthropic Claude API
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-6`
- **Used for:** Parsing forwarded confirmation emails into structured reservation data
- **Env var:** `ANTHROPIC_API_KEY`

### 3. Postmark
- **Inbound:** Configure inbound webhook URL in Postmark → `https://tripwise.app/api/inbound-email`
- **Outbound:** Used for sending day-before and flight reminders
- **Env vars:** `POSTMARK_SERVER_TOKEN`, `POSTMARK_INBOUND_WEBHOOK_SECRET`
- **Domain:** `trips.tripwise.app` must be configured as inbound domain in Postmark

### 4. Google Maps JavaScript API + Geocoding API
- **Console:** https://console.cloud.google.com → APIs & Services → Enable Maps JS API + Geocoding API
- **Maps JS:** Embedded map with markers
- **Geocoding:** `https://maps.googleapis.com/maps/api/geocode/json?address=X&key=Y`
- **Env vars:** `GOOGLE_MAPS_API_KEY` (server-side geocoding), `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side maps)

---

## Environment Variables

| Variable | Purpose | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Your Postgres provider (Vercel Postgres, Supabase, Neon, etc.) |
| `NEXTAUTH_URL` | App base URL (e.g. `https://tripwise.app`) | Set manually; `http://localhost:3000` for dev |
| `NEXTAUTH_SECRET` | Session encryption secret | Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console → Credentials |
| `ANTHROPIC_API_KEY` | Claude API key for email parsing | https://console.anthropic.com |
| `POSTMARK_SERVER_TOKEN` | Postmark API token for sending/receiving email | https://account.postmarkapp.com → Servers |
| `POSTMARK_INBOUND_WEBHOOK_SECRET` | Secret to verify Postmark webhook requests | Postmark server settings → Inbound |
| `GOOGLE_MAPS_API_KEY` | Server-side Maps/Geocoding API key | Google Cloud Console → Credentials |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side Maps JS API key (exposed to browser) | Google Cloud Console → Credentials (can be same key, restricted to browser) |

---

## Folder Structure

```
/tripwise
├── CLAUDE.md
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── vercel.json                    # Cron config for notifications
├── prisma/
│   └── schema.prisma
├── public/
│   ├── manifest.json
│   ├── sw.js                      # Service worker
│   ├── icons/                     # PWA icons
│   └── template.xlsx              # Blank import template
├── app/
│   ├── layout.tsx                 # Root layout (fonts, theme, providers)
│   ├── page.tsx                   # Dashboard (trip list)
│   ├── login/
│   │   └── page.tsx               # Sign-in page
│   ├── community/
│   │   └── page.tsx               # Browse flagged places by city
│   ├── trips/
│   │   └── [id]/
│   │       ├── layout.tsx         # Trip layout with bottom nav
│   │       ├── page.tsx           # Trip overview (redirect to itinerary)
│   │       ├── itinerary/
│   │       │   └── page.tsx
│   │       ├── reservations/
│   │       │   └── page.tsx
│   │       ├── map/
│   │       │   └── page.tsx
│   │       └── inbox/
│   │           └── page.tsx
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       ├── trips/
│       │   ├── route.ts           # GET (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts       # PUT, DELETE
│       ├── events/
│       │   ├── route.ts           # GET, POST
│       │   ├── import/
│       │   │   └── route.ts       # POST (spreadsheet import)
│       │   ├── template/
│       │   │   └── route.ts       # GET (download template)
│       │   └── [id]/
│       │       └── route.ts       # PUT, DELETE
│       ├── reservations/
│       │   └── route.ts           # GET
│       ├── inbound-email/
│       │   └── route.ts           # POST (Postmark webhook)
│       ├── geocode/
│       │   └── route.ts           # POST
│       ├── places/
│       │   ├── route.ts           # GET, POST
│       │   └── [id]/
│       │       ├── flags/
│       │       │   └── route.ts   # GET, POST
│       │       └── tips/
│       │           ├── route.ts   # GET, POST
│       │           └── [tipId]/
│       │               └── vote/
│       │                   └── route.ts  # POST
│       └── notifications/
│           └── send/
│               └── route.ts       # POST (cron trigger)
├── components/
│   ├── BottomNav.tsx
│   ├── TripCard.tsx
│   ├── EventCard.tsx
│   ├── EventForm.tsx
│   ├── TimelineView.tsx
│   ├── ReservationCard.tsx
│   ├── ImportModal.tsx
│   ├── MapView.tsx
│   ├── InboxItem.tsx
│   ├── PlaceFlagBadge.tsx
│   ├── TipsList.tsx
│   ├── SessionProvider.tsx
│   └── ui/                        # Shared UI primitives (Button, Modal, Badge, etc.)
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       └── Input.tsx
└── lib/
    ├── prisma.ts                  # Prisma client singleton
    ├── anthropic.ts               # Claude API client + email parsing function
    ├── postmark.ts                # Postmark inbound verification + outbound send
    ├── geocode.ts                 # Google Geocoding helper
    ├── auth.ts                    # NextAuth config export for use in API routes
    ├── email-address.ts           # Trip email address generator
    └── column-matcher.ts          # Fuzzy column matching for spreadsheet import
```

---

## Design Tokens

| Token | Value |
|---|---|
| Background | `#0a0a0f` |
| Surface / Card | `#141419` |
| Border | `#1e1e26` |
| Text primary | `#f5f5f7` |
| Text secondary | `#8a8a9a` |
| Accent / Primary | `#6366f1` (indigo) |
| Success | `#22c55e` |
| Warning / Amber | `#f59e0b` |
| Error | `#ef4444` |
| Flight badge | `#3b82f6` (blue) |
| Hotel badge | `#a855f7` (purple) |
| Restaurant badge | `#f97316` (orange) |
| Attraction badge | `#22c55e` (green) |
| Transport badge | `#6b7280` (gray) |
| Heading font | Fraunces |
| Body font | DM Sans |

---

## Potential Blockers & Mitigations

| Blocker | Impact | Mitigation |
|---|---|---|
| **Postmark inbound domain setup** | Cannot receive emails without a verified inbound domain (`trips.tripwise.app`) | Set up domain DNS records (MX, DKIM) before Phase 6. For local dev, use Postmark's test webhook payloads |
| **Google OAuth redirect URIs** | Login fails if redirect URIs don't match | Configure both `http://localhost:3000` and production URL in Google Console |
| **Claude API rate limits** | Email parsing could fail under heavy load | Add retry logic with exponential backoff; queue emails if needed |
| **Google Maps API billing** | Geocoding costs money per request | Cache all geocoded coordinates in DB; only geocode once per location |
| **Large spreadsheet uploads** | SheetJS parsing could be slow on big files | Parse client-side to avoid server memory issues; limit to 500 rows per import |
| **Postmark webhook security** | Unauthorized requests could inject fake emails | Verify webhook signature using `POSTMARK_INBOUND_WEBHOOK_SECRET` |
| **PWA on iOS Safari** | iOS has limited PWA support (no push notifications, limited background sync) | Focus on "Add to Home Screen" + offline fallback; email notifications instead of push |
| **Vercel serverless function timeout** | Claude API calls during email parsing might be slow | Use streaming or increase function timeout to 30s in `vercel.json` |
| **PostgreSQL connection limits** | Serverless functions can exhaust DB connections | Use Prisma connection pooling; consider Prisma Accelerate or pgBouncer |
| **Email parsing accuracy** | Claude may mis-parse unusual email formats | Store raw email body; allow manual re-parse; show parsed preview before confirming |

---

## Vercel Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/notifications/send",
      "schedule": "0 * * * *"
    }
  ],
  "functions": {
    "app/api/inbound-email/route.ts": {
      "maxDuration": 30
    }
  }
}
```

---

**This plan is complete. No code will be written until this document is reviewed and approved.**
