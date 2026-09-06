-- BDM can submit a booking on behalf of a customer who can't use the app
-- themselves (keypad phone, not comfortable with a smartphone) — HR's ask.
-- Two new columns give this real audit trail rather than making a
-- BDM-submitted booking indistinguishable from a self-service one:
-- `booking_source` records how it was created, `submitted_by_admin_id` who
-- (which BDM) actually did it, mirroring how gardener applications already
-- track `reviewed_by`.
alter table booking add column if not exists booking_source text not null default 'customer'
  check (booking_source in ('customer', 'bdm'));
alter table booking add column if not exists submitted_by_admin_id uuid references admin(id);
