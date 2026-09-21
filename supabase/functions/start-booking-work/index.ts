import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';
import { checkOtp } from '../_shared/otp.ts';
import { parsePlainAmount } from '../_shared/amount.ts';

// The "Start Work" milestone (HR spec Function 4) — sits between accept-booking
// (New / Open -> Pending) and the already-existing Update/Finalize actions
// (update-booking-schedule / complete-booking, both untouched). Same
// OTP-check-and-write-atomically pattern as those two: the client sends the
// OTP itself first (via sendOtp, purpose 'start-work'), then this call
// verifies it and writes in one step so a write can never happen without a
// verified code.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'gardener') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId, code, budget, startDate, endDate, workDescription, photos, documents } = await req.json();
    if (!bookingId || !code) {
      return json({ success: false, message: 'bookingId and code are required' }, 400);
    }
    if (!budget || !startDate) {
      return json({ success: false, message: 'Budget and start date are required' }, 400);
    }
    if (!Array.isArray(documents) || documents.length === 0) {
      return json({ success: false, message: 'At least one document is required to start work.' }, 400);
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
      .select('phone, status, accepted_by_phone, work_started_at')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!bookingRow) return json({ success: false, message: 'Booking not found' }, 404);
    if (cleanPhone(bookingRow.accepted_by_phone || '') !== account.phone) {
      return json({ success: false, message: 'This job was not accepted by you.' }, 403);
    }
    if (bookingRow.status !== 'Pending') {
      return json({ success: false, message: 'Only an ongoing job can be started.' }, 409);
    }
    if (bookingRow.work_started_at) {
      return json({ success: false, message: 'This job has already been started.' }, 409);
    }

    const otpResult = await checkOtp(bookingRow.phone, 'start-work', code, String(bookingId));
    if (!otpResult.verified) {
      return json({ success: false, message: otpResult.message || 'Incorrect OTP' }, otpResult.status);
    }

    // Atomic CAS — same double guard as accept-booking/complete-booking,
    // plus .is('work_started_at', null) so a retried/duplicate call can't
    // re-stamp an already-started job.
    const newAmount = parsePlainAmount(budget);
    const { data: started, error } = await supabaseAdmin
      .from('booking')
      .update({
        budget: String(budget).trim(),
        ...(newAmount !== null ? { deal_amount: newAmount } : {}),
        starting_date: startDate,
        service_completion_date: endDate || null,
        work_description: workDescription ? String(workDescription).trim() : null,
        work_start_photos: Array.isArray(photos) ? photos : [],
        work_documents: documents,
        work_started_at: new Date().toISOString(),
      })
      .eq('booking_id', bookingId)
      .eq('status', 'Pending')
      .is('work_started_at', null)
      .select('booking_id')
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!started) {
      return json({ success: false, message: 'This job has already been started.' }, 409);
    }

    return json({ success: true });
  } catch (e) {
    console.error('start-booking-work error:', e);
    return json({ success: false, message: 'Could not start this job' }, 500);
  }
});
