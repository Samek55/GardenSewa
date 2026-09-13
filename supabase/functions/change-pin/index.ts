// bcrypt-ts, not bcryptjs — see admin-login's comment: bcryptjs fails to boot
// on this project's Edge Runtime with a bare BOOT_ERROR.
import { compare, hash } from 'npm:bcrypt-ts@5';
import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// "Change PIN while logged in, prove the old one" — the second mode
// reset-pin.ts's own comment anticipated ("trivial to add a mode param later
// if a Change PIN screen for logged-in accounts shows up"). Kept as its own
// function rather than a mode param on reset-pin: this one trusts the
// session + current PIN, that one trusts an OTP — different proof of
// identity, cleaner as separate functions than a branchy shared one.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session) return json({ success: false, message: 'Please log in again.' }, 401);

    const { currentPin, newPin } = await req.json();
    if (!currentPin || !newPin || String(newPin).length !== 4) {
      return json({ success: false, message: 'Invalid request' }, 400);
    }

    const isGardener = session.role === 'gardener';
    const table = isGardener ? 'gardener_account' : 'admin';
    const id = isGardener ? session.gardenerAccountId : session.adminId;

    const { data: account } = await supabaseAdmin
      .from(table)
      .select('id, pin_hash')
      .eq('id', id)
      .maybeSingle();
    if (!account) return json({ success: false, message: 'Account not found.' }, 404);

    const matches = account.pin_hash ? await compare(String(currentPin), account.pin_hash) : false;
    if (!matches) return json({ success: false, message: 'Current PIN is incorrect.' }, 401);

    const newHash = await hash(String(newPin), 10);
    const { error } = await supabaseAdmin.from(table).update({ pin_hash: newHash }).eq('id', id);
    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('change-pin error:', e);
    return json({ success: false, message: 'Could not change PIN' }, 500);
  }
});
