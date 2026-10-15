-- The production database currently has no user INSERT/UPDATE grants for
-- bookings or reviews. Add only the column privileges the browser app needs.
-- Apply this migration deliberately after reviewing the Supabase setup notes.

begin;

alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.admin_users enable row level security;

-- A stable per-user token makes retry after a lost response idempotent.
alter table public.bookings
  add column request_token uuid;

update public.bookings
set request_token = gen_random_uuid()
where request_token is null;

alter table public.bookings
  alter column request_token set default gen_random_uuid(),
  alter column request_token set not null;

alter table public.bookings
  add constraint bookings_user_request_token_key unique (user_id, request_token);

-- Date checks use Diu local time. The former CURRENT_DATE check used the
-- database timezone and could reject a valid same-day trip before midnight UTC.
alter table public.bookings
  drop constraint if exists bookings_travel_date_check;

-- Validate new and changed rows without forcing a rewrite of historical rows.
alter table public.bookings
  add constraint bookings_service_vehicle_compatibility_check
  check (
    service is not null
    and vehicle is not null
    and (
      service in ('Self Drive Cars', 'Car for Rent', 'Car Hire for Wedding', 'Outstation Trips')
      and vehicle in (
        'Innova', 'Swift Dzire', 'Ertiga', 'Innova Crysta', 'Etios',
        'Tempo Traveller', 'Force Urbania — 16 Seater', 'Kia Carens',
        'Ford Endeavour', 'Mahindra Thar'
      )
    )
    or (service = 'Bikes on Rent — ₹900 / 12 hours' and vehicle = 'Bike — ₹900 / 12 hours')
    or (service = 'Scooty on Rent — ₹600 / 12 hours' and vehicle = 'Scooty — ₹600 / 12 hours')
  ) not valid;

alter table public.bookings
  add constraint bookings_customer_phone_format_check
  check (
    customer_phone is not null
    and
    customer_phone = btrim(customer_phone)
    and customer_phone ~ '^\+?[0-9][0-9 ()-]{6,18}[0-9]$'
    and length(regexp_replace(customer_phone, '[^0-9]', '', 'g')) between 8 and 15
  ) not valid;

alter table public.bookings
  add constraint bookings_customer_name_normalized_check
  check (
    customer_name is not null
    and customer_name = btrim(customer_name)
    and char_length(customer_name) between 1 and 70
  ) not valid;

alter table public.bookings
  add constraint bookings_pickup_location_normalized_check
  check (
    pickup_location is not null
    and pickup_location = btrim(pickup_location)
    and char_length(pickup_location) between 1 and 100
  ) not valid;

alter table public.bookings
  add constraint bookings_destination_length_check
  check (destination is null or (destination = btrim(destination) and char_length(destination) <= 100)) not valid;

alter table public.bookings
  add constraint bookings_customer_message_length_check
  check (customer_message is null or (customer_message = btrim(customer_message) and char_length(customer_message) <= 300)) not valid;

alter table public.bookings
  add constraint bookings_user_required_check
  check (user_id is not null) not valid;

-- Keep the review-name trigger scoped and safe if its function is ever called
-- in a session with a modified search_path.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$function$;

create or replace function public.can_review_booking(p_booking_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_user_id = (select auth.uid()) and exists (
    select 1
    from public.bookings
    where id = p_booking_id
      and user_id = (select auth.uid())
      and status = 'completed'
  );
$function$;

create or replace function public.set_review_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  select customer_name
  into new.reviewer_name
  from public.bookings
  where id = new.booking_id
    and user_id = new.user_id
    and user_id = (select auth.uid());

  if new.reviewer_name is null then
    raise exception 'A review must belong to the booking customer.';
  end if;

  new.status := 'pending';
  return new;
end;
$function$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.can_review_booking(uuid, uuid) from public, anon;
grant execute on function public.can_review_booking(uuid, uuid) to authenticated;
revoke all on function public.set_review_display_name() from public, anon;
grant execute on function public.set_review_display_name() to authenticated;

-- Revoke table-level access before granting the narrow operations required by
-- the frontend. RLS remains the row-level authorization boundary.
revoke all on table public.bookings from public, anon, authenticated;
revoke all on table public.reviews from public, anon, authenticated;
revoke all on table public.admin_users from public, anon, authenticated;

grant select (
  id, request_token, user_id, customer_name, customer_phone, service, vehicle,
  pickup_location, destination, travel_date, return_date, customer_message,
  terms_accepted_at, status, created_at
) on public.bookings to authenticated;
grant insert (
  request_token, user_id, customer_name, customer_phone, service, vehicle,
  pickup_location, destination, travel_date, return_date, customer_message,
  terms_accepted_at
) on public.bookings to authenticated;
grant update (status) on public.bookings to authenticated;

-- Public review visitors receive only the fields displayed on the site.
grant select (reviewer_name, rating, comment, created_at) on public.reviews to anon;
grant select (
  id, booking_id, user_id, reviewer_name, rating, comment, status, created_at
) on public.reviews to authenticated;
grant insert (booking_id, user_id, rating, comment) on public.reviews to authenticated;
grant update (status) on public.reviews to authenticated;

drop policy if exists "Admins can manage bookings" on public.bookings;
drop policy if exists "Customers can create their own bookings" on public.bookings;
drop policy if exists "Customers can view their own bookings" on public.bookings;

create policy "Admins can view bookings"
on public.bookings for select to authenticated
using ((select public.is_admin()));

create policy "Admins can update booking status"
on public.bookings for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Customers can create their own pending requests"
on public.bookings for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and travel_date >= ((now() at time zone 'Asia/Kolkata')::date)
);

create policy "Customers can view their own bookings"
on public.bookings for select to authenticated
using (user_id = (select auth.uid()));

-- Enforce the booking lifecycle in the database as well as the admin UI.
create or replace function public.enforce_booking_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if old.status is distinct from new.status and not (
    (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
    or (old.status = 'confirmed' and new.status in ('completed', 'cancelled'))
  ) then
    raise exception 'Invalid booking status transition from % to %', old.status, new.status
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

revoke all on function public.enforce_booking_status_transition() from public, anon, authenticated;
drop trigger if exists enforce_booking_status_transition on public.bookings;
create trigger enforce_booking_status_transition
before update of status on public.bookings
for each row execute function public.enforce_booking_status_transition();

drop policy if exists "Admins can manage reviews" on public.reviews;
drop policy if exists "Customers can submit reviews for completed bookings" on public.reviews;
drop policy if exists "Anyone can view approved reviews" on public.reviews;
drop policy if exists "Customers can view their own reviews" on public.reviews;

create policy "Admins can view reviews"
on public.reviews for select to authenticated
using ((select public.is_admin()));

create policy "Admins can update review status"
on public.reviews for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Customers can submit pending reviews for completed bookings"
on public.reviews for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and (select public.can_review_booking(booking_id, user_id))
);

create policy "Customers can view their own reviews"
on public.reviews for select to authenticated
using (user_id = (select auth.uid()));

create policy "Visitors can view approved reviews"
on public.reviews for select to anon
using (status = 'approved');

commit;
