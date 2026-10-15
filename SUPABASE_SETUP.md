# Supabase and release setup

## Database migration

`supabase/migrations/20261015033913_secure_booking_and_review_access.sql` restores the narrowly scoped booking/review privileges needed by the browser app, preserves RLS, restricts customer inserts to their own pending requests, and limits status changes to authorized staff. It also enforces the current service/vehicle pairs, phone formatting, local travel-date rules, and a per-user retry token.

The migration has **not** been applied to the production database. The connected Karwa project was inspected read-only. Its current remote migration history lists `20261005113956` and `20261005114027`, but those migration files are absent from the repository's `main` branch. Recover/reconcile those historical migrations before using `supabase db push`; do not mark history as repaired without checking the corresponding SQL and live schema. Review the new migration, apply it first to a development database, then verify grants, RLS policies, and the booking/review flows before production.

At initial inspection the production `admin_users` table was empty. After you supplied the client email, I verified it matched an existing, email-confirmed Auth user and granted that user the `admin_users` role. The membership is verified in the database; no password was created, changed, or recorded. This role grant is live in production now, while the updated dashboard code and new migration remain local and have not been deployed/applied. The local site has a dedicated `/admin-login.html` route. Sign-in is role-checked with `is_admin()` before the dashboard opens, and RLS remains the actual data protection boundary.

For any future admin account or to replace this authorized account:

1. In Supabase Dashboard → Authentication → Users, invite the client's exact email address. Do not set or share a password. Configure the invite redirect to the site's `/reset-password.html` route.
2. After the invited user appears, copy their Auth user UUID from the Dashboard. Verify the email and UUID carefully.
3. In Supabase SQL Editor, insert only that UUID: `insert into public.admin_users (user_id) values ('<VERIFIED_AUTH_USER_UUID>'::uuid) on conflict (user_id) do nothing;` Replace the placeholder with the verified UUID; do not enter an email or password.
4. Send/resend the Supabase invitation to that same address. The client opens the invite link, sets a password on `/reset-password.html`, then signs in at `/admin-login.html`. Confirm `is_admin()` returns true for that signed-in user.
5. To revoke access, delete only that user's row from `public.admin_users`; then ask them to sign out. RLS will deny admin queries immediately after the role row is removed.

The existing authorized user should sign in with the password they already control. If they need to set a new password, wait until the reset route is deployed and its exact production URL is allowed in Supabase Auth, then use the reset option at `/admin-login.html`. Never place the service-role key in site code. The `admin_users` table is inaccessible to `anon` and `authenticated`; manage roles through Supabase Dashboard SQL Editor or another trusted database-admin channel.

## Auth settings

Password recovery uses Supabase Auth email delivery and redirects to `/reset-password.html` on the current site origin. In **Authentication → URL Configuration**, set the production Site URL to the canonical deployed origin and allow the exact reset URL, for example:

- `https://karwatours.com/reset-password.html`
- Add `https://www.karwatours.com/reset-password.html` only if that hostname is an active site alias.
- Add the matching local development reset URL while testing locally.

Confirm the password recovery email template links back to Supabase's supplied redirect URL. The project currently has Supabase's **Leaked Password Protection Disabled** security advisory; enable it if the plan supports it, then review the resulting Auth settings.

## Policy copy needing owner decisions

The policy pages intentionally mark details that were not verified in the repository. Before deploying them as final business policies, complete:

- The correct legal/business identity and postal address.
- Privacy data-retention and customer request/deletion procedures.
- Confirmed cancellation/change windows and any applicable fees.
- Confirmed refund eligibility, process, and timing for each service.
- The final booking confirmation process and business contact for each policy.

No cancellation deadline, refund promise, or legal identity has been invented in the draft pages.

## Verification checklist

1. Run `npm test` for the booking validation unit tests.
2. Apply the migration to a development Supabase project and verify that `anon` cannot read bookings, customers can only read their own rows, customer inserts create `pending` requests, status edits require an admin, and public review queries expose only approved review fields.
3. The specified existing user now has a verified `admin_users` membership. After the site code is deployed, sign in at `/admin-login.html`. Confirm a normal customer and a signed-out visitor are rejected, while this authorized user can access `/admin.html`.
4. Set the Auth URL allowlist and email template, request a password reset with a test account, and test both a valid link and an expired/used link.
5. On the deployed domain, test the WhatsApp link manually with a test request only after a development database is configured. Do not create a production booking just to verify the code.
6. Review the policy placeholders with the business owner before making those pages public as final policies.
