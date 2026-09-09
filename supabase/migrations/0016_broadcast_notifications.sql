-- Adds 'customer_all' for the new admin/super_admin "Send Notification"
-- broadcast composer (send-notification's 'admin-broadcast' purpose) — a
-- push to every customer, which is distinct from 'customer_specific'
-- (one customer, matched by audience_phone) and from 'all' (every viewer
-- regardless of role, used by the "Everyone" broadcast option). Staff-only
-- broadcasts reuse the existing 'admin_reviewers' value rather than adding
-- a parallel 'staff_all', since list-my-notifications already shows every
-- 'admin_reviewers' row to the same back-office roles a staff broadcast
-- targets.
alter table notifications drop constraint if exists notifications_audience_check;
alter table notifications add constraint notifications_audience_check
  check (audience in ('admin_reviewers', 'gardener_specific', 'customer_specific', 'customer_all', 'all')) not valid;
