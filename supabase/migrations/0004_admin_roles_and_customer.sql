-- Back-office accounts (Super Admin, Admin, BDM, Call Center) and a minimal
-- Customer table. Mirrors HomeSewa's admin/admin_sessions pattern exactly
-- (phone + PIN login, bcrypt-verified, opaque DB-backed session token) but
-- fully locked down from the start: HomeSewa's admin table was left USING(true)
-- open to the anon key because tightening it would've broken an admin panel
-- that already read/wrote it directly (documented in HomeSewa's own
-- 0001_security_hardening.sql). Garden Sewa's admin panel doesn't exist yet,
-- so there's no reason to inherit that gap — every read and write here goes
-- through a service-role Edge Function that enforces its own role checks.

create table if not exists admin (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  pin_hash text not null,
  role text not null check (role in ('super_admin', 'admin', 'bdm', 'call_center')),
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  allowed_cities text[],
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

-- Opaque DB-backed session token, not a stateless JWT — same reasoning as
-- HomeSewa's 0021_admin_sessions.sql: actually revocable server-side
-- (logout deletes the row), which a signed JWT can't be before it expires.
create table if not exists admin_sessions (
  token text primary key,
  admin_id uuid not null references admin(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists admin_sessions_expires_idx on admin_sessions (expires_at);

-- Minimal placeholder for the Customer role. Customer auth in HomeSewa is
-- OTP-based, and OTP is explicitly out of scope for now, so this has no
-- login flow yet — it's just the table shape ready for booking/customer
-- work to build on without a schema migration blocking it later.
create table if not exists customer (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  phone text not null unique,
  created_at timestamptz not null default now()
);

alter table admin enable row level security;
alter table admin_sessions enable row level security;
alter table customer enable row level security;

-- No policies anywhere on these three tables — anon/authenticated get zero
-- access by default-deny (RLS enabled, no policy = nothing matches). Every
-- access path is a service-role Edge Function.
revoke all on admin, admin_sessions, customer from anon, authenticated;

-- Review trail on gardener applications, for the approve/reject workflow.
alter table gardener add column if not exists reviewed_by uuid references admin(id);
alter table gardener add column if not exists reviewed_at timestamptz;
alter table gardener add column if not exists rejection_reason text;

-- Atomic failed-login counter. HomeSewa's admin-login originally did a plain
-- read-then-write here, which let concurrent guesses all read the same stale
-- failed_attempts and never actually trip the lockout — they had to patch
-- this reactively in 0030_atomic_attempt_counters.sql. Building it in from
-- the start here instead. No SECURITY DEFINER needed: the table-level
-- REVOKE ALL above already blocks anon/authenticated from the UPDATE inside,
-- so this is only ever reachable via the service-role Edge Function.
create or replace function record_admin_login_failure(
  p_id uuid,
  p_max_attempts int,
  p_lockout_minutes int
) returns void
language plpgsql
as $$
begin
  update admin
  set failed_attempts = failed_attempts + 1,
      locked_until = case
        when failed_attempts + 1 >= p_max_attempts
          then now() + (p_lockout_minutes || ' minutes')::interval
        else locked_until
      end
  where id = p_id;
end;
$$;
