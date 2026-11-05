# Karwa Tours & Travels — Historical Project Handoff

> **Historical snapshot:** This handoff records the former database-backed static site now archived under `legacy/`. The current customer site uses WhatsApp-only booking and does not call Supabase, store booking data, support customer accounts, or accept website reviews. The Karwa Supabase project has been paused; its stored data and migrations have not been deleted. No key, token, credential, or environment value is reproduced here. The details below describe the archived version and should not be read as current live-site behavior.

## 1. Services, rates, and vehicles

### Services and rates

These exact service option strings are used in the booking form and validation configuration:

- `Self Drive Cars` — rate **not specified in current code**.
- `Car for Rent` — rate **not specified in current code**.
- `Car Hire for Wedding` — rate **not specified in current code**.
- `Outstation Trips` — rate **not specified in current code**.
- `Bikes on Rent — ₹700 / 12 hours` — **₹700 / 12 hours**.
- `Scooty on Rent — ₹600 / 12 hours` — **₹600 / 12 hours**.

The first four services accept the same car vehicle list. Bike and scooty services each accept only their corresponding generic vehicle option.

### Current vehicle list

Category is the fleet card's `data-category` value. No price or passenger capacity is supplied for a vehicle unless shown below. The vehicle concepts are illustrative and do not identify a confirmed model or a specific Karwa vehicle.

| Vehicle name / booking value | Category | Rate displayed in code | Capacity stated in code |
|---|---|---|---|
| `Innova` | `car` | Not specified | Not specified |
| `Swift Dzire` | `car` | Not specified | Not specified |
| `Ertiga` | `car` | Not specified | Not specified |
| `Innova Crysta` | `car` | Not specified | Not specified |
| `Etios` | `car` | Not specified | Not specified |
| `Force Urbania — 16 Seater` (card title: `Force Urbania`) | `car` | Not specified | `16 Seater` |
| `Kia Carens` | `car` | Not specified | Not specified |
| `Ford Endeavour` | `car` | Not specified | Not specified |
| `Mahindra Thar` | `car` | Not specified | Not specified |
| `Bike — ₹700 / 12 hours` (card title: `Bikes on Rent`) | `bike` | `₹700 / 12 hours` | Not specified |
| `Scooty — ₹600 / 12 hours` (card title: `Scooty on Rent`) | `scooty` | `₹600 / 12 hours` | Not specified |

`js/booking-validation.js` is the authoritative current service/vehicle map. All nine car names above are accepted for each of the four car services. There is no current published category, rate, or capacity for the cars beyond the 16-seat Urbania label.

## 2. Booking form and request lifecycle

### Quick booking bar

`#quickBookingForm` is a separate shortcut on the homepage. It collects:

| Label | Type | Required | Limits / rules |
|---|---|---|---|
| Service | select | Yes | Same six service choices listed above; defaults to `Car for Rent`. |
| Preferred vehicle | select | Yes | Options are filled from the selected service; restricted to compatible current vehicles. |
| Pickup location | text | Yes | `maxlength="100"`; `autocomplete="street-address"`. |
| Travel date | date | Yes | Native date input. |

Its submit handler transfers those values into the detailed booking flow and scrolls to the booking section; it does not create a booking by itself. The shortcut has browser-native required-field validation. The site-level disclaimer near it reads: **“This starts a booking request. Availability and final price are confirmed by Karwa.”**

### Main booking form

The main `#bookingForm` has two steps. It uses custom validation (`novalidate`) and shows field errors beside controls. Required/optional labels and types below reflect the HTML form and `js/booking-validation.js`.

