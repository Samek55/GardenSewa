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
// missing, unknown, or expired, or its account has since been disabled;
// callers should treat that as "not logged in."
export async function verifySession(req: Request): Promise<AdminSession | null> {
  const token = req.headers.get('x-admin-session-token');
  if (!token) return null;

  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('admin_id, gardener_account_id, role, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!data || new Date(data.expires_at) < new Date()) return null;

  // toggle-*-status already deletes a disabled account's sessions; this also
  // covers any session that outlived that (e.g. disabled before that existed).
  // Only a status actually read back as non-Active rejects — a failed lookup
  // must never sign every user out.
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from(data.admin_id ? 'admin' : 'gardener_account')
    .select('status')
    .eq('id', data.admin_id ?? data.gardener_account_id)
    .maybeSingle();
  if (ownerError) console.error('verifySession status lookup failed:', ownerError);
  if (owner && owner.status !== 'Active') {
    await supabaseAdmin.from('admin_sessions').delete().eq('token', token);
    return null;
  }

  return { adminId: data.admin_id, gardenerAccountId: data.gardener_account_id, role: data.role };
}

// Same shape/reasoning as verifySession above, but for the separate,
// lightweight customer_sessions table (see 0029_customer_sessions.sql) —
// customers were previously identified purely by a client-claimed phone
// string with nothing behind it. Reads the `x-customer-session-token`
// header (never Authorization, same reason as verifySession) and returns the
// phone that OTP verification actually proved at customer-login, or null if
// the token is missing, unknown, or expired.
export async function verifyCustomerSession(req: Request): Promise<{ phone: string } | null> {
  const token = req.headers.get('x-customer-session-token');
  if (!token) return null;

  const { data } = await supabaseAdmin
    .from('customer_sessions')
    .select('phone, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!data || new Date(data.expires_at) < new Date()) return null;

  return { phone: data.phone };
}
