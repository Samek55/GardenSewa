-- Real Khalti Payment Gateway checkout for the lead-unlock fee, replacing the
-- static QR + screenshot + admin-review flow (lead_unlock_requests) for
-- gardeners going through the new initiate-lead-payment/verify-lead-payment
-- functions. The old manual flow and its tables are left untouched — this is
-- purely additive so there's no migration risk to the existing path.
--
-- pidx is Khalti's own payment identity; the unique constraint is what makes
-- verify-lead-payment's compare-and-swap safe against double-processing the
-- same transaction (see verify-lead-payment/index.ts).
create table if not exists lead_unlock_payments (
  id bigint generated always as identity primary key,
  booking_id bigint not null references booking(booking_id),
  gardener_phone text not null,
  amount numeric not null,
  pidx text not null unique,
  payment_url text not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Completed', 'Failed', 'Expired')),
  khalti_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lead_unlock_payments_booking_gardener_idx
  on lead_unlock_payments (booking_id, gardener_phone);

alter table lead_unlock_payments enable row level security;
revoke all on lead_unlock_payments from anon, authenticated;
grant select, insert, update, delete on lead_unlock_payments to service_role;
