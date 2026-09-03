import { corsHeaders, json } from '../_shared/cors.ts';
import { cleanPhone } from '../_shared/supabaseAdmin.ts';
import { checkOtp } from '../_shared/otp.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, purpose, code } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !purpose || !code) {
      return json({ verified: false, message: 'Invalid request' }, 400);
    }

    const result = await checkOtp(cleaned, purpose, code);
    return json({ verified: result.verified, message: result.message }, result.status);
  } catch (e) {
    console.error('verify-otp error:', e);
    return json({ verified: false, message: 'Verification failed' }, 500);
  }
});
