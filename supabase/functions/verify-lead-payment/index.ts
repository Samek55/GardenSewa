import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';
import { reconcilePayment } from '../_shared/leadUnlockPayments.ts';

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

    // pidx is always looked up server-side from the payment row we created
    // in initiate-lead-payment — never trusted from the client, so there's
    // no way to point this at someone else's transaction.
    const { data: payment } = await supabaseAdmin
      .from('lead_unlock_payments')
      .select('id, booking_id, gardener_phone, amount, pidx, payment_url, status')
      .eq('booking_id', bookingId)
      .eq('gardener_phone', account.phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!payment) {
      return json({ success: false, message: 'No payment found for this booking' }, 404);
    }

    const outcome = await reconcilePayment(payment);

    if (outcome.status === 'Completed') {
      return json({ success: true, status: 'Completed' });
    }
    if (outcome.status === 'Pending') {
      return json({ success: true, status: 'Pending' });
    }
    return json(
      { success: false, status: 'Failed', message: 'Payment was not completed. Please try again.' },
      200
    );
  } catch (e) {
    console.error('verify-lead-payment error:', e);
    // See initiate-lead-payment's matching comment — surfacing the real
    // reason here too, so an unexpected failure doesn't need a Dashboard
    // log lookup to diagnose.
    const detail = e instanceof Error ? e.message : String(e);
    return json({ success: false, message: `Could not verify payment: ${detail}` }, 500);
  }
});
