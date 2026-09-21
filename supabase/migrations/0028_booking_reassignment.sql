-- HR spec Function 5: a Private job's assignee never rejects — an admin revokes
-- and reassigns instead (see reassign-booking).

-- One-shot claim for the 'booking-published' push/SMS. send-notification has no
-- session check, so without this anyone holding the anon key could re-fire the
-- assignee's SMS by repeating the call. publish never sets it; reassign resets
-- it to null so the new assignee gets exactly one notification.
alter table booking add column if not exists publish_notified_at timestamptz;

-- Audit trail of who was taken off a job, and the claim for the "job taken
-- back" push to that professional ('booking-revoked' in send-notification).
create table if not exists booking_assignment_history (
  id bigint generated always as identity primary key,
  booking_id bigint not null references booking(booking_id) on delete cascade,
  gardener_phone text not null,
  revoked_by_admin_id uuid references admin(id),
  revoked_at timestamptz not null default now(),
  notified_at timestamptz
);

alter table booking_assignment_history enable row level security;
revoke all on booking_assignment_history from anon, authenticated;
grant select, insert, update, delete on booking_assignment_history to service_role;
