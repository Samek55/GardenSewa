-- Customers had no session token at all: list-my-bookings, send-booking-message,
-- submit-rating, and list-booking-messages all trusted a bare client-supplied
-- phone number to decide whose data to return/act as. That let anyone who
-- knew (or guessed) a customer's phone number pull their entire booking
-- history — address, budget, schedule, work description, photos, payment
-- status — with a single unauthenticated call to list-my-bookings, no OTP or
-- booking id required. This gives customers the same opaque DB-backed
-- session pattern admin/gardener already have (see 0004's admin_sessions),
-- minted once by customer-login right after a real OTP check, so those
-- endpoints can verify the claimed phone against something the caller
-- actually proved rather than just asserted.
create table if not exists customer_sessions (
  token text primary key,
  phone text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists customer_sessions_expires_idx on customer_sessions (expires_at);
create index if not exists customer_sessions_phone_idx on customer_sessions (phone);

alter table customer_sessions enable row level security;
-- Same default-deny as admin_sessions — every access path is a service-role
-- Edge Function, never the anon/authenticated key directly.
revoke all on customer_sessions from anon, authenticated;
grant select, insert, update, delete on customer_sessions to service_role;
