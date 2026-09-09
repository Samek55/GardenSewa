import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';
import { checkOtp } from '../_shared/otp.ts';

// The gardener's "Edit Schedule & Budget" screen (editSchedule.js) used to be
// entirely client-side theater: a locally-generated fake OTP and a route-param
// hand-off back to the booking detail screen, with no write to `booking` ever
// happening — reopening the booking silently reverted to the original values.
// Folds the OTP check and the update into one atomic server-side call, same
// reasoning as complete-booking: `booking` isn't client-writable past insert,
// and two independent client calls couldn't guarantee the write only happens
// because the OTP the customer read out actually checked out.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'gardener') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId, code, budget, startDate, endDate, workDescription } = await req.json();
    if (!bookingId || !code) {
      return json({ success: false, message: 'bookingId and code are required' }, 400);
    }
    if (!budget || !startDate) {
      return json({ success: false, message: 'Budget and start date are required' }, 400);
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
    if (bookingRow.status !== 'Pending') {
      return json({ success: false, message: 'Only an ongoing job\'s schedule can be edited.' }, 409);
    }

    const otpResult = await checkOtp(bookingRow.phone, 'schedule-update', code);
    if (!otpResult.verified) {
      return json({ success: false, message: otpResult.message || 'Incorrect OTP' }, otpResult.status);
    }

    const { error } = await supabaseAdmin
      .from('booking')
      .update({
        budget: String(budget).trim(),
        starting_date: startDate,
        service_completion_date: endDate || null,
        work_description: workDescription ? String(workDescription).trim() : null,
      })
      .eq('booking_id', bookingId);
    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('update-booking-schedule error:', e);
    return json({ success: false, message: 'Could not update this booking' }, 500);
  }
});