| Field label | Type / name | Required? | Validation and limits | Exact field errors |
|---|---|---|---|---|
| Service | select / `service` | Required | Must exactly match a key in `SERVICE_VEHICLES`. | `Choose a service.` |
| Preferred vehicle | select / `vehicle` | Required | Must be listed for the selected service. | `Choose a vehicle.` / `Choose a vehicle available for the selected service.` |
| Pickup location | text / `pickup` | Required | Trimmed; 1–100 characters; `maxlength="100"`; autocomplete street address. | `Enter a pickup location.` / `Pickup location must be 100 characters or fewer.` |
| Destination | text / `destination` | Optional | Trimmed; maximum 100 characters; `maxlength="100"`. Empty is stored as null. | `Destination must be 100 characters or fewer.` |
| Travel date | date / `date` | Required | Valid `YYYY-MM-DD`; today or later in `Asia/Kolkata`; HTML `min` is set to India-local today. | `Choose a valid travel date.` / `Travel date must be today or later (India time).` |
| Return date | date / `returnDate` | Optional | If entered, valid `YYYY-MM-DD` and not earlier than the travel date. HTML `min` follows travel date (or today if travel date is empty). Empty is stored as null. | `Choose a valid return date.` / `Return date cannot be before the travel date.` |
| Your name | text / `name` | Required | Trimmed; 1–70 characters; `maxlength="70"`; autocomplete name. | `Enter your name.` / `Name must be 70 characters or fewer.` |
| Phone number | tel / `phone` | Required | `maxlength="20"`; trimmed; phone must match `^\\+?[0-9][0-9\\s()-]{6,18}[0-9]$`; digit count 8–15. | `Enter a phone number so Karwa can contact you.` / `Enter a valid phone number, including country code if needed.` |
| Anything else we should know? | textarea / `message` | Optional | Trimmed; maximum 300 characters; `maxlength="300"`. Empty is stored as null. | `Message must be 300 characters or fewer.` |
| Self-drive agreement | checkbox / `termsAgreement` | Required only for `Self Drive Cars` | Must be checked after the self-drive terms are displayed. | `Please read and agree to the self-drive terms before continuing.` |

When any field validation fails, the form also displays **“Please review the highlighted fields.”** Journey-step validation checks service, vehicle, pickup, destination, travel date, and return date before advancing to step two. Final submission revalidates every field and the terms checkbox. Date checks use India local date, not the visitor's local timezone.

### Required self-drive terms, verbatim

Shown only after selecting `Self Drive Cars`; the section also displays:

- Brand: `KARWA TOURS AND TRAVELS`
- Title: `SELF-DRIVE CAR RENTAL`
- Route: `Route: Diu → Somnath → Sasan Gir → Dwarka`
- Heading: `Terms & Conditions`

The twelve ordered terms are:

1. `A valid driving licence and valid ID proof are mandatory.`
2. `A security deposit must be paid at the time of booking.`
3. `Only the authorised driver may drive the vehicle.`
4. `Fuel, toll tax, parking charges, and traffic fines are the customer’s responsibility.`
5. `The customer is responsible for the vehicle’s safety and condition throughout the rental period.`
6. `The customer must pay any applicable charges in case of an accident, damage, or vehicle loss.`
7. `Using the vehicle for illegal activities is strictly prohibited.`
8. `Smoking and alcohol consumption inside the vehicle are strictly prohibited.`
9. `The vehicle must be returned in the same condition on the agreed date and time.`
10. `Permission from Karwa Tours and Travels is required before extending the rental period.`
11. `Karwa Tours and Travels must be informed immediately in case of an accident or breakdown.`
12. `Booking cancellations and refunds are subject to the applicable booking policy.`

After the list: `Thank You for Choosing KARWA TOURS AND TRAVELS`

Exact checkbox agreement: `I have read and agree to the Self-Drive Terms & Conditions.`

For a self-drive request, the database payload stores `terms_accepted_at` as an ISO timestamp. For other services it stores null. The WhatsApp follow-up message then includes `Self-drive terms: Accepted`.

### Sign-in, submission, and exact request wording

- The booking requires a customer account. On final submit without an authenticated user, the form says: **“Log in or create an account to send this request. Your trip details will remain in the form.”** It opens the login dialog and preserves the form values.
- While saving, the button reads `Saving request…`.
- On a saved request, the exact status message is: **“Your request is saved (reference {REFERENCE}). Karwa will confirm availability and final pricing with you. This is not yet a confirmed reservation.”** `{REFERENCE}` is the uppercase first eight characters of the database booking UUID.
- The follow-up button is `Continue on WhatsApp to check availability ↗`. Its prefilled message states: `I sent a booking request (reference {REFERENCE}) and would like to check availability and final pricing.` It includes customer name, phone, service, vehicle, pickup, destination (`Not specified` when blank), travel date, return date (`Not specified` when blank), additional message (`None` when blank), and, when applicable, `Self-drive terms: Accepted`. It ends: `I understand this request is not a confirmed reservation. Thank you.` The customer must send the prepared WhatsApp message themselves.
- The page's wording also includes: **“A request is not a confirmed reservation. Final price and availability are confirmed by Karwa over WhatsApp.”** and **“Your request is not a confirmed reservation. Karwa will check availability and confirm the final price with you on WhatsApp.”**
- If the save fails: **“We could not save your request. Your details are still here; please try again.”**

### Booking statuses

Database/admin workflow statuses are exactly:

- `pending` → `confirmed` or `cancelled`
- `confirmed` → `completed` or `cancelled`
- `completed` → no further status change
- `cancelled` → no further status change

