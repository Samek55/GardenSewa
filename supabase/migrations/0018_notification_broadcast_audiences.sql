-- Widens the broadcast composer to match HomeSewa's AdminNotifications.tsx
-- audience set (Admin/Customer/Professional/Public/All) rather than the
-- three-way Customers/Staff/All version this started as. 'gardener_all' is
-- for a Professional-tab broadcast (multiple gardeners, not the single
-- audience_phone 'gardener_specific' already used by lead-unlock
-- approved/rejected); 'public_all' is audit-trail only (mirrors HomeSewa's
-- notifyPublic) — no viewer branch in list-my-notifications reads it back,
-- since an anonymous, not-yet-registered install has no identity to
-- correlate it against, same as HomeSewa's own public segment.
alter table notifications drop constraint if exists notifications_audience_check;
alter table notifications add constraint notifications_audience_check
  check (audience in (
    'admin_reviewers', 'gardener_specific', 'gardener_all',
    'customer_specific', 'customer_all', 'public_all', 'all'
  )) not valid;
