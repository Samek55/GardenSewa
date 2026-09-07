-- send-notification's insert into `notifications` never actually conformed to
-- the audience vocabulary 0007_notifications.sql documented in its own
-- comment ('admin_reviewers' | 'customer_specific' | 'all') — it was writing
-- the raw internal purpose key instead (e.g. 'lead-unlock-approved'), which
-- made the log impossible to query per-viewer. Enforcing it now with a real
-- CHECK, and adding 'gardener_specific' since two purposes (lead-unlock
-- approved/rejected) target a gardener's phone, not a customer's — a case
-- the original three-value comment didn't anticipate.
-- NOT VALID: existing rows were written with the old (unenforced) shape —
-- raw purpose keys, no audience_phone — before this fix. Grandfathering them
-- in rather than guessing a remapping for historical data; every row from
-- here on is validated against the real enum.
alter table notifications add constraint notifications_audience_check
  check (audience in ('admin_reviewers', 'gardener_specific', 'customer_specific', 'all')) not valid;
