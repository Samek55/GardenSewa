// bcryptjs (both the esm.sh and npm: specifier forms) fails to boot on
// Supabase's Edge Runtime with a bare BOOT_ERROR — bcrypt-ts is a pure-TS
// implementation that boots fine and produces the same $2a$/$2b$ hash format,
// so it verifies correctly against pin_hash values written by Postgres'
// crypt(pin, gen_salt('bf')).
import { compare } from 'npm:bcrypt-ts@5';
import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, pin } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !pin || String(pin).length < 4) {
      return json({ success: false, message: 'Invalid phone or PIN' }, 400);
    }

    const { data: account } = await supabaseAdmin
      .from('admin')
      .select('id, full_name, status, pin_hash, role, failed_attempts, locked_until')
      .eq('phone', cleaned)
      .maybeSingle();

    if (!account) {
      return json({ success: false, message: 'Invalid phone or PIN' }, 401);
    }

    if (account.locked_until && new Date(account.locked_until) > new Date()) {
      return json({ success: false, message: 'Too many failed attempts. Try again later.' }, 429);
    }

    const pinMatches = account.pin_hash ? await compare(String(pin), account.pin_hash) : false;

    if (!pinMatches) {
      await supabaseAdmin.rpc('record_admin_login_failure', {
        p_id: account.id,
        p_max_attempts: MAX_ATTEMPTS,
        p_lockout_minutes: LOCKOUT_MINUTES,
      });
      return json({ success: false, message: 'Invalid phone or PIN' }, 401);
    }

    // Correct PIN — reset the lockout counter.
    await supabaseAdmin.from('admin').update({ failed_attempts: 0, locked_until: null }).eq('id', account.id);

    if (account.status !== 'Active') {
      return json({ success: false, message: `Account status: ${account.status}` });
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000).toISOString();
    await supabaseAdmin.from('admin_sessions').insert([{
      token: sessionToken,
      admin_id: account.id,
      role: account.role,
      expires_at: expiresAt,
    }]);

    return json({
      success: true,
      role: account.role,
      displayName: account.full_name,
      sessionToken,
    });
  } catch (e) {
    console.error('admin-login error:', e);
    return json({ success: false, message: 'Login failed' }, 500);
  }
});
