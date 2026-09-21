import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Records a professional passing on an open Public job (see
// 0027_booking_rejections.sql). Private jobs can't be rejected — per HR the
// assigned professional never rejects, an admin revokes instead. The
// re-notify push is a separate client call (notifyBookingReopened), same
// client-orchestrated pattern as accept-booking + notifyBookingAccepted.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'gardener') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId } = await req.json();
    if (!bookingId) return json({ success: false, message: 'bookingId is required' }, 400);

    const { data: account } = await supabaseAdmin
      .from('gardener_account')
      .select('phone, status')
      .eq('id', session.gardenerAccountId)
      .maybeSingle();
    if (!account || account.status !== 'Active') {
      return json({ success: false, message: 'Your account is not active' }, 403);
    }

    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('status, visibility')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!booking) return json({ success: false, message: 'Booking not found' }, 404);
    if (booking.status !== 'New / Open') {
      return json({ success: false, message: 'This job is no longer open.' }, 409);
    }
    if (booking.visibility === 'private') {
      return json({ success: false, message: 'A Private job can only be revoked by an admin.' }, 403);
    }

    const { error } = await supabaseAdmin
      .from('booking_rejections')
      .upsert([{ booking_id: bookingId, gardener_phone: account.phone }], {
        onConflict: 'booking_id,gardener_phone',
        ignoreDuplicates: true,
      });
    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('reject-booking error:', e);
    return json({ success: false, message: 'Could not reject this job' }, 500);
  }
});