The client does not send a `status` on insert. The RLS insert policy requires the resulting row to have `status = 'pending'`; the base-table default that supplies it is not defined in the checked-in migrations. The account view renders `pending` as **“Request received — awaiting confirmation”**; other statuses display their raw status value. The SQL trigger rejects status transitions outside the lifecycle above.

## 3. Supabase contract from repository code

No live Supabase queries, dashboard reads, or database writes were made for this handoff. These names/columns are taken from client code and checked-in SQL only.

### Tables and columns used

- `public.bookings`: `id`, `request_token`, `user_id`, `customer_name`, `customer_phone`, `service`, `vehicle`, `pickup_location`, `destination`, `travel_date`, `return_date`, `customer_message`, `terms_accepted_at`, `status`, `created_at`.
- `public.reviews`: `id`, `booking_id`, `user_id`, `reviewer_name`, `rating`, `comment`, `status`, `created_at`.
- `public.admin_users`: `user_id` (role/membership lookup used by `is_admin()`).
- Supabase Auth is used for customer and staff identities. The browser client persists sessions, refreshes tokens automatically, and detects auth sessions in the URL. Signup adds Auth user metadata `full_name`; the app obtains the current Auth `user.id` and associates it with booking/review rows.

The original base table-creation SQL is not present in this repository, so base column types, defaults, indexes, and any constraints not shown by the checked-in migrations cannot be established from the repo alone.

### Current checked-in migrations

1. `supabase/migrations/20261015041521_secure_booking_and_review_access.sql`
   - Enables RLS on `bookings`, `reviews`, and `admin_users`.
   - Adds a per-user UUID `request_token`, defaulting to a generated UUID and unique with `user_id`.
   - Removes the prior travel-date check and adds unvalidated checks for service/vehicle combinations, phone format (8–15 digits), normalized name (1–70), pickup (1–100), destination (up to 100), message (up to 300), and required `user_id`.
   - Defines security-definer helpers `is_admin()` and `can_review_booking(...)`; defines review insert trigger function `set_review_display_name()` to derive reviewer name from the completed booking customer and force new review state to `pending`.
   - Grants narrowly scoped column access and replaces named booking/review policies (detailed below).
   - Defines a booking status-transition trigger.
2. `supabase/migrations/20261018181355_align_bike_booking_labels.sql`
   - Adds and validates the current bike `₹700 / 12 hours` and scooty `₹600 / 12 hours` service/vehicle compatibility check, then drops the older compatibility check.
3. `supabase/migrations/20261018181358_revoke_direct_review_trigger_function.sql`
   - Revokes direct `authenticated` execution of `set_review_display_name()` while retaining its trigger. The setup document says the `is_admin()` and `can_review_booking()` grants remain for their RLS use.

`SUPABASE_SETUP.md` says the first migration and both later migrations were applied to production and gives operational notes. That is a statement in a checked-in document, not independently verified in this read-only task. It also says production migration history has two older migrations (`20261005113956` and `20261005114027`) whose SQL files are absent from this branch. It explicitly warns against `supabase db push` until those sources are recovered/reconciled.

### RLS policy names and behavior in checked-in migration

**Bookings**

- `Admins can view bookings`: authenticated users passing `is_admin()` can read bookings.
- `Admins can update booking status`: `is_admin()` required in both `USING` and `WITH CHECK` for updates.
- `Customers can create their own pending requests`: insert requires `user_id = auth.uid()`, `status = 'pending'`, and `travel_date` on/after the current date in `Asia/Kolkata`.
- `Customers can view their own bookings`: a customer can select rows whose `user_id` equals their Auth UID.
- Column grants in the migration give authenticated users select on the booking fields listed above; insert only on request/user/customer/trip/message/terms fields (not `status`); update only on `status`. Anonymous and public table access is revoked.

**Reviews**

- `Admins can view reviews`: authenticated `is_admin()` users can read reviews.
- `Admins can update review status`: authenticated `is_admin()` users can update review status.
- `Customers can submit pending reviews for completed bookings`: insert requires the Auth UID to match `user_id`, `status = 'pending'`, and `can_review_booking(booking_id,user_id)` (matching customer booking with status `completed`).
- `Customers can view their own reviews`: a customer can select review rows for their Auth UID.
- `Visitors can view approved reviews`: anonymous select is limited to `status = 'approved'`.
- Anonymous review select is granted only on `reviewer_name`, `rating`, `comment`, and `created_at`; authenticated review grants are scoped to columns used in the app. New reviewer name is derived by the trigger, not trusted from client input.

**Admin membership**

- Table-level grants are revoked from `public`, `anon`, and `authenticated`; this migration defines no client-facing policy to read or edit `admin_users`. The security-definer `is_admin()` helper checks membership without exposing the table to the app.

