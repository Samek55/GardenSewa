import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { checkOtp } from '../_shared/otp.ts';
import { notifyStaffOfBooking } from '../_shared/staffAlerts.ts';

// The customer booking form inserts through the anon key (see
// PostApiBooking.js) and can't read the row back, so the booking this OTP
// confirms is found here as that phone's most recent customer booking.
// Alerting only after verification (not on insert) keeps anyone with the anon
// key from making the office phones receive SMS for fake bookings.
const BOOKING_LOOKBACK_MINUTES = 30;

async function alertStaffForVerifiedBooking(phone: string) {
  const { data: booking } = await supabaseAdmin
    .from('booking')
    .select('booking_id, full_name, service, area, phone')
    .like('phone', `%${phone}`)
    .eq('booking_source', 'customer')
    .gte('created_at', new Date(Date.now() - BOOKING_LOOKBACK_MINUTES * 60_000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!booking) {
    console.error('verify-otp: no recent booking found to alert staff for', phone);
    return;
  }
  await notifyStaffOfBooking({ ...booking, phone });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, purpose, code } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned || !purpose || !code) {
      return json({ verified: false, message: 'Invalid request' }, 400);
    }

    const result = await checkOtp(cleaned, purpose, code);
    if (result.verified && purpose === 'booking') {
      await alertStaffForVerifiedBooking(cleaned).catch((e) => console.error('booking staff alert error:', e));
    }
    return json({ verified: result.verified, message: result.message }, result.status);
  } catch (e) {
    console.error('verify-otp error:', e);
    return json({ verified: false, message: 'Verification failed' }, 500);
  }
});
