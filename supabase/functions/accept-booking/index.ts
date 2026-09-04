import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Requires the gardener to have already unlocked this booking's contact
// details (see approve-lead-unlock) — matches HomeSewa's BookingDetails_1.tsx,
// where the Accept/Reject buttons only render once `hasFullAccess` is true.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'gardener') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId, dealAmount, dealNote } = await req.json();
    if (!bookingId || !dealAmount || Number(dealAmount) <= 0) {
      return json({ success: false, message: 'bookingId and a positive dealAmount are required' }, 400);
    }

    const { data: account } = await supabaseAdmin
      .from('gardener_account')
      .select('phone, status')
      .eq('id', session.gardenerAccountId)
      .maybeSingle();
    if (!account || account.status !== 'Active') {
      return json({ success: false, message: 'Your account is not active' }, 403);
    }

    const { data: unlock } = await supabaseAdmin
      .from('lead_unlocks')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('gardener_phone', account.phone)
      .maybeSingle();
    if (!unlock) {
      return json({ success: false, message: 'You need to unlock this job before accepting it.' }, 403);
    }

    // Atomic claim — the WHERE status='New / Open' guard means two gardeners
    // who both unlocked the same booking can't both accept it; only the
    // first UPDATE to actually match a row wins, matching HomeSewa's
    // claimBooking semantics.
    const { data: claimed, error } = await supabaseAdmin
      .from('booking')
      .update({
        status: 'Pending',
        accepted_by_phone: account.phone,
        deal_amount: dealAmount,
        deal_note: dealNote || null,
      })
      .eq('booking_id', bookingId)
      .eq('status', 'New / Open')
      .select('booking_id')
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!claimed) {
      return json({ success: false, message: 'This job was just accepted by another gardener.' }, 409);
    }

    return json({ success: true });
  } catch (e) {
    console.error('accept-booking error:', e);
    return json({ success: false, message: 'Could not accept this job' }, 500);
  }
});
