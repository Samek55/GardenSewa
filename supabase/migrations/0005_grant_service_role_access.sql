-- Confirmed by live testing (admin-login couldn't find a seeded test account
-- at all — the SELECT via supabaseAdmin silently returned nothing) and by
-- information_schema.role_table_grants: service_role has zero CRUD grants on
-- admin, admin_sessions, customer, or gardener — only REFERENCES/TRIGGER/
-- TRUNCATE. This project's public schema sets up no default privileges for
-- ANY role, service_role included, unlike older Supabase projects where
-- service_role gets full table access automatically (visible by contrast:
-- service_role already has full SELECT/INSERT/UPDATE/DELETE on Supabase's
-- own storage.objects/storage.buckets, which Supabase itself provisions).
--
-- service_role already bypasses RLS (BYPASSRLS attribute), so this grant is
-- the only gate that matters for it — no RLS policy needed on top, and this
-- is safe precisely because every Edge Function using supabaseAdmin already
-- enforces its own role/session checks in application code before touching
-- these tables.
grant select, insert, update, delete on admin, admin_sessions, customer, gardener to service_role;

-- Functions default to PUBLIC having EXECUTE, but this project doesn't seem
-- to rely on that default anywhere else observed so far — grant explicitly
-- to service_role rather than assume.
grant execute on function record_admin_login_failure(uuid, int, int) to service_role;
