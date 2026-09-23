import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { checkOtp } from '../_shared/otp.ts';

// Garden Sewa's customer identity model started out mirroring HomeSewa's:
// no session table, just an OTP-verified phone remembered locally on the
// device via AuthContext. That left list-my-bookings, submit-rating, and
// send-booking-message trusting a bare client-claimed phone with nothing
// behind it — anyone who knew a customer's number could read their full
// booking history. This now also mints an opaque, DB-backed session token
// (see 0029_customer_sessions.sql) right after the OTP check succeeds, same
// pattern as admin-login's admin_sessions, so those endpoints have something
// real to verify the claimed phone against instead of just trusting it.
const SESSION_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, code, fullName } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !code) {
      return json({ verified: false, message: 'Invalid request' }, 400);
    }

    const result = await checkOtp(cleaned, 'customer-login', code);
    if (!result.verified) {
      return json({ verified: false, message: result.message }, result.status);
    }

    const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';

    const { data: existing } = await supabaseAdmin
      .from('customer')
      .select('id, full_name')
      .eq('phone', cleaned)
      .maybeSingle();

    if (existing) {
      // Only overwrite the name if a new one was actually given — a returning
      // customer logging in with the name field left blank keeps their
      // existing name rather than getting it wiped to null.
      if (trimmedName && trimmedName !== existing.full_name) {
        await supabaseAdmin.from('customer').update({ full_name: trimmedName }).eq('id', existing.id);
      }
    } else {
      await supabaseAdmin.from('customer').insert([{ phone: cleaned, full_name: trimmedName || null }]);
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000).toISOString();
    await supabaseAdmin.from('customer_sessions').insert([{ token: sessionToken, phone: cleaned, expires_at: expiresAt }]);

    return json({
      verified: true,
      sessionToken,
      customer: { phone: cleaned, fullName: trimmedName || existing?.full_name || null },
    });
  } catch (e) {
    console.error('customer-login error:', e);
    return json({ verified: false, message: 'Login failed' }, 500);
  }
});
