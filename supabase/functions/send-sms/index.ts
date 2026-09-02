import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { sendSms } from '../_shared/easyservice.ts';

const COOLDOWN_SECONDS = 30;
const MAX_PER_DAY = 15;

// Generic SMS relay for non-OTP transactional texts (e.g. a future
// "application received" or "booking accepted" notice). No session required —
// legitimate callers here don't necessarily have one — so the rate limit below
// is the only guard against this becoming a free SMS-bombing relay against an
// arbitrary Nepali number.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, text } = await req.json();
    if (!phone || !text) return json({ success: false, message: 'phone and text are required' }, 400);

    const cleaned = cleanPhone(phone);

    const { data: recentSends } = await supabaseAdmin
      .from('sms_send_log')
      .select('created_at')
      .eq('phone', cleaned)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString());

    const sends = recentSends || [];
    if (sends.length >= MAX_PER_DAY) {
      return json({ success: false, message: 'Too many messages sent to this number today.' }, 429);
    }
    const cooldownCutoff = Date.now() - COOLDOWN_SECONDS * 1000;
    if (sends.some((s) => Date.parse(s.created_at) > cooldownCutoff)) {
      return json({ success: false, message: 'Please wait before sending another message to this number.' }, 429);
    }

    await supabaseAdmin.from('sms_send_log').insert([{ phone: cleaned }]);
    await sendSms(cleaned, text);

    return json({ success: true });
  } catch (e) {
    console.error('send-sms error:', e);
    return json({ success: false, message: e instanceof Error ? e.message : 'Could not send SMS' }, 500);
  }
});
