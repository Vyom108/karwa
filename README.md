# Karwa Tours & Travels

The customer-facing website for Karwa Tours & Travels in Diu, Gujarat. Visitors can explore listed services, vehicles, and nearby places, then prepare a booking request for WhatsApp.

Website: [karwatours.com](https://karwatours.com/)

## Booking and data

- Booking requests are sent by the customer through WhatsApp after reviewing the prefilled message.
- The website does not create customer accounts, accept website reviews, store booking data, or call Supabase.
- A request is not a confirmed reservation. Karwa confirms availability and the final price directly.
- Bike rental is listed at ₹700 for 12 hours; scooty rental is listed at ₹600 for 12 hours. Other prices are confirmed by Karwa.
- Vehicle images are illustrative concepts and do not identify a specific Karwa vehicle.

The prior Supabase implementation and setup notes are retained under `legacy/` and `supabase/` as historical project material. They are not part of the live customer-facing application. The associated Supabase project has been paused; its data has not been deleted.

## Technology

- React 19, TypeScript, Vite, and Tailwind CSS 4.
- Local images and fonts under `public/assets/` and Fontsource packages.
- Hosted on Vercel; the intended production branch is `main`.

## Run locally

Requirements: Node.js 20 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

Vite prints the local preview URL. Create a production build with:

```sh
pnpm build
```

## Project structure

- `src/App.tsx` — customer-facing pages, destination suggestions, and WhatsApp booking flow.
- `src/lib/booking-validation.ts` — service options, vehicle options, required self-drive terms, and form validation.
- `src/index.css` — palette, responsive layout, motion, hover, and reduced-motion styles.
- `public/assets/images/` — logo, illustrative fleet images, and site photography.
- `legacy/` — archived static implementation and its former account/admin integration.
- `supabase/migrations/` — historical migrations from the former database-backed version; not applied as part of the current deployment.

## Notes

- Availability and pricing for a requested trip are confirmed by Karwa through WhatsApp.
- Local Diu visitor suggestions do not guarantee that a ride is available to a particular location.
- Somnath, Sasan Gir, and Dwarka appear in the current self-drive terms; route, availability, and fare still require confirmation.
