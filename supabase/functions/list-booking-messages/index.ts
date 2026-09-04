import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { bookingId, viewerRole, viewerPhone } = await req.json();
    if (!bookingId || !['customer', 'gardener'].includes(viewerRole)) {
      return json({ success: false, message: 'bookingId and a valid viewerRole are required' }, 400);
    }

    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('phone, accepted_by_phone')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!booking) return json({ success: false, message: 'Booking not found' }, 404);

    if (viewerRole === 'gardener') {
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
        return json({ success: false, message: 'Not authorized to view this chat.' }, 403);
      }
    } else {
      const cleaned = cleanPhone(viewerPhone);
      if (!cleaned || cleaned !== cleanPhone(booking.phone)) {
        return json({ success: false, message: 'Not authorized to view this chat.' }, 403);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('booking_messages')
      .select('id, sender_role, sender_phone, body, created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);

    return json({ success: true, messages: data });
  } catch (e) {
    console.error('list-booking-messages error:', e);
    return json({ success: false, message: 'Could not load messages' }, 500);
  }
});