### Authentication flows

**Customer sign-up**

- Fields: `Full name` (shown only in signup, max 70), `Email` (`type=email`, required), `Password` (required, minimum 8, autocomplete `new-password`).
- Calls Supabase Auth `signUp`, stores `full_name` user metadata, and requests confirmation redirect to the canonical homepage.
- Exact messages: rate-limit: `Email sending is temporarily rate-limited. Wait before trying again. The site owner needs to configure custom email delivery for sign-up and password emails.`; other error: `We could not create the account. Check the details and try again.`; pending confirmation: `If this address can be registered, confirmation instructions will arrive by email.`; generic network error: `We could not reach the account service. Please try again.`

**Customer login**

- Fields: Email (`type=email`, required), Password (required, minimum 8; `current-password` autocomplete).
- Calls `signInWithPassword`. Error: `We could not log you in. Check your details or use password recovery.`
- Signed-in nav action becomes `My account`; account view lists that customer's booking statuses and offers logout.

**Customer password recovery**

- Required email field (`type=email`); calls `resetPasswordForEmail` with the canonical `/reset-password.html` redirect.
- Success wording: `If an account can be recovered with that address, a reset link will arrive by email.` Other exact errors: `We could not send a reset link right now. Please try again shortly.`; rate-limit uses the signup email-rate-limit wording above; network error: `We could not reach the account service. Please try again.`
- Reset page accepts a recovery or invite link; requires a new password of at least 8 characters and confirmation. Errors: `This reset link is invalid, expired, or already used. Request a new link from the login window.`; `Use at least 8 characters.`; `The passwords do not match.`; `We could not update your password. Request a fresh reset link and try again.`; success: `Your password has been updated. You can return to Karwa and log in.`

**Admin login/recovery**

- Staff login is at `admin-login.html`; the admin sign-in script checks `is_admin()` after password login and signs an unauthorized user out. The staff reset action only sends recovery mail to an entered invited-account email.
- Setup documentation states invitation and role membership are managed by the owner through Supabase Dashboard/trusted SQL, not public signup; see Admin section below. No staff credential is included here.

### Reviews: submission, moderation, and display

- A signed-in customer can review a booking only after its status is `completed`; account UI offers `Write a review` only when there is no review row for that booking.
- Form: hidden `bookingId`; required rating select with options `5 — Excellent`, `4 — Very good`, `3 — Good`, `2 — Needs improvement`, `1 — Poor`; required `Your review` textarea, minimum 10 and maximum 600 characters, placeholder `Tell us about your journey.`
- Client inserts `booking_id`, current `user_id`, numeric `rating`, and trimmed `comment`. RLS restricts it to the user's own completed booking; trigger derives `reviewer_name` from the booking and forces `status` to `pending`.
- Success: `Thank you. Your review is waiting for approval.` Failure: `Your review could not be submitted. Please try again.`; network error: `We could not reach the reviews service. Please try again.`
- Admin can change review status `pending` → `approved` or `rejected`; approved/rejected are terminal in `js/admin-workflow.js`.
- Public homepage makes an anonymous query for at most six latest reviews, selecting `reviewer_name`, `rating`, `comment`, `created_at`; RLS returns approved rows only. It renders stars, quoted comment, name, and month/year. Empty placeholder: `Approved customer reviews will appear here.` The account view displays the user's own review state as `Review {status}`.

## 4. Admin features and access restrictions

- Pages: `admin-login.html` and `admin.html`; both declare `noindex`. Dashboard provides booking search, status/service/vehicle/date filters, reset filters, refresh, booking detail cards, booking status controls, review list/status controls, and logout.
- Booking search checks customer name, phone, pickup, destination, and customer note. Cards show customer/vehicle, service, travel/return date, route, contact phone, note, request date, self-drive acceptance timestamp or `No self-drive terms acceptance recorded`, and current status.
- Booking transitions exposed by UI: `pending` → `confirmed`/`cancelled`; `confirmed` → `completed`/`cancelled`; completed and cancelled have no further changes. Review transitions: `pending` → `approved`/`rejected`; terminal statuses have no further changes. Status changes require confirmation and are persisted to the named table; database RLS/trigger is the security boundary.
- Access sequence: admin login requires an existing invited Auth account; successful password login is followed by RPC `is_admin()`. If the role call errors or returns anything other than true, the app signs the user out and refuses dashboard entry. The dashboard independently checks for a session and `is_admin()` before loading any customer records; an unauthorized session is signed out and redirected to `admin-login.html`. Auth sign-out also redirects to admin login.
- `admin_users` membership is not user-editable from the site. `SUPABASE_SETUP.md` instructs an owner to invite the exact staff email in Auth, add only its verified Auth UUID to `public.admin_users` through trusted admin tooling, then revoke by deleting that membership row. Those are repository instructions, not executed here.

