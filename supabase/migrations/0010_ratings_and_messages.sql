-- Two-way rating and in-app chat, scoped to a single booking. Mirrors
-- HomeSewa's real booking_ratings/booking_messages shape (rater/sender role,
-- phone-keyed rows, one rating per direction per booking), with one
-- deliberate departure: HomeSewa leaves both tables with zero RLS at all —
-- fully open to the anon key for read AND write on every booking, documented
-- as accepted debt because neither side authenticates via Supabase Auth.
-- GardenSewa's gardener side *does* have a real, verifiable session
-- (gardener_account + admin_sessions), so that half doesn't need to inherit
-- the gap — every gardener-side write goes through a session-checked Edge
-- Function instead of a raw open table. The customer side genuinely has no
-- session to check against (same constraint HomeSewa has — OTP-verified
-- phone, remembered locally, no token), so a customer action still trusts
-- the phone the client claims; that limitation is real and not fixed here,
-- just no longer worse than it has to be for the gardener half.
create table if not exists booking_ratings (
  id bigint generated always as identity primary key,
  booking_id bigint not null references booking(booking_id),
  rater_role text not null check (rater_role in ('customer', 'gardener')),
  rater_phone text not null,
  rated_phone text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id, rater_role)
);
create index if not exists booking_ratings_booking_idx on booking_ratings (booking_id);
create index if not exists booking_ratings_rated_idx on booking_ratings (rated_phone);

alter table booking_ratings enable row level security;
revoke all on booking_ratings from anon, authenticated;
grant select, insert, update, delete on booking_ratings to service_role;

create table if not exists booking_messages (
  id bigint generated always as identity primary key,
  booking_id bigint not null references booking(booking_id),
  sender_role text not null check (sender_role in ('customer', 'gardener')),
  sender_phone text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists booking_messages_booking_idx on booking_messages (booking_id, created_at);

alter table booking_messages enable row level security;
revoke all on booking_messages from anon, authenticated;
grant select, insert, update, delete on booking_messages to service_role;
