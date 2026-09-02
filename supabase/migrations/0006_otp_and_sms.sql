-- OTP verification + generic SMS relay, backing send-otp/verify-otp/send-sms
-- Edge Functions. Mirrors HomeSewa's otp_codes/otp_send_log/sms_send_log
-- pattern (0001_security_hardening.sql, 0030_atomic_attempt_counters.sql,
-- 0031_sms_rate_limit.sql, 0036_otp_send_rate_limit.sql) collapsed into one
-- migration since Garden Sewa is starting this feature fresh rather than
-- retrofitting it onto years of prior schema.

create table if not exists otp_codes (
  id bigint generated always as identity primary key,
  phone text not null,
  purpose text not null,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists otp_codes_phone_purpose_idx on otp_codes (phone, purpose);

-- Daily send cap per phone+purpose. otp_codes only ever holds the latest code
-- (deleted+reinserted on every resend), so it can't answer "how many codes has
-- this phone requested today" on its own — same reasoning as HomeSewa's
-- otp_send_log: without this, verify-otp's per-code attempt lockout resets on
-- every resend, so an attacker could keep resending for unlimited guesses at a
-- 4-digit code.
create table if not exists otp_send_log (
  id bigint generated always as identity primary key,
  phone text not null,
  purpose text not null,
  created_at timestamptz not null default now()
);
create index if not exists otp_send_log_phone_purpose_idx on otp_send_log (phone, purpose, created_at);

-- Rate limit for the generic send-sms relay (no OTP code involved, e.g.
-- "application received" confirmations) — same cooldown+daily-cap shape as
-- otp_send_log, keyed by phone only since there's no purpose to scope by.
create table if not exists sms_send_log (
  id bigint generated always as identity primary key,
  phone text not null,
  created_at timestamptz not null default now()
);
create index if not exists sms_send_log_phone_idx on sms_send_log (phone, created_at);

alter table otp_codes enable row level security;
alter table otp_send_log enable row level security;
alter table sms_send_log enable row level security;

-- Service-role only (the Edge Functions) — no anon/authenticated access to
-- any of these three; RLS enabled with no policy means default-deny.
revoke all on otp_codes, otp_send_log, sms_send_log from anon, authenticated;
grant select, insert, update, delete on otp_codes, otp_send_log, sms_send_log to service_role;

-- Atomic increment, same as HomeSewa's increment_otp_attempts — a plain
-- read-then-write in verify-otp would let parallel guesses all read the same
-- stale `attempts` value, so MAX_ATTEMPTS would never actually trip under
-- concurrent brute force.
create or replace function public.increment_otp_attempts(p_id bigint)
returns int
language sql
security definer
set search_path = public
as $$
  update otp_codes set attempts = attempts + 1 where id = p_id returning attempts;
$$;

revoke all on function public.increment_otp_attempts(bigint) from public, anon, authenticated;
grant execute on function public.increment_otp_attempts(bigint) to service_role;
