# Studio 7 Miami — Photobooth Booking

Public booking flow for Studio 7 Miami photobooth rentals (Classic, Social, Luxe).

Intended live URL: `book.studio7.miami/photobooth`.

## Local

```sh
npm i
npm run dev
```

Opens at [http://localhost:8080](http://localhost:8080). Copy `.env.example` to `.env` and fill in Supabase, Stripe, and Google Calendar values. Keep the service-account JSON under `secrets/` (gitignored).

## Stack

TanStack Start, Stripe Custom Checkout, Supabase, Google Calendar (read occupancy).
