-- HR spec Function 4 (Reject Work): a professional's rejection of a Public job
-- used to be client-only (the screen just closed). This records it so the
-- rejector stops seeing the job and the remaining professionals in that job's
-- service category can be re-notified (see reject-booking and the
-- 'booking-reopened' purpose in send-notification).
create table if not exists booking_rejections (
  id bigint generated always as identity primary key,
  booking_id bigint not null references booking(booking_id) on delete cascade,
  gardener_phone text not null,
  created_at timestamptz not null default now(),
  -- Set once when this rejection's re-notify push is claimed, so the
  -- session-less send-notification endpoint can only ever fire one re-notify
  -- per real rejection.
  renotified_at timestamptz,
  constraint booking_rejections_unique unique (booking_id, gardener_phone)
);

alter table booking_rejections enable row level security;
revoke all on booking_rejections from anon, authenticated;
grant select, insert, update, delete on booking_rejections to service_role;
