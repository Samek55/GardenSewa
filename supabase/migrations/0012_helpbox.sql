-- "Help Box" — a customer who isn't ready to book yet (or just has a
-- question) leaves their phone number from the home screen and gets called
-- back, OTP-verified the same way a booking is. Mirrors HomeSewa's real
-- helpbox feature (NumberBar.tsx -> helpboxOTP.tsx -> admin/HelpBox.tsx),
-- with one deliberate departure: HomeSewa's `helpbox` table has zero RLS at
-- all, openly readable/writable by the anon key (same documented-debt
-- pattern as its booking/ratings/messages tables) — closed here the same way
-- everything else in Garden Sewa already is: anon gets nothing, every read
-- and write goes through a service-role Edge Function.
create table if not exists helpbox (
  id bigint generated always as identity primary key,
  phone text not null,
  status text not null default 'open' check (status in ('open', 'solved')),
  issue text,
  reply text,
  created_at timestamptz not null default now(),
  modified_at timestamptz
);
create index if not exists helpbox_status_idx on helpbox (status, created_at desc);

alter table helpbox enable row level security;
revoke all on helpbox from anon, authenticated;
grant select, insert, update, delete on helpbox to service_role;
