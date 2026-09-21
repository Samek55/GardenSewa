import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Self-reported "customer paid" flag (see 0026_booking_payment_status.sql) —
// the payment itself happens outside the app via the static SRIYOG QR, so
// there is nothing to verify against; this only records that the gardener
// who did the job says it was paid.
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

    const { data: bookingRow } = await supabaseAdmin
      .from('booking')
      .select('accepted_by_phone')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!bookingRow) return json({ success: false, message: 'Booking not found' }, 404);
    if (cleanPhone(bookingRow.accepted_by_phone || '') !== account.phone) {
      return json({ success: false, message: 'This job was not accepted by you.' }, 403);
    }

    // Atomic CAS — a retried or double-tapped call can't re-stamp paid_at.
    const { data: marked, error } = await supabaseAdmin
      .from('booking')
      .update({ payment_status: 'Paid', paid_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('status', 'Completed')
      .eq('payment_status', 'Pending')
      .select('booking_id')
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!marked) {
      return json({ success: false, message: 'This job is not awaiting payment.' }, 409);
    }

    return json({ success: true });
  } catch (e) {
    console.error('mark-booking-paid error:', e);
    return json({ success: false, message: 'Could not update payment status' }, 500);
  }
});
