import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Moves a booking out of the Draft review queue (see
// 0024_booking_draft_publish_status.sql) and into the same 'New / Open'
// status gardeners already see — either 'public' (today's open marketplace,
// unchanged) or 'private' (visible only to one assigned gardener; see the
// visibility-aware filter in list-open-bookings/index.ts). The actual
// notification is a separate client call (notifyBookingPublished), same
// client-orchestrated pattern as acceptBooking + notifyBookingAccepted.
const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !ALLOWED_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId, visibility, assignedGardenerPhone } = await req.json();
    if (!bookingId || (visibility !== 'public' && visibility !== 'private')) {
      return json({ success: false, message: 'bookingId and a valid visibility are required' }, 400);
    }

    let gardenerPhone: string | null = null;
    if (visibility === 'private') {
      if (!assignedGardenerPhone) {
        return json({ success: false, message: 'A professional must be selected for a Private job.' }, 400);
      }
      const { data: account } = await supabaseAdmin
        .from('gardener_account')
        .select('phone, status')
        .eq('phone', assignedGardenerPhone)
        .maybeSingle();
      if (!account || account.status !== 'Active') {
        return json({ success: false, message: 'That professional is not an active account.' }, 400);
      }
      gardenerPhone = account.phone;
    }

    // Atomic claim — same CAS shape as accept-booking's WHERE guard, so this
    // can't republish something someone else already moved out of Draft.
    const { data: published, error } = await supabaseAdmin
      .from('booking')
      .update({
        status: 'New / Open',
        visibility,
        assigned_gardener_phone: gardenerPhone,
      })
      .eq('booking_id', bookingId)
      .eq('status', 'Draft')
      .select('booking_id')
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!published) {
      return json({ success: false, message: 'This request is no longer in Draft — refresh and try again.' }, 409);
    }

    return json({ success: true });
  } catch (e) {
    console.error('publish-booking error:', e);
    return json({ success: false, message: 'Could not publish this request' }, 500);
  }
});
