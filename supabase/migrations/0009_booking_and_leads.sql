-- Core booking/job system (Phase 2). Mirrors HomeSewa's real, current
-- architecture — confirmed by reading its actual api/PostApiBooking.ts,
-- api/helper/fetchBookingData.ts, and BookingDetails_1.tsx — rather than the
-- earlier, since-dropped Khalti flow: a customer posts a job with no login,
-- gardeners browse it with the customer's identity masked, and a gardener
-- must pay a lead-unlock fee (static QR + photo proof + admin review) before
-- their contact details unlock. See lead_unlock_requests/lead_unlocks below.
--
-- One deliberate tightening over HomeSewa's real posture: HomeSewa's
-- `booking` table is fully anon-SELECT-able, so the "masking" in its UI is a
-- client-side convenience only — anyone holding the anon key can already read
-- every customer's raw phone number directly, unlock fee or not. That gap is
-- closed here the same way gardener/admin/customer already are: anon gets
-- INSERT only, every read goes through a service-role Edge Function that
-- actually enforces the mask.
create table if not exists booking (
  booking_id bigint generated always as identity primary key,
  full_name text not null,
  phone text not null,
  service text not null,
  city text not null,
  area text not null,
  priority text,
  budget text not null,
  select_shift text not null,
  starting_date date not null,
  service_completion_date date,
  work_description text,
  photos text[] not null default '{}',
  completion_photos text[] not null default '{}',
  status text not null default 'New / Open'
    check (status in ('New / Open', 'Pending', 'Completed', 'Cancelled')),
  accepted_by_phone text,
  deal_amount numeric,
  deal_note text,
  created_at timestamptz not null default now()
);
create index if not exists booking_status_idx on booking (status);
create index if not exists booking_city_area_idx on booking (city, area);

alter table booking enable row level security;

-- Public booking form can only ever create a row — same insert-only pattern
-- as gardener's join form. Both the RLS policy AND the explicit table-level
-- GRANT below are required — confirmed live that this project's grant
-- materialization is inconsistent depending on how/when a table was created
-- (gardener's anon INSERT works in practice despite has_table_privilege()
-- itself reporting false; booking's genuinely had no grant at all and a raw
-- insert failed with 42501 until this GRANT was added). RLS policy alone is
-- not a safe assumption here, so pair the two explicitly from now on.
create policy booking_insert_public on booking
  for insert
  to anon, authenticated
  with check (true);

grant insert on booking to anon, authenticated;
grant select, insert, update, delete on booking to service_role;

-- Payment proof a gardener submits after paying the lead-unlock fee via the
-- static SRIYOG Consulting QR (no gateway to verify against, so a human has
-- to look at the screenshot) — reviewed by an admin before a real row is
-- inserted into lead_unlocks, which is what actually unlocks the contact.
-- Direct port of HomeSewa's real lead_unlock_requests shape.
create table if not exists lead_unlock_requests (
  id bigint generated always as identity primary key,
  booking_id bigint not null references booking(booking_id),
  gardener_phone text not null,
  proof_url text not null,
  reference_note text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  reviewed_by uuid references admin(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One row per booking+gardener — resubmitting (e.g. after rejection, or a
  -- clearer screenshot while still pending) upserts this same row rather
  -- than accumulating duplicates.
  constraint lead_unlock_requests_booking_gardener_unique unique (booking_id, gardener_phone)
);

alter table lead_unlock_requests enable row level security;
revoke all on lead_unlock_requests from anon, authenticated;
grant select, insert, update, delete on lead_unlock_requests to service_role;

-- The actual unlock — a row here means this gardener_phone can see this
-- booking's full contact details. Separate from lead_unlock_requests (the
-- pending-review layer) the same way HomeSewa keeps them separate.
create table if not exists lead_unlocks (
  id bigint generated always as identity primary key,
  booking_id bigint not null references booking(booking_id),
  gardener_phone text not null,
  unlocked_at timestamptz not null default now(),
  constraint lead_unlocks_booking_gardener_unique unique (booking_id, gardener_phone)
);

alter table lead_unlocks enable row level security;
revoke all on lead_unlocks from anon, authenticated;
grant select, insert, update, delete on lead_unlocks to service_role;
