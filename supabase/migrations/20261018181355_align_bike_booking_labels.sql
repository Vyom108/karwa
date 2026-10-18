-- Align database booking values with the verified current app price (₹700 / 12 hours).
-- Add and validate before removing the old check so the operation is atomic and
-- existing rows are checked without rewriting or changing customer data.
begin;

alter table public.bookings
  add constraint bookings_service_vehicle_compatibility_700_check
  check (
    service is not null
    and vehicle is not null
    and (
      (
        service in ('Self Drive Cars', 'Car for Rent', 'Car Hire for Wedding', 'Outstation Trips')
        and vehicle in (
          'Innova', 'Swift Dzire', 'Ertiga', 'Innova Crysta', 'Etios',
          'Tempo Traveller', 'Force Urbania — 16 Seater', 'Kia Carens',
          'Ford Endeavour', 'Mahindra Thar'
        )
      )
      or (service = 'Bikes on Rent — ₹700 / 12 hours' and vehicle = 'Bike — ₹700 / 12 hours')
      or (service = 'Scooty on Rent — ₹600 / 12 hours' and vehicle = 'Scooty — ₹600 / 12 hours')
    )
  ) not valid;

alter table public.bookings
  validate constraint bookings_service_vehicle_compatibility_700_check;

alter table public.bookings
  drop constraint bookings_service_vehicle_compatibility_check;

commit;
