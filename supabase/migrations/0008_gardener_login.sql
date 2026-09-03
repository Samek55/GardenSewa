-- Bridges the gap between "gardener application approved" and "gardener can
-- actually log into the app." Mirrors HomeSewa's real split: `gardener` stays
-- pure application data (like HomeSewa's `workforce`), and this new table
-- holds login/account state (like HomeSewa's `professional`) — kept separate
-- rather than bolted onto `gardener` because that table's own `status` column
-- already means something else (review status: Waiting for Verification /
-- Approved / Rejected), and overloading it with login status (Active/
-- Inactive) would conflate two different concepts under one column.
--
-- Deliberately created only at approval time (in approve-gardener), not at
-- application time the way HomeSewa's create-professional-login front-loads
-- it — HomeSewa does that to reserve the phone number against duplicate
-- pending applications, but Garden Sewa's `gardener` table has no such
-- uniqueness requirement today, so there's nothing to reserve early.
create table if not exists gardener_account (
  id uuid primary key default gen_random_uuid(),
  gardener_id uuid not null references gardener(id),
  full_name text not null,
  phone text not null unique,
  pin_hash text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists gardener_account_phone_idx on gardener_account (phone);

alter table gardener_account enable row level security;
revoke all on gardener_account from anon, authenticated;
grant select, insert, update, delete on gardener_account to service_role;

-- admin_sessions previously assumed every session belongs to the `admin`
-- table (admin_id was NOT NULL). A logged-in gardener needs a session row
-- too, so this adds a second, equally-real foreign key rather than HomeSewa's
-- looser approach (its admin_sessions has no FK at all — just a denormalized
-- phone + admin_table string). The check constraint keeps referential
-- integrity while still supporting both session kinds: exactly one of
-- admin_id / gardener_account_id must be set, never both, never neither.
alter table admin_sessions alter column admin_id drop not null;
alter table admin_sessions add column if not exists gardener_account_id uuid references gardener_account(id) on delete cascade;
alter table admin_sessions add constraint admin_sessions_exactly_one_owner
  check ((admin_id is not null) <> (gardener_account_id is not null));

-- Same atomic-increment shape as record_admin_login_failure, targeting
-- gardener_account instead — kept as a separate function rather than
-- generalizing the existing one, to avoid touching an already-working,
-- already-deployed code path for admin-login's own lockout.
create or replace function record_gardener_login_failure(
  p_id uuid,
  p_max_attempts int,
  p_lockout_minutes int
) returns void
language plpgsql
as $$
begin
  update gardener_account
  set failed_attempts = failed_attempts + 1,
      locked_until = case
        when failed_attempts + 1 >= p_max_attempts
          then now() + (p_lockout_minutes || ' minutes')::interval
        else locked_until
      end
  where id = p_id;
end;
$$;

revoke all on function record_gardener_login_failure(uuid, int, int) from public, anon, authenticated;
grant execute on function record_gardener_login_failure(uuid, int, int) to service_role;
