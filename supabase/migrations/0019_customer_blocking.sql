-- Admin-facing customer directory needs a block/unblock action, but `book.js`
-- inserts into `booking` directly via the anon key with no OTP or login gate
-- in the actual creation path (OTP is sent only as a soft confirmation after
-- the row already exists — see phoneVerification.js). So blocking can't be
-- enforced client-side or at customer-login; it has to be a database-level
-- check on every `booking` insert, admin-submitted or not.

alter table customer add column if not exists status text not null default 'Active'
  check (status in ('Active', 'Blocked'));

create or replace function prevent_blocked_customer_booking() returns trigger
language plpgsql
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

drop trigger if exists booking_block_check on booking;
create trigger booking_block_check
  before insert on booking
  for each row
  execute function prevent_blocked_customer_booking();
