# Karwa Tours & Travels

The website for Karwa Tours & Travels in Diu, Gujarat. Browse travel services and the listed fleet, then send a booking request for Karwa to review.

Website: [karwatours.com](https://karwatours.com/)

## Features

- Responsive homepage with Diu-focused imagery and an automatic hero showcase of the 11 listed vehicle concepts.
- Fleet browsing with vehicle filters and booking links.
- Customer accounts, booking requests, booking status, and service terms.
- Reviews for completed journeys, with moderation and publication handled through the existing review flow.
- Separate admin sign-in and booking management pages.
- Reduced-motion support, keyboard navigation, and accessible form feedback.

Vehicle images are illustrative concepts. A booking request is not a confirmed reservation; Karwa confirms availability and final price.

## Technology

- Static HTML, CSS, and browser-native JavaScript modules; there is no frontend build step.
- Supabase Auth and Postgres, with database access protected by Row Level Security.
- `@supabase/supabase-js` loaded as a browser module from esm.sh.
- Vercel hosting, connected to the GitHub `main` branch.

## Run locally

Requirements: Python 3 for local static hosting. Node.js 18 or newer is needed to run the tests.

```sh
git clone https://github.com/Vyom108/karwa.git
cd karwa
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

The browser client configuration is in `js/supabase-config.js`. To use your own Supabase project, set its project URL and publishable key there. The publishable key is intended for browser use; never put a Supabase service-role key in client code.

Before applying database migrations to another Supabase project, review [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Existing migration history may require reconciliation before using the Supabase CLI.

## Tests

Run the existing Node.js test suite with:

```sh
npm test
```

## Project structure

- `index.html` — customer-facing homepage and booking form
- `admin-login.html`, `admin.html` — staff sign-in and booking management
- `reset-password.html` — account password reset flow
- `js/` — booking, authentication, fleet, animation, and page logic
- `css/` — site, responsive, and admin styles
- `assets/` — local fonts, vehicle concepts, and Diu photography
- `supabase/migrations/` — database security and booking/review migrations
- `terms.html`, `privacy.html`, `cancellation.html`, `refund.html` — customer policies
