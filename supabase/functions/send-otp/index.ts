import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { sendSms } from '../_shared/easyservice.ts';

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 45;
const MAX_PER_DAY = 8;

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// One entry per OTP purpose in the app. Add new purposes here as new flows
// need OTP — mirrors HomeSewa's send-otp shape.
const MESSAGES: Record<string, (code: string, name: string) => string> = {
  'join-gardener': (code, name) =>
    `Dear ${name}, your Garden Sewa Gardener application OTP code is ${code}.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
  'customer-login': (code) =>
    `Your Garden Sewa login OTP code is ${code}.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, purpose, name } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !purpose || !MESSAGES[purpose]) {
      return json({ success: false, message: 'Invalid phone or purpose' }, 400);
    }

    // Daily cap per phone+purpose — see otp_send_log's migration comment for why
    // this can't be derived from otp_codes alone (it's overwritten on every resend).
    const { count: sentToday } = await supabaseAdmin
      .from('otp_send_log')
      .select('id', { count: 'exact', head: true })
      .eq('phone', cleaned)
      .eq('purpose', purpose)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString());
    if ((sentToday || 0) >= MAX_PER_DAY) {
      return json({ success: false, message: 'Too many OTP requests for this number today. Please try again tomorrow.' }, 429);
    }

    // Resend cooldown — without this, anyone could hammer this endpoint to
    // SMS-bomb an arbitrary Nepali number for free at the EasyService account's expense.
    const { data: existing } = await supabaseAdmin
      .from('otp_codes')
      .select('id, created_at')
      .eq('phone', cleaned)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const secondsSinceLastSend = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
        return json({ success: false, message: `Please wait ${waitSeconds}s before requesting another code.`, waitSeconds }, 429);
      }
    }

    // 4-digit code — matches the 4-box OTP UI in phoneVerification.js.
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

    // Invalidate the previous code for this phone+purpose first, so resending never
    // leaves an older row around for verify-otp's "latest row" lookup to conflict with.
    await supabaseAdmin.from('otp_codes').delete().eq('phone', cleaned).eq('purpose', purpose);

    const { error } = await supabaseAdmin
      .from('otp_codes')
      .insert([{ phone: cleaned, purpose, code_hash: codeHash, expires_at: expiresAt }]);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from('otp_send_log').insert([{ phone: cleaned, purpose }]);

    const text = MESSAGES[purpose](code, (name?.split(' ')?.[0]) || 'Applicant');
    await sendSms(cleaned, text);

    return json({ success: true });
  } catch (e) {
    console.error('send-otp error:', e);
    return json({ success: false, message: e instanceof Error ? e.message : 'Could not send OTP' }, 500);
  }
});
