-- This project's public schema grants nothing to anon/authenticated by
-- default (confirmed via information_schema.role_table_grants after 0001 —
-- gardener had only REFERENCES/TRIGGER/TRUNCATE, no INSERT), unlike older
-- Supabase projects where anon/authenticated get full table grants
-- automatically and RLS is the only gate. Without this GRANT, the
-- gardener_insert_public RLS policy from 0001 is unreachable — the public
-- join form would get "permission denied for table gardener" on every
-- submit, before RLS is even evaluated.
grant insert on gardener to anon, authenticated;

-- Re-apply now that the table-level grant exists (0001 ran this against a
-- role with no insert grant at all, so it was a no-op then).
revoke insert (status) on gardener from anon, authenticated;
