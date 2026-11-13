# Garage Fong website with online booking

Next.js 14 (App Router) + Tailwind + Supabase (Postgres + Auth), deployed on Vercel.

## What customers can do
- **Book an appointment** (`/book`): choose a service, see only genuinely free times, book instantly. Guests can book; accounts are optional.
- **Reserve parts for pickup** (`/shop`): basket, stock is reduced at once, pay at collection.
- **Account** (`/login`, `/account`): sign up, see bookings and orders, cancel upcoming appointments.

## What staff can do (`/admin`)
Confirm, complete or cancel appointments and orders (cancelling an order restocks it), add or hide services, add products, and change stock and prices.

## How double booking is prevented
Free times are computed in the database from opening hours, service duration and the number of bays (`settings.bays`). Booking runs in one locked transaction (`book_appointment`), so two people cannot take the last slot. Customers never see each other's data (row level security).

## Setup
1. `npm install`
2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor (re-running on an existing project: drop the old `bookings` table first).
3. Authentication > Users > add the owner. Then run: `insert into public.admin_emails values ('owner@example.com');`
4. Copy `.env.example` to `.env.local` with the project URL and anon key.
5. `npm run dev`. Log in at `/login`, then open `/admin`.

## Deploy
Push to GitHub, import at vercel.com/new, add the two env vars, deploy. In Supabase > Authentication > URL Configuration, add your Vercel URL as the Site URL.

## Confirm with the owner before launch
- Number of bays (default 2), service names and durations, opening hours: all placeholders from Google Maps and guesses.
- Starter products have no prices (shown as "Price confirmed on call").
- Add real photos, a logo, and his OK to quote the Google reviews.

## Easy next steps
Email or WhatsApp alerts for new bookings (Resend or a Supabase webhook), SMS reminders, online payment (Stripe is not available in Mauritius; use a local gateway such as MIPS or Juice).
