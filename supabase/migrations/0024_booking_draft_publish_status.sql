-- Admin dashboard rework (HR spec, Functions 1-3): every booking now needs to
-- sit in a 'Draft' review queue before an admin/call-center publishes it,
-- either 'Public' (today's open marketplace, unchanged) or 'Private'
-- (assigned to one specific gardener). Neither creation path (book.js's
-- direct anon insert, nor submit-booking-for-customer/index.ts) sets `status`
-- explicitly, so flipping the column default alone routes both into Draft —
-- no changes needed at either insert site.
alter table booking drop constraint if exists booking_status_check;
alter table booking add constraint booking_status_check
  check (status in ('Draft', 'New / Open', 'Pending', 'Completed', 'Cancelled'));
alter table booking alter column status set default 'Draft';

-- Set only at publish time (see publish-booking). Null for any booking still
-- in Draft, and treated as public by list-open-bookings for safety.
alter table booking add column if not exists visibility text
  check (visibility in ('public', 'private'));

-- Phone-identity, no FK — same pattern as the existing accepted_by_phone
-- column, since gardener identity throughout this codebase is phone-keyed
-- (OneSignal external_id is also the phone, see phoneVerification.js).
alter table booking add column if not exists assigned_gardener_phone text;
