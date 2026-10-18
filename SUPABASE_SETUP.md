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

Production recovery and signup confirmation links use the canonical site, `https://karwatours.com`. In **Authentication → URL Configuration**:

- Set **Site URL** to `https://karwatours.com`.
- Add `https://karwatours.com/reset-password.html` and `https://karwatours.com/` to **Redirect URLs**.
- Add localhost redirect URLs only for local development. Remove any hardcoded localhost target from **Authentication → Email Templates**; use Supabase's supplied confirmation URL / redirect value.

Auth logs showed `429 email rate limit exceeded` for both signup confirmation and password recovery. The project was using Supabase's default email sender, which has a very low send limit and is intended for testing. Configure a verified custom SMTP provider in **Authentication → SMTP Settings** before retrying signup or recovery emails. Enter SMTP credentials only in the Supabase Dashboard; never commit them or send them in chat. After setup, request one fresh email. Links already sent cannot be repaired.

See [Supabase custom SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp) and [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).

The project currently has Supabase's **Leaked Password Protection Disabled** security advisory; enable it if the plan supports it, then review the resulting Auth settings.
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

## Audit fixes in this branch (not yet deployed)

The current application labels bikes at ₹700 per 12 hours, while the production-applied `20261015041521_secure_booking_and_review_access` migration's compatibility check still accepts ₹900 bike labels. The new forward-only migration `20261018181355_align_bike_booking_labels.sql` adds and validates the matching ₹700/₹600 compatibility rule, then removes only the old service/vehicle check. It does not update booking rows, drop RLS, or alter other columns. Production schema inspection found one existing car booking and no bike or scooty bookings. The migration was applied to production after approval; it validated successfully and did not rewrite booking rows. If validation fails because a historical row has an unexpected service/vehicle value, the transaction rolls back and no records are rewritten.

`20261018181358_revoke_direct_review_trigger_function.sql` removes direct `authenticated` execution from `set_review_display_name()` only. The function remains attached to its existing review insert trigger. `is_admin()` and `can_review_booking()` keep their `authenticated` grants because RLS policies call them. PostgreSQL documents that a role needs `EXECUTE` when creating a trigger; the permission change does not remove or replace the trigger. This migration was applied to production after verifying the existing trigger and grants. Direct `authenticated` execution is now revoked, while the trigger itself and the helper grants remain intact.

Two older production migrations (`20261005113956` and `20261005114027`) are still absent from this repository, and their SQL could not be recovered from repository history. Do not run `supabase db push` from this checkout until those originals are recovered from a trusted backup or the schema/migration state has been reconciled and reviewed. `supabase/config.toml` now disables seeding because the referenced `supabase/seed.sql` is absent and no safe seed contents are known. The local Auth redirect allow-list now uses HTTP for both loopback hostnames, matching the local `site_url`; production Auth settings remain unchanged. Local Supabase CLI/Docker/PostgreSQL are not part of this checkout's available environment, so no disposable-database migration run is claimed.

## Owner-only actions still pending

- Supabase Dashboard → Authentication → Security and Protection: enable leaked-password protection if the project plan supports it. Supabase documents this feature as available on paid plans; this project was shown on the Free plan at review time. Recheck the current plan and setting in the Dashboard. [Supabase password security](https://supabase.com/docs/guides/auth/password-security).
- The two reviewed SQL migrations have been applied to production and verified; keep this repository’s migration filenames aligned with Supabase migration history.
- Supply and approve the missing business policy information listed above before treating any policy page as final. Those pages remain visibly marked as drafts and are set `noindex` until approved.
- Review and deploy this branch before verifying live security headers, `/robots.txt`, `/sitemap.xml`, responsive rendering, and reset/confirmation URLs. The Vercel header configuration only takes effect after deployment.

## Image and release details

The hero's original PNG remains intact for fallback. New responsive WebP versions are used through `<picture>`; the 1376px WebP is about 71 KB compared with the original PNG's about 2.3 MB. The logo WebP is about 5.5 KB compared with the source PNG's about 568 KB. The social preview is 1200×630 JPEG. Do not remove source images until a deployed visual comparison confirms the alternatives.

`@supabase/supabase-js` remains a browser-native CDN module because this site has no bundler/build pipeline. The import is pinned to `2.118.0`; the browser still depends on esm.sh availability. No service-role credential is present in client code.

## Suggested safe rollout and rollback

1. Recover/reconcile the two missing migration sources before using the normal linked migration workflow. Back up the live schema and booking data.
2. Review the two new SQL files and check the live `public.bookings` constraint/rows and `set_review_display_name` trigger/ACL. Apply the booking compatibility migration and function-grant migration through the authorized Supabase process only after approval. Confirm both migration history and runtime checks.
3. Deploy the website branch to a Vercel preview. Exercise the booking/auth/review flows, mobile layouts, CSP console/network requests, social preview, and the sitemap/robots responses. Approve production promotion only after review.
4. Roll back the Vercel deployment to the previous deployment if the UI, auth, CSP, or headers fail. The booking migration can be rolled back by restoring the prior compatibility constraint (after confirming all current rows satisfy it); the grant migration can be rolled back by granting `EXECUTE` back to `authenticated`. Keep the new constraints and RLS in place during rollback planning; do not reset the database.

## Local verification

- `node --test` runs the repository's tests plus static checks for the new booking migration, assets, SEO routes, and header/hash consistency.
- `node --check` can validate each JavaScript file. Use the project's existing static hosting setup for a local browser preview; this repository has no production build step.
- The two approved production database migrations were applied and verified. No website deployment or production Auth dashboard change was performed.