## 5. Customer-facing content

### Homepage FAQs, verbatim

1. **Is a booking request a confirmed reservation?** — `No. Karwa checks availability and confirms the final price with you on WhatsApp. Your reservation is confirmed only after Karwa gets back to you.`
2. **What rides can I request?** — `You can request self-drive cars, car rentals, wedding car hire, outstation trips, bikes, and scooties. Availability is confirmed after you send a request.`
3. **What are the bike and scooty rates?** — `Bike rentals are listed at ₹700 for 12 hours. Scooty rentals are listed at ₹600 for 12 hours.`
4. **How do I see my booking status?** — `Log in with the account used for your request, then open My Account to view your bookings and their status.`
5. **Where can I read the booking and service terms?** — `Read the Booking Terms. Self-drive terms appear in the booking form when you select that service and must be accepted before you send the request.`

### Story and strengths copy, verbatim

**Our story section**

- Eyebrow: `KARWA TOURS & TRAVELS`
- Heading: `Every good trip starts with a little care.`
- Paragraph: `Karwa helps you plan local rides and longer journeys from Diu. Tell us what you need, and we’ll check the details with you before your reservation is confirmed.`
- CTA: `Plan a ride`
- Side statement: `Travel, made personal.`
- Side paragraph: `Choose a listed ride, share your dates and pickup, then wait for Karwa to confirm availability and the final price.`

**Trust/how-it-works copy**

- `A simple start. A clear next step.`
- `Share your ride details, sign in to send a request, then wait for Karwa to confirm availability and final price.`
- `Choose your ride` — `Pick a service and the vehicle you have in mind.`
- `Share your plans` — `Tell us where you’re going and when, plus the details Karwa needs to contact you.`
- `Sign in and send` — `Log in or create an account to send your request. Required service terms must be accepted.`
- `We’ll confirm with you` — `Karwa checks availability and follows up with the final price. Your request isn’t a confirmed reservation.`

There is no separate factual “strengths” or service-guarantees section in current homepage copy. The site avoids quantified claims such as years operating, fleet size guarantees, or 24/7 service.

### Policy pages — full visible copy

The four policy pages currently show draft/owner-review notices. The full visible policy copy follows.

#### Booking Terms (`terms.html`)

**Owner review required before publication.**

`The points below describe the current website workflow. The business should complete and approve service-specific conditions before treating this page as a complete set of contractual terms.`

Checklist:
- `Confirm what constitutes final acceptance of a reservation.`
- `Confirm any deposits, payment methods, changes, cancellation terms, and service-specific rules.`
- `Confirm the correct business name and governing contact details.`

**Booking request and confirmation**

`Submitting the website form sends a request for a service, vehicle, and travel dates. It does not by itself confirm a reservation or final price. Karwa will check availability and confirm the final price with the customer through WhatsApp or another confirmation process agreed with the customer.`

**Details provided**

`Please provide accurate contact and trip details so Karwa can respond. A booking request can be reviewed in the customer account associated with the email used to log in.`

**Service-specific conditions**

`Additional self-drive terms are shown in the booking form when that service is selected and must be accepted before sending the request. Any additional conditions for other services should be confirmed directly with Karwa before the reservation is finalized.`

**Changes and cancellations**

`See the Cancellation Policy and Refund Policy. Those pages require owner decisions before they can be considered complete.`

**Contact**

`The website currently lists +91 81400 57861, +91 97230 87861, and mansurimakhdum098@gmail.com. Confirm final pricing and service conditions with Karwa before travel.`

#### Privacy Policy (`privacy.html`)

**Owner review required before publication.**

`This draft describes the data flows visible in the website. Complete the owner checklist below and confirm the final text before publishing it as an approved policy.`

Checklist:
- `Confirm the responsible legal/business name and postal address.`
- `Set and disclose data retention, deletion, and customer request procedures.`
- `Confirm applicable privacy-law notices and the contact responsible for privacy requests.`

`This website asks for details to handle travel enquiries and customer accounts. The website currently collects the information below when you use those features:`

- `Booking request: name, phone number, selected service and vehicle, pickup location, destination if provided, travel and return dates, and optional message.`
- `Account: email address and account information handled by the authentication provider.`
- `Review: rating and review text associated with a completed booking.`

**How the information is used**

`The information is used to receive and follow up on travel requests, manage customer bookings and account access, and display reviews after approval. A submitted booking request is not a confirmed reservation.`

