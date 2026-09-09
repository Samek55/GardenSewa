-- Admin-editable content for the home-screen promo popup (PopUpAd.js),
-- mirroring HomeSewa's road_blocks/AdminRoadBlock feature — previously this
-- was a hardcoded title/image/message baked into the component. Skips
-- HomeSewa's city/role/profession targeting and start/end scheduling
-- entirely (Garden Sewa has no such customer-segmentation data to target
-- against); "most recently created active row wins" is enough for a single
-- promo slot. Locked down anon-wise the same way every other table in this
-- app is (see 0012_helpbox.sql's comment) rather than HomeSewa's own openly
-- anon-readable road_blocks table: reads go through get-active-popup-banner
-- and list-popup-banners, writes through popup-banner-write.
create table if not exists popup_banners (
  id bigint generated always as identity primary key,
  title text not null,
  message text not null,
  image_url text not null,
  button_text text not null default 'View More',
  button_link text not null default '/',
  is_active boolean not null default false,
  created_by_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists popup_banners_active_idx on popup_banners (is_active, created_at desc);

alter table popup_banners enable row level security;
revoke all on popup_banners from anon, authenticated;
grant select, insert, update, delete on popup_banners to service_role;
