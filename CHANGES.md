# Step 1A changes

- Preserved the prior static site, assets, tests, and package manifest under `legacy/` as a read-only reference. Its tracked `js/booking-validation.js` was checked against the repository version: it already matches the handoff vehicle/service map and contains no Tempo Traveller entry, so no validation-file content change was needed.
- Added a React + Vite + TypeScript + Tailwind CSS v4 project with shadcn-style `Button` and `Card` primitives, shared design tokens, responsive navigation, and a layout shell.
- Added routes for `/`, `/terms.html`, `/privacy.html`, `/cancellation.html`, `/refund.html`, `/reset-password.html`, `/admin-login.html`, and `/admin.html`.
- Added the handoff homepage sections, including the exact service and vehicle list (no Tempo Traveller), illustrative fleet/coastal image captions, FAQ copy, and future-step placeholders for booking and reviews.
- Added the four policy pages using the handoff's complete visible copy, including owner-review notices, owner checklists, and all `[OWNER TO COMPLETE]` / `[OWNER TO CONFIRM]` placeholders.
- Added homepage SEO metadata and AutoRental JSON-LD from the handoff, plus `public/robots.txt` and a homepage-only `public/sitemap.xml`.
- The handoff-referenced logo, fleet, service, coastal, and social-preview images are present and copied into `public/assets/images/`; no typographic fallbacks were needed.
- No Supabase connection or migrations were added. At this stage, booking, authentication, reviews, and admin functionality were still placeholders; the booking flow was subsequently added under Step 1B below.

## Build result

Passed: `pnpm build` completed `tsc -b` and `vite build` successfully (Vite 6.4.5; 1,587 modules transformed; production output emitted to `dist/`).

## Step 1A follow-up verification

- Route metadata is managed at runtime by `usePageMeta` in `src/App.tsx`. The route components pass route-specific metadata: the homepage uses the handoff title, description, canonical, robots, OG, and Twitter values; policy routes use their own title/description/canonical and `noindex,follow`; reset-password, admin-login, and admin each set their own title/description/canonical and `noindex,follow`. The helper creates missing tags if needed and updates title, description, canonical, robots, Open Graph, and Twitter metadata on mount.
- Audited production output file names for `google`, `real-car-photo`, `hero-`, `karwa-hero`, `bolero`, and `tempo`: no matches. The bundled images are only the selected fleet/service/coastal/logo/social assets used by the new app. The development signed-in toggle text is absent from `dist`.

## Step 1B booking

- Added a typed booking-validation module and a mock `createBooking` API. No Supabase connection or migrations were added; `/legacy` remains unchanged.
- The handoff's service/vehicle map, phone pattern and digit limits, length rules, Asia/Kolkata date rules, optional return/destination/message fields, and exact field errors match `legacy/js/booking-validation.js`.
- Difference found during cross-check: `legacy/js/booking-validation.js` does not validate the self-drive checkbox itself. The handoff requires it, and the legacy `main.js` adds this check during submission under error key `terms`; the new typed validator includes that same conditional rule in `validateDetails` under the typed field key `termsAgreement`, with the exact handoff message.
- Added the quick-start form, two-step custom-validated booking form, self-drive terms, fleet selection behavior, login placeholder, development-only signed-in toggle, mock save/success/error states, and conditional WhatsApp follow-up. `WHATSAPP_NUMBER` is blank by default. Mock `request_token` generation is marked TODO.
- Added a Vitest suite for the service map, phone values, India midnight date edges, required/optional fields, maximum lengths, date ordering, and self-drive agreement.
- Final build: `pnpm build` passed (`tsc -b` and Vite 6.4.5; 1,589 modules transformed).
- Final tests: `pnpm test` passed (1 file, 19 tests).
