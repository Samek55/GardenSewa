-- Adds the fields HomeSewa's own AdminRoadBlock composer has that
-- 0017_popup_banners.sql deliberately skipped: an internal-only name,
-- close-button countdown control (PopUpAd.js already hardcodes a 10s
-- countdown — this makes it admin-configurable instead), start/end
-- scheduling, and audience targeting. City targeting is captured here but
-- not enforced on read (see get-active-popup-banner) — GardenSewa still has
-- no per-customer city data to filter against, so it's stored for future use
-- rather than faked. User-type targeting *is* enforceable: the caller
-- already knows its own session kind (public/customer/gardener/admin)
-- without needing new customer-segmentation infra.

alter table popup_banners add column if not exists name text;
alter table popup_banners add column if not exists close_countdown_enabled boolean not null default true;
alter table popup_banners add column if not exists close_countdown_seconds int not null default 10;
alter table popup_banners add column if not exists start_date date;
alter table popup_banners add column if not exists end_date date;
alter table popup_banners add column if not exists target_cities text[] not null default '{}';
alter table popup_banners add column if not exists target_user_types text[] not null default '{}';
alter table popup_banners add column if not exists target_professions text[] not null default '{}';
