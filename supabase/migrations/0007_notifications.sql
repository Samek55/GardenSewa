-- Push-notification audit log, written by the send-notification Edge Function
-- alongside every OneSignal push it sends. Mirrors HomeSewa's notifications
-- history table, trimmed to what Garden Sewa actually has callers for right
-- now (no service/city columns — those back HomeSewa's professional-by-area
-- targeting, which Garden Sewa's booking system doesn't have yet).

create table if not exists notifications (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  title text not null,
  body text not null,
  screen text,              -- deep-link route, paired with the `data.screen` sent to OneSignal
  link_id text,              -- paired with screen, e.g. a gardener application id
  audience text not null,   -- 'admin_reviewers' | 'customer_specific' | 'all'
  audience_phone text       -- set when audience = 'customer_specific'
);

create index if not exists notifications_audience_idx on notifications (audience, created_at desc);

alter table notifications enable row level security;

-- Service-role only (the Edge Function) — no anon/authenticated access.
-- A future "My Notifications" admin screen reads this through its own
-- Edge Function (session-checked), same pattern as list-gardener-applications,
-- not direct anon/authenticated table access.
revoke all on notifications from anon, authenticated;
grant select, insert on notifications to service_role;
