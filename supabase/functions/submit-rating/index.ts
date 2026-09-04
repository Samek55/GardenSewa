import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Two-way rating on a completed booking. The gardener side is
// session-verified (real auth exists); the customer side trusts the phone
// the client claims, same real limitation HomeSewa has for its equivalent —
// customers have no session token in this app's model (see
// 0010_ratings_and_messages.sql's comment). Only ratings on a Completed
// booking are accepted, and unique(booking_id, rater_role) blocks a second
// submission from either side.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { bookingId, raterRole, raterPhone, rating, comment } = await req.json();
    if (!bookingId || !['customer', 'gardener'].includes(raterRole) || !rating || rating < 1 || rating > 5) {
      return json({ success: false, message: 'bookingId, a valid raterRole, and a 1-5 rating are required' }, 400);
    }

    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('phone, status, accepted_by_phone')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!booking) return json({ success: false, message: 'Booking not found' }, 404);
    if (booking.status !== 'Completed') {
      return json({ success: false, message: 'This job is not marked completed yet.' }, 400);
    }

    let actualRaterPhone: string;
    let ratedPhone: string;

    if (raterRole === 'gardener') {
      const session = await verifySession(req);
      if (!session || session.role !== 'gardener') {
        return json({ success: false, message: 'Please log in again.' }, 401);
      }
      const { data: account } = await supabaseAdmin
        .from('gardener_account')
        .select('phone')
        .eq('id', session.gardenerAccountId)
        .maybeSingle();
      if (!account || cleanPhone(booking.accepted_by_phone || '') !== account.phone) {
        return json({ success: false, message: 'This job was not accepted by you.' }, 403);
      }
      actualRaterPhone = account.phone;
      ratedPhone = booking.phone;
    } else {
      const cleaned = cleanPhone(raterPhone);
      if (!cleaned || cleaned !== cleanPhone(booking.phone)) {
        return json({ success: false, message: 'Not authorized to rate this booking.' }, 403);
      }
      actualRaterPhone = cleaned;
      ratedPhone = booking.accepted_by_phone;
    }

    const { error } = await supabaseAdmin.from('booking_ratings').upsert(
      {
        booking_id: bookingId,
        rater_role: raterRole,
        rater_phone: actualRaterPhone,
        rated_phone: ratedPhone,
        rating,
        comment: comment || null,
      },
      { onConflict: 'booking_id,rater_role' }
    );
    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('submit-rating error:', e);
    return json({ success: false, message: 'Could not submit rating' }, 500);
  }
});
