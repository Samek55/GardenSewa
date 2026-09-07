-- Back-office accounts had nowhere to store a profile photo (only `gardener`,
-- the application-time table, has one — see 0001_create_gardener_table.sql's
-- profile_picture_url). Needed for the real Update Profile screen so a
-- super_admin/admin/bdm/call_center account can set one, mirroring HomeSewa's
-- own admin.photo_url column.
alter table admin add column if not exists photo_url text;
