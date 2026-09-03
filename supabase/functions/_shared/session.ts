import { supabaseAdmin } from './supabaseAdmin.ts';

// adminId is set for the four back-office roles, gardenerAccountId for a
// logged-in gardener — admin_sessions' own check constraint guarantees
// exactly one is non-null, never both. Existing callers that only ever
// checked session.role against the back-office role set are unaffected: a
// gardener session simply never matches those checks.
export interface AdminSession {
  adminId: string | null;
  gardenerAccountId: string | null;
  role: 'super_admin' | 'admin' | 'bdm' | 'call_center' | 'gardener';
}

// Reads the session token from the `x-admin-session-token` header — never
// Authorization, which Supabase's gateway already consumes for the anon-key
// JWT check before function code ever runs. Returns null if the token is
// missing, unknown, or expired; callers should treat that as "not logged in."
export async function verifySession(req: Request): Promise<AdminSession | null> {
  const token = req.headers.get('x-admin-session-token');
  if (!token) return null;

  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('admin_id, gardener_account_id, role, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!data || new Date(data.expires_at) < new Date()) return null;

  return { adminId: data.admin_id, gardenerAccountId: data.gardener_account_id, role: data.role };
}
