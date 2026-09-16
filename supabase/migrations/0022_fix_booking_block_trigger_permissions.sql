-- 0019_customer_blocking.sql's booking_block_check trigger runs on every
-- `booking` insert, including the public anon-key insert from book.js. Its
-- function was declared without `security definer`, so it runs under
-- Postgres's default `security invoker` — meaning it executes as whichever
-- role is doing the insert (anon/authenticated). But 0004_admin_roles_and_
-- customer.sql explicitly revokes all privileges on `customer` from anon and
-- authenticated, so the trigger's `select 1 from customer` fails with
-- "permission denied for table customer" and the booking insert is rejected
-- outright — confirmed live, this broke every customer-facing booking
-- submission. `security definer` makes the function run as its owner
-- (which does have access to `customer`) regardless of caller; `search_path`
-- is pinned to prevent the standard security-definer search-path hijack.
create or replace function prevent_blocked_customer_booking() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from customer
    where phone = new.phone and status = 'Blocked'
  ) then
    raise exception 'This phone number is currently restricted from creating new bookings. Please contact support.';
  end if;
  return new;
end;
$$;