**Service providers and WhatsApp**

`Booking and review information is stored through Supabase, which provides the website’s database and authentication services. If you choose the WhatsApp link after submitting a request, the message is prepared for you to send to Karwa through WhatsApp. Review the message before sending it.`

**Retention and customer requests**

`[OWNER TO COMPLETE] State how long booking, account, and review information is kept; how a customer can request access, correction, or deletion; and any legal or operational reasons information may need to be retained.`

**Contact**

`For questions about a booking, the site currently lists +91 81400 57861, +91 97230 87861, and mansurimakhdum098@gmail.com. [OWNER TO CONFIRM] Identify the correct privacy contact and the legal/business name responsible for the information.`

#### Cancellation Policy (`cancellation.html`)

**Owner decisions required before publication.**

`No cancellation window, fee, or rescheduling promise was available in the repository, so this page does not invent one.`

Checklist:
- `Define how customers cancel or change a request after confirmation.`
- `Set any cutoff times, fees, and service-specific exceptions.`
- `Explain how customers receive acknowledgement of a cancellation.`

**Booking requests**

`Submitting the website form creates a request, not a confirmed reservation. Karwa checks availability and final pricing with the customer through WhatsApp or another confirmation process agreed with the customer.`

**After Karwa confirms a reservation**

`[OWNER TO COMPLETE] Add the verified process and conditions for cancelling or changing a confirmed reservation. Include any deadlines and applicable charges only after the business has approved them.`

**Contact**

`The website currently lists +91 81400 57861, +91 97230 87861, and mansurimakhdum098@gmail.com. Contact Karwa with the booking reference when one is available. [OWNER TO CONFIRM] Choose the official cancellation contact and response process.`

#### Refund Policy (`refund.html`)

**Owner decisions required before publication.**

`The website does not collect online payments, and no refund rules were provided. Complete and approve the details below before presenting this as a final policy.`

Checklist:
- `Confirm whether deposits or advance payments are collected and by which methods.`
- `Define the refund conditions, amount, timing, and process.`
- `Explain how cancellations by Karwa or the customer are handled.`

**Website requests**

`The website submits a travel request for availability and pricing follow-up. It does not take payment in the booking form. A request is not a confirmed reservation.`

**Refund terms for confirmed bookings**

`[OWNER TO COMPLETE] Publish the approved refund conditions for each relevant service, including any advance payments, deductions, timing, and customer contact process. Do not rely on this page until those details have been verified.`

**Contact**

`The website currently lists +91 81400 57861, +91 97230 87861, and mansurimakhdum098@gmail.com. [OWNER TO CONFIRM] Identify the official refund enquiry contact.`

### Contact details

- Phone: `+91 81400 57861` (`tel:+918140057861`)
- Phone: `+91 97230 87861` (`tel:+919723087861`)
- Email: `mansurimakhdum098@gmail.com` (`mailto:mansurimakhdum098@gmail.com`)
- Location: `Diu District - 362520`

### Footer links and copy

Homepage footer links, in order: `Services`, `Fleet`, `Diu`, `Our story`, `FAQs`, `Contact`, `Privacy`, `Cancellation`, `Refunds`, `Booking terms`; plus `Back to top ↑`.

Footer copy:

- `From Diu to the road ahead.`
- `Start with a ride that fits your plans.`
- `© 2026 Karwa Tours & Travels. All Rights Reserved.`

Policy page footer links: `Privacy`, `Cancellation`, `Refunds`, `Booking terms`; copyright: `© 2026 Karwa Tours & Travels`.

## 6. Images, logo files, and SEO metadata

### Current page image/alt-text inventory

The text below is the `alt` value in markup or current dynamic hero config. Where an image is referenced only as an Open Graph preview or CSS background, that is stated separately.

