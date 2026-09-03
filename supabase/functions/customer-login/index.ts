import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { checkOtp } from '../_shared/otp.ts';

// Garden Sewa's customer identity model deliberately mirrors HomeSewa's real
// one, not the heavier PIN+session pattern used for admin/gardener accounts:
// HomeSewa has no customer login table or session token at all — a customer
// is just a phone number, verified by OTP, remembered locally on the device
// (see BookingOtp.tsx's AsyncStorage.setItem('customerPhone', ...)), with the
// `customers` row itself auto-created by a database trigger on booking
// insert, not a login endpoint. Garden Sewa has no booking table yet to hook
// that trigger to, so this function does the same upsert directly instead —
// same end state (an OTP-verified phone becomes a `customer` row), just
// reached via an explicit call rather than a side effect of another insert.
// No session token is issued; the client stores the verified phone/name
// itself via AuthContext, same as HomeSewa's local-only "logged in" state.
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

    return json({ verified: true, customer: { phone: cleaned, fullName: trimmedName || existing?.full_name || null } });
  } catch (e) {
    console.error('customer-login error:', e);
    return json({ verified: false, message: 'Login failed' }, 500);
  }
});
