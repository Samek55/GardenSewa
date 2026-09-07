import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { checkOtp } from '../_shared/otp.ts';

// A customer leaves their phone number from the home screen and gets called
// back — no login, OTP-verified the same as a booking. Mirrors HomeSewa's
// helpboxOTP.tsx, but folds the OTP check and the row insert into one atomic
// server-side call instead of HomeSewa's two separate client calls, the same
// way customer-login already does — necessary here anyway since Garden
// Sewa's `helpbox` table isn't client-writable at all (see
// 0012_helpbox.sql), unlike HomeSewa's openly-writable one.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, code } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !code) {
      return json({ verified: false, message: 'Invalid request' }, 400);
    }

    const result = await checkOtp(cleaned, 'helpbox', code);
    if (!result.verified) {
      return json({ verified: false, message: result.message }, result.status);
    }

    const { error } = await supabaseAdmin.from('helpbox').insert([{ phone: cleaned, status: 'open' }]);
    if (error) throw new Error(error.message);

    return json({ verified: true });
  } catch (e) {
    console.error('submit-helpbox error:', e);
    return json({ verified: false, message: 'Could not submit your request' }, 500);
  }
});