| Repository path | Current alt text / usage |
|---|---|
| `assets/images/karwa-logo-180.webp` | `Karwa Tours & Travels logo` (header/footer and policy/admin headers) |
| `assets/images/fleet-innova.webp` | `Illustrative vehicle concept: Innova` |
| `assets/images/fleet-swift-dzire.webp` | `Illustrative vehicle concept: Swift Dzire` |
| `assets/images/fleet-ertiga.webp` | `Illustrative vehicle concept: Ertiga` |
| `assets/images/fleet-innova-crysta.webp` | `Illustrative vehicle concept: Innova Crysta` |
| `assets/images/fleet-etios.webp` | `Illustrative vehicle concept: Etios` |
| `assets/images/fleet-force-urbania.webp` | `Illustrative vehicle concept: Force Urbania, listed as 16 seater` |
| `assets/images/fleet-kia-carens.webp` | `Illustrative vehicle concept: Kia Carens` |
| `assets/images/fleet-ford-endeavour.webp` | `Illustrative vehicle concept: Ford Endeavour` |
| `assets/images/fleet-mahindra-thar.webp` | `Illustrative vehicle concept: Mahindra Thar` |
| `assets/images/fleet-bike.webp` | `Illustrative vehicle concept: a generic commuter motorcycle; Karwa does not specify a model` |
| `assets/images/fleet-scooty.webp` | `Illustrative vehicle concept: a generic commuter scooty; Karwa does not specify a model` |
| `assets/images/service-self-drive.jpg` | `Car keys ready for a self-drive rental` |
| `assets/images/service-rental.jpg` | `Family getting into a rental car` |
| `assets/images/service-wedding.jpg` | `A wedding car decorated with flowers` |
| `assets/images/service-outstation.webp` | `Open road stretching into the distance` |
| `assets/images/karwa-coastal-hero.webp` | Diu section: `Illustrative coastal-road scene created for Karwa’s Diu travel direction`; bento section: `Illustrative coastal road at sunset, created for Karwa’s Diu travel direction`; also used as a CSS background, which has no HTML alt text. |
| `assets/images/karwa-social-preview.jpg` | Open Graph alt: `A coastal road scene created for Karwa Tours & Travels`; used as Open Graph/Twitter preview image. |

All remaining files below are checked-in image assets but are not currently used by page `<img>` markup or dynamic hero configuration; no HTML `alt` text is declared for them in the current application. Some may be source/fallback assets or historical files.

| Repository path | Current alt text |
|---|---|
| `assets/images/ertiga-google.jpg` | None declared (not currently displayed) |
| `assets/images/etios-google.jpg` | None declared (not currently displayed) |
| `assets/images/force-urbania-16-seater.jpg` | None declared (not currently displayed) |
| `assets/images/ford-endeavour.jpg` | None declared (not currently displayed) |
| `assets/images/hero-indian-road-1376.webp` | None declared (responsive/source asset; current markup does not reference it) |
| `assets/images/hero-indian-road-640.webp` | None declared (responsive/source asset; current markup does not reference it) |
| `assets/images/hero-indian-road.png` | None declared (source/fallback asset; current markup does not reference it) |
| `assets/images/hero-innova-india.jpg` | None declared (not currently displayed) |
| `assets/images/hero-road-diu.jpg` | None declared (not currently displayed) |
| `assets/images/innova-crysta-google.jpg` | None declared (not currently displayed) |
| `assets/images/innova-google.jpg` | None declared (not currently displayed) |
| `assets/images/karwa-diu-fort-road.webp` | None declared (not currently displayed) |
| `assets/images/karwa-hero-car.webp` | None declared (not currently displayed) |
| `assets/images/karwa-logo-clean.png` | None declared; logo source file not currently used in markup |
| `assets/images/karwa-logo-original.jpg` | None declared; logo source file not currently used in markup |
| `assets/images/kia-carens.jpg` | None declared (not currently displayed) |
| `assets/images/mahindra-bolero-pickup-real-car-photo-wh-1.jpg` | None declared (not currently displayed) |
| `assets/images/mahindra-thar.jpg` | None declared (not currently displayed) |
| `assets/images/maruti-suzuki-ertiga-real-car-photo-blac-1.webp` | None declared (not currently displayed) |
| `assets/images/maruti-suzuki-swift-dzire-real-car-photo-1.jpg` | None declared (not currently displayed) |
| `assets/images/tempo-traveller-google.jpg` | None declared (not currently displayed) |
| `assets/images/tempo-traveller-van-real-car-photo-white-1.jpg` | None declared (not currently displayed) |
| `assets/images/toyota-etios-real-car-photo-white-1.jpg` | None declared (not currently displayed) |
| `assets/images/toyota-innova-crysta-real-car-photo-whit-1.jpg` | None declared (not currently displayed) |
| `assets/images/toyota-innova-real-car-photo-white-isola-1.jpg` | None declared (not currently displayed) |
| `/favicon.ico` | Browser/site favicon; it is not an inline image and has no page `alt` attribute. |

### Current homepage SEO metadata (`index.html`)

