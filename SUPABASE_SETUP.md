# Supabase and release setup

## Database migration

`supabase/migrations/20261015041521_secure_booking_and_review_access.sql` restores the narrowly scoped booking/review privileges needed by the browser app, preserves RLS, restricts customer inserts to their own pending requests, and limits status changes to authorized staff. It also enforces the current service/vehicle pairs, phone formatting, local travel-date rules, and a per-user retry token.

The migration was applied successfully to the production project and is recorded as `20261015041521_secure_booking_and_review_access`. Its checks confirm anonymous users cannot read bookings, customer insert grants exclude the status column, only admins can update status under RLS, approved public reviews expose only approved columns, and the booking transition trigger is active.

The production history still includes earlier versions `20261005113956` and `20261005114027` whose source files are absent from `main`. Recover/reconcile those historical migrations before future use of `supabase db push`; do not mark history repaired without comparing the original SQL and live schema.

At initial inspection the production `admin_users` table was empty. After you supplied the client email, I verified it matched an existing, email-confirmed Auth user and granted that user the `admin_users` role. The membership is verified in the database; no password was created, changed, or recorded. The role, updated dashboard, and dedicated `/admin-login.html` route are now live on the production site. Sign-in is role-checked with `is_admin()` before the dashboard opens, and RLS remains the actual data protection boundary.

For any future admin account or to replace this authorized account:

1. In Supabase Dashboard → Authentication → Users, invite the client's exact email address. Do not set or share a password. Configure the invite redirect to the site's `/reset-password.html` route.
2. After the invited user appears, copy their Auth user UUID from the Dashboard. Verify the email and UUID carefully.
3. In Supabase SQL Editor, insert only that UUID: `insert into public.admin_users (user_id) values ('<VERIFIED_AUTH_USER_UUID>'::uuid) on conflict (user_id) do nothing;` Replace the placeholder with the verified UUID; do not enter an email or password.
4. Send/resend the Supabase invitation to that same address. The client opens the invite link, sets a password on `/reset-password.html`, then signs in at `/admin-login.html`. Confirm `is_admin()` returns true for that signed-in user.
5. To revoke access, delete only that user's row from `public.admin_users`; then ask them to sign out. RLS will deny admin queries immediately after the role row is removed.

The existing authorized user should sign in with the password they already control. If they need to set a new password, ensure the exact production URL is allowed in Supabase Auth, then use the reset option at `/admin-login.html`. Never place the service-role key in site code. The `admin_users` table is inaccessible to `anon` and `authenticated`; manage roles through Supabase Dashboard SQL Editor or another trusted database-admin channel.

## Auth settings

Password recovery uses the fixed production redirect `https://karwatours.com/reset-password.html`. In **Authentication → URL Configuration**, set the production **Site URL** to `https://karwatours.com` (never localhost) and add this exact entry under **Redirect URLs**:

- `https://karwatours.com/reset-password.html`
- Add `https://www.karwatours.com/reset-password.html` only if that hostname is an active site alias.
- Add the matching local development reset URL while testing locally.

If recovery emails still land on localhost, first verify that the exact URL above is saved under Redirect URLs; Supabase falls back to Site URL when a requested redirect is not allowlisted. Check **Authentication → Email Templates → Reset Password** too: use Supabase's `{{ .ConfirmationURL }}` or the supplied `{{ .RedirectTo }}` value, and remove any hardcoded `localhost:3000` URL. Request a new reset email after saving changes; previously sent links cannot be repaired. The project currently has Supabase's **Leaked Password Protection Disabled** security advisory; enable it if the plan supports it, then review the resulting Auth settings.

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
2. The migration is applied to production. For future schema changes, reconcile the missing historical migration files before using `supabase db push`.
3. The specified existing user now has a verified `admin_users` membership. Sign in at `https://karwatours.com/admin-login.html`. Confirm a normal customer and a signed-out visitor are rejected, while this authorized user can access `/admin.html`.
4. Set the Auth URL allowlist and email template, request a password reset with a test account, and test both a valid link and an expired/used link.
5. On the deployed domain, test the WhatsApp link manually with a test request only after a development database is configured. Do not create a production booking just to verify the code.
6. Review the policy placeholders with the business owner before making those pages public as final policies.
