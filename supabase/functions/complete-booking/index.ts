import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';
import { checkOtp } from '../_shared/otp.ts';

// Mirrors HomeSewa's real WorkCompletionOTP.tsx flow (OTP sent to the
// customer, read aloud to the gardener, gardener enters it to confirm) but
// folds the OTP check and the status write into one atomic server-side call
// instead of HomeSewa's two separate client-driven steps (a direct
// verify-otp call, then an unrelated client update against an openly-
// writable `booking` table) — GardenSewa's `booking` table isn't
// client-writable at all past insert, so this has to be one function anyway,
// and doing it this way also closes a real gap: two independent client calls
// can't guarantee the write only happens because the OTP actually checked out.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'gardener') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId, code, completionPhotos } = await req.json();
    if (!bookingId || !code) {
      return json({ success: false, message: 'bookingId and code are required' }, 400);
    }

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
      .select('phone, status, accepted_by_phone')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!bookingRow) return json({ success: false, message: 'Booking not found' }, 404);
    if (cleanPhone(bookingRow.accepted_by_phone || '') !== account.phone) {
      return json({ success: false, message: 'This job was not accepted by you.' }, 403);
    }

    const otpResult = await checkOtp(bookingRow.phone, 'work-completion', code);
    if (!otpResult.verified) {
      return json({ success: false, message: otpResult.message || 'Incorrect OTP' }, otpResult.status);
    }

    // Atomic CAS on status, same guard as accept-booking — prevents a retried
    // request (or two calls racing) from double-firing the completion.
    const { data: claimed, error } = await supabaseAdmin
      .from('booking')
      .update({
        status: 'Completed',
        completion_photos: Array.isArray(completionPhotos) ? completionPhotos : [],
      })
      .eq('booking_id', bookingId)
      .eq('status', 'Pending')
      .select('booking_id')
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!claimed) {
      return json({ success: false, message: 'This booking was already updated.' }, 409);
    }

    return json({ success: true });
  } catch (e) {
    console.error('complete-booking error:', e);
    return json({ success: false, message: 'Could not mark this job as completed' }, 500);
  }
});