- Document language: `en`.
- `<title>`: `Karwa Tours & Travels | Diu, your way`
- Meta description: `Explore Diu and plan your next journey with Karwa Tours & Travels. Browse car and two-wheeler rentals, wedding car hire and outstation trips.`
- Canonical: `https://karwatours.com/`
- Robots: `index,follow`
- Open Graph: type `website`; site name `Karwa Tours & Travels`; title `Karwa Tours & Travels | Diu, your way`; description `Explore Diu and plan the road ahead with Karwa Tours & Travels.`; URL `https://karwatours.com/`; image `https://karwatours.com/assets/images/karwa-social-preview.jpg`; image dimensions `1200 × 630`; image alt `A coastal road scene created for Karwa Tours & Travels`.
- Twitter: card `summary_large_image`; title `Karwa Tours & Travels | Diu, your way`; description `Explore Diu and plan the road ahead with Karwa Tours & Travels.`; image is the same social preview JPG.
- JSON-LD: Schema.org `AutoRental`, name `Karwa Tours & Travels`, URL `https://karwatours.com/`, email `mansurimakhdum098@gmail.com`, telephone `+91 81400 57861`, areaServed `AdministrativeArea` named `Diu`.
- Preloads: `assets/fonts/noto-sans-condensed-black.woff2` and `assets/fonts/open-sans-400-normal.woff2`.

Policy pages have canonical URLs at `/terms.html`, `/privacy.html`, `/cancellation.html`, `/refund.html`; each declares `noindex,follow`, its page-specific title/description, Open Graph title/description/url and the shared social image, and Twitter `summary_large_image` with matching page title/description/image. Admin login, admin dashboard, and reset-password pages are `noindex`; no canonical/Open Graph/Twitter tags are declared there.

Exact per-page policy metadata:

| Page | Title | Description | Canonical |
|---|---|---|---|
| `terms.html` | `Booking Terms | Karwa Tours & Travels` | `How booking requests and reservation confirmations work with Karwa Tours & Travels.` | `https://karwatours.com/terms.html` |
| `privacy.html` | `Privacy Policy | Karwa Tours & Travels` | `How Karwa Tours & Travels handles booking and account information.` | `https://karwatours.com/privacy.html` |
| `cancellation.html` | `Cancellation Policy | Karwa Tours & Travels` | `Cancellation information for Karwa Tours & Travels booking requests.` | `https://karwatours.com/cancellation.html` |
| `refund.html` | `Refund Policy | Karwa Tours & Travels` | `Refund information for Karwa Tours & Travels reservations.` | `https://karwatours.com/refund.html` |

Each of the above also uses OG type `website`, OG site name `Karwa Tours & Travels`, the same page title and description for OG and Twitter, OG URL equal to its canonical, and image `https://karwatours.com/assets/images/karwa-social-preview.jpg` for OG/Twitter. Admin page titles are `Karwa Tours & Travels | Admin sign in` and `Karwa Tours & Travels | Admin`; reset title is `Reset password | Karwa Tours & Travels`.

## 7. Unclear or inconsistent items to resolve

1. **Older migration values do not match the current fleet/services.** The 20261015041521 migration's old compatibility constraint accepts `Tempo Traveller` and Bike `₹900 / 12 hours`; current form/validation/fleet has no Tempo Traveller and lists bike `₹700 / 12 hours`. The checked-in 20261018181355 migration replaces the old service/vehicle check with bike ₹700/scooty ₹600 and no Tempo Traveller. The repo also warns that two older production migrations are missing; do not infer the live schema from only this checkout.
2. **Car pricing is absent.** Current code publishes no rate for the nine listed car vehicles or the four car services. The request copy says availability/final price are confirmed by Karwa. Only bike ₹700/12 hours and scooty ₹600/12 hours are explicit.
3. **Vehicle capacities are absent except Urbania.** Only Force Urbania is labeled `16 Seater`; no other capacity is stated.
4. **Policy pages are drafts.** The legal business identity/address, data retention/deletion process, final cancellation/change deadlines/fees, refund terms/timing, and policy contacts are explicitly left for owner completion/confirmation. The pages are currently `noindex`.
5. **Review numeric bounds are not established by checked-in migration source.** The UI only offers ratings 1–5; base table constraints are not present in the repo. The RLS migration excerpt does not add a rating-range check.
6. **Signup wording says a confirmation email is sent**, while Auth configuration/email delivery is external. `SUPABASE_SETUP.md` reports earlier email rate limits and calls for SMTP configuration; current live delivery settings were not inspected.
7. **Some media are illustrative concepts, not documentary Diu or fleet photographs.** The UI labels the fleet and coastal artwork illustrative; older unused image assets have no current alt text.
8. **Business confirmation channel wording varies slightly.** Homepage/FAQ says Karwa confirms through WhatsApp; policy wording sometimes permits “WhatsApp or another confirmation process agreed with the customer.” The repo does not specify an SLA or final confirmation acceptance condition.
9. **“Our story” copy is a short service description rather than a company history.** There are no verified founding date, years in business, fleet-size claims, or service guarantees in the checked-in copy.
