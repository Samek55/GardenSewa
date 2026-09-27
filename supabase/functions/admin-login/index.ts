// bcryptjs (both the esm.sh and npm: specifier forms) fails to boot on
// Supabase's Edge Runtime with a bare BOOT_ERROR — bcrypt-ts is a pure-TS
// implementation that boots fine and produces the same $2a$/$2b$ hash format,
// so it verifies correctly against pin_hash values written by Postgres'
// crypt(pin, gen_salt('bf')).
import { compare } from 'npm:bcrypt-ts@5';
import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { resolveLoginAccount } from '../_shared/loginAccount.ts';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_DAYS = 30;

// Shared login for both back-office accounts (admin table) and approved
// gardeners (gardener_account) — same unification HomeSewa's own admin-login
// does across its admin/professional tables, so the app only ever needs one
// login screen. Falls through to gardener_account when the phone has no
// Active back-office account (see resolveLoginAccount).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, pin } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !pin || String(pin).length < 4) {
      return json({ success: false, message: 'Invalid phone or PIN' }, 400);
    }

    const { account, isGardener } = await resolveLoginAccount(
      cleaned,
      'id, full_name, pin_hash, failed_attempts, locked_until',
    );

    if (!account) {
      return json({ success: false, message: 'Invalid phone or PIN' }, 401);
    }

    const table = isGardener ? 'gardener_account' : 'admin';
    const role = isGardener ? 'gardener' : account.role;

    if (account.locked_until && new Date(account.locked_until) > new Date()) {
      return json({ success: false, message: 'Too many failed attempts. Try again later.' }, 429);
    }

    const pinMatches = account.pin_hash ? await compare(String(pin), account.pin_hash) : false;

    if (!pinMatches) {
      await supabaseAdmin.rpc(isGardener ? 'record_gardener_login_failure' : 'record_admin_login_failure', {
        p_id: account.id,
        p_max_attempts: MAX_ATTEMPTS,
        p_lockout_minutes: LOCKOUT_MINUTES,
      });
      return json({ success: false, message: 'Invalid phone or PIN' }, 401);
    }

    // Correct PIN — reset the lockout counter.
    await supabaseAdmin.from(table).update({ failed_attempts: 0, locked_until: null }).eq('id', account.id);

    // Only a Super Admin can re-enable (toggle-admin-status /
    // toggle-gardener-status), so point them at the team rather than retrying.
    if (account.status !== 'Active') {
      return json({
        success: false,
        accountDisabled: true,
        message: 'Your account has been disabled. Please contact the Garden Sewa team at 9852024365 to enable it again.',
      });
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000).toISOString();
    await supabaseAdmin.from('admin_sessions').insert([{
      token: sessionToken,
      admin_id: isGardener ? null : account.id,
      gardener_account_id: isGardener ? account.id : null,
      role,
      expires_at: expiresAt,
    }]);

    return json({
      success: true,
      role,
      displayName: account.full_name,
      sessionToken,
    });
  } catch (e) {
    console.error('admin-login error:', e);
    return json({ success: false, message: 'Login failed' }, 500);
  }
});
