-- "Become a Partner" (app/(all)/becomeAPartner.js) — the form existed but had
-- nowhere to actually submit to (no table, and the OTP step was missing its
-- purpose param so even that failed). Mirrors gardener's insert-only public
-- form pattern: anon can only ever INSERT, never read back any row.
create table if not exists partnership (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  organization text not null,
  phone text not null,
  email text,
  area text not null,
  no_of_employees text not null,
  business_type text not null,
  services_offered text[] not null default '{}',
  partnership_interest text not null,
  hear_about_us text not null,
  message text,
  company_photos text[] not null default '{}',
  registration_documents text[] not null default '{}',
  status text not null default 'New' check (status in ('New', 'Reviewed')),
  created_at timestamptz not null default now(),

  constraint partnership_services_max_5 check (array_length(services_offered, 1) is null or array_length(services_offered, 1) <= 5)
);
create index if not exists partnership_status_idx on partnership (status);

alter table partnership enable row level security;

create policy partnership_insert_public on partnership
  for insert
  to anon, authenticated
  with check (true);

-- Explicit GRANT alongside the RLS policy — this project's grant
-- materialization has been unreliable for brand-new tables (see
-- 0009_booking_and_leads.sql's comment), so pair the two every time rather
-- than trusting the policy alone.
grant insert on partnership to anon, authenticated;
grant select, insert, update, delete on partnership to service_role;
revoke insert (status) on partnership from anon, authenticated;
