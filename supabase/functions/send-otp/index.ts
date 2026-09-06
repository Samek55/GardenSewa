import { corsHeaders, json } from '../_shared/cors.ts';
import { cleanPhone } from '../_shared/supabaseAdmin.ts';
import { issueOtp } from '../_shared/otp.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, purpose, name } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !purpose) {
      return json({ success: false, message: 'Invalid phone or purpose' }, 400);
    }

    const result = await issueOtp(cleaned, purpose, name);
    return json({ success: result.success, message: result.message, waitSeconds: result.waitSeconds }, result.status);
  } catch (e) {
    console.error('send-otp error:', e);
    return json({ success: false, message: e instanceof Error ? e.message : 'Could not send OTP' }, 500);
  }
});
