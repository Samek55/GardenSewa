// bcrypt-ts, not bcryptjs — see admin-login's comment: bcryptjs fails to boot
// on this project's Edge Runtime with a bare BOOT_ERROR.
import { hash } from 'npm:bcrypt-ts@5';
import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { checkOtp } from '../_shared/otp.ts';
import { sendSms } from '../_shared/easyservice.ts';

// "Forgot PIN" only — the one flow GardenSewa's UI actually has a reachable
// entry point for (adminLogin.js's "Reset PIN" link, before the user is ever
// logged in). HomeSewa's equivalent set-pin also supports a second
// "change PIN while logged in, prove the old one" mode, but nothing in
// GardenSewa's UI links to that yet, so it isn't built here — trivial to add
// a mode param later if a "Change PIN" screen for logged-in accounts shows
// up. Covers admin and gardener accounts (both have a real pin_hash);
// customers have no PIN in this app's model at all (OTP-only), so a
// customer's phone will simply come back "not registered."
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, otpCode, newPin } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !otpCode || !newPin || String(newPin).length !== 4) {
      return json({ success: false, message: 'Invalid request' }, 400);
    }

    const { data: adminRow } = await supabaseAdmin
      .from('admin')
      .select('id, full_name')
      .eq('phone', cleaned)
      .maybeSingle();

    const isGardener = !adminRow;
    let account: { id: string; full_name: string } | null | undefined = adminRow;
    if (isGardener) {
      const { data: gardenerRow } = await supabaseAdmin
        .from('gardener_account')
        .select('id, full_name')
        .eq('phone', cleaned)
        .maybeSingle();
      account = gardenerRow;
    }

    if (!account) {
      return json({ success: false, message: 'This phone number is not registered.' }, 404);
    }

    const otpResult = await checkOtp(cleaned, 'pin-reset', otpCode);
    if (!otpResult.verified) {
      return json({ success: false, message: otpResult.message || 'Incorrect OTP' }, otpResult.status);
    }

    const table = isGardener ? 'gardener_account' : 'admin';
    const newHash = await hash(String(newPin), 10);
    const { error } = await supabaseAdmin
      .from(table)
      .update({ pin_hash: newHash, failed_attempts: 0, locked_until: null })
      .eq('id', account.id);
    if (error) throw new Error(error.message);

    // Standard practice: resetting a PIN invalidates every other session for
    // this account, the same way changing a password would.
    if (isGardener) {
      await supabaseAdmin.from('admin_sessions').delete().eq('gardener_account_id', account.id);
    } else {
      await supabaseAdmin.from('admin_sessions').delete().eq('admin_id', account.id);
    }

    const firstName = (account.full_name || '').split(' ')[0] || 'User';
    const text = `Dear ${firstName}, your Garden Sewa PIN has been changed successfully.\n\nIf you did not request this change, please contact us immediately.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`;
    await sendSms(cleaned, text).catch((e) => console.error('reset-pin confirmation SMS failed:', e));

    return json({ success: true });
  } catch (e) {
    console.error('reset-pin error:', e);
    return json({ success: false, message: 'Could not reset PIN' }, 500);
  }
});
