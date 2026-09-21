-- HR spec Function 4, final step: after Finalize (complete-booking) the customer
-- pays via the static SRIYOG QR outside the app. HR said no confirmation is
-- needed, so this is a self-reported flag the gardener sets (see
-- mark-booking-paid) purely to give admin/finance a paper trail — it is not
-- proof of payment. Only meaningful once status = 'Completed'.
alter table booking add column if not exists payment_status text not null default 'Pending'
  check (payment_status in ('Pending', 'Paid'));
alter table booking add column if not exists paid_at timestamptz;
