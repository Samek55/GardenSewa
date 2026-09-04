import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Same trust model as submit-rating: gardener side session-verified, customer
// side trusts the claimed phone (no session exists for customers in this
// app). Only allowed once a booking has actually been accepted — chatting
// about an unclaimed "New / Open" job makes no sense, there's no
// relationship yet.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { bookingId, senderRole, senderPhone, body } = await req.json();
    if (!bookingId || !['customer', 'gardener'].includes(senderRole) || !body?.trim()) {
      return json({ success: false, message: 'bookingId, a valid senderRole, and a message body are required' }, 400);
    }

    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('phone, status, accepted_by_phone')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!booking) return json({ success: false, message: 'Booking not found' }, 404);
    if (!booking.accepted_by_phone) {
      return json({ success: false, message: 'This job has not been accepted yet.' }, 400);
    }

    let actualSenderPhone: string;

    if (senderRole === 'gardener') {
      const session = await verifySession(req);
      if (!session || session.role !== 'gardener') {
        return json({ success: false, message: 'Please log in again.' }, 401);
      }
      const { data: account } = await supabaseAdmin
        .from('gardener_account')
        .select('phone')
        .eq('id', session.gardenerAccountId)
        .maybeSingle();
      if (!account || cleanPhone(booking.accepted_by_phone) !== account.phone) {
        return json({ success: false, message: 'This job was not accepted by you.' }, 403);
      }
      actualSenderPhone = account.phone;
    } else {
      const cleaned = cleanPhone(senderPhone);
      if (!cleaned || cleaned !== cleanPhone(booking.phone)) {
        return json({ success: false, message: 'Not authorized to message on this booking.' }, 403);
      }
      actualSenderPhone = cleaned;
    }

    const { error } = await supabaseAdmin.from('booking_messages').insert([{
      booking_id: bookingId,
      sender_role: senderRole,
      sender_phone: actualSenderPhone,
      body: body.trim(),
    }]);
    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('send-booking-message error:', e);
    return json({ success: false, message: 'Could not send message' }, 500);
  }
});
