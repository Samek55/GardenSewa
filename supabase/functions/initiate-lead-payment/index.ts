import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';
import { initiateKhaltiPayment } from '../_shared/khalti.ts';
import { reconcilePayment } from '../_shared/leadUnlockPayments.ts';

// Fee is a server-side constant, never trusted from the client — matches the
// NPR 100 constant the old static-QR flow hardcoded in booking/pay.js.
const LEAD_FEE_NPR = 100;
const WEBSITE_URL = 'https://gardensewa.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'gardener') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId, returnUrl } = await req.json();
    if (!bookingId || !returnUrl) {
      return json({ success: false, message: 'bookingId and returnUrl are required' }, 400);
    }

    // Must be the app's own deep link (gardensewa://..., or exp://... in dev),
    // never a plain http(s) URL — see the bridge comment below for why, and
    // this also stops lead-payment-return from being used as an open
    // redirect to an arbitrary site if returnUrl were ever tampered with.
    let returnUrlScheme: string;
    try {
      returnUrlScheme = new URL(returnUrl).protocol;
    } catch {
      return json({ success: false, message: 'Invalid return URL' }, 400);
    }
    if (returnUrlScheme === 'http:' || returnUrlScheme === 'https:') {
      return json({ success: false, message: 'Invalid return URL' }, 400);
    }

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
      .select('booking_id')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!booking) return json({ success: false, message: 'Booking not found' }, 404);

    const { data: existingUnlock } = await supabaseAdmin
      .from('lead_unlocks')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('gardener_phone', account.phone)
      .maybeSingle();
    if (existingUnlock) {
      return json({ success: true, alreadyUnlocked: true });
    }

    // Reuse an existing pending payment instead of minting a fresh Khalti
    // pidx on every tap — avoids charging twice if the gardener taps Pay
    // more than once before completing checkout. If Khalti actually
    // confirms it as Completed here (e.g. the gardener paid but the app
    // never got to call verify-lead-payment), reconcile finalizes the
    // unlock right here instead of starting a second payment.
    const { data: pendingPayment } = await supabaseAdmin
      .from('lead_unlock_payments')
      .select('id, booking_id, gardener_phone, amount, pidx, payment_url, status')
      .eq('booking_id', bookingId)
      .eq('gardener_phone', account.phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingPayment && pendingPayment.status === 'Pending') {
      const outcome = await reconcilePayment(pendingPayment);
      if (outcome.status === 'Completed') {
        return json({ success: true, alreadyUnlocked: true });
      }
      if (outcome.status === 'Pending') {
        return json({ success: true, paymentUrl: pendingPayment.payment_url, pidx: pendingPayment.pidx });
      }
      // Failed/Expired/amount_mismatch — fall through to mint a fresh payment.
    }

    // Khalti's initiate API rejects a return_url that isn't a real http(s)
    // URL, so the app's own deep link can't be handed to it directly —
    // lead-payment-return is the https bridge that Khalti redirects the
    // browser to, which then forwards the gardener straight to returnUrl.
    const khaltiReturnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/lead-payment-return?app_return_url=${encodeURIComponent(returnUrl)}`;

    const purchaseOrderId = `lead-${bookingId}-${account.phone}-${Date.now()}`;
    const initiated = await initiateKhaltiPayment({
      amountPaisa: LEAD_FEE_NPR * 100,
      purchaseOrderId,
      purchaseOrderName: `Lead unlock - Booking #${bookingId}`,
      returnUrl: khaltiReturnUrl,
      websiteUrl: WEBSITE_URL,
    });

    const { error: insertError } = await supabaseAdmin.from('lead_unlock_payments').insert({
      booking_id: bookingId,
      gardener_phone: account.phone,
      amount: LEAD_FEE_NPR,
      pidx: initiated.pidx,
      payment_url: initiated.payment_url,
      status: 'Pending',
    });
    if (insertError) throw new Error(insertError.message);

    return json({ success: true, paymentUrl: initiated.payment_url, pidx: initiated.pidx });
  } catch (e) {
    console.error('initiate-lead-payment error:', e);
    // Include the real reason in the response itself, not just the server
    // log — this flow has already needed three separate rounds of digging
    // through Dashboard logs to find the actual cause behind a generic
    // message (wrong website_url, then an invalid return_url, then an
    // unhandled Khalti lookup quirk). Surfacing it directly means the next
    // unknown failure is diagnosable from the app alone.
    const detail = e instanceof Error ? e.message : String(e);
    return json({ success: false, message: `Could not start payment: ${detail}` }, 500);
  }
});
