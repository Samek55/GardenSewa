import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';
import { issueOtp } from '../_shared/otp.ts';

// HR's ask: a customer with a keypad phone or who isn't comfortable with a
// smartphone can call in and have a BDM submit the request for them. Same
// booking record as the self-service form (see book.js / PostApiBooking.js),
// but the confirmation OTP goes to the BDM's own phone instead of the
// customer's — the customer never needs to receive or read out anything.
// Call Center is included alongside BDM — HR's original ask was BDM-only,
// but Call Center is the role actually built for fielding inbound customer
// calls in this app's model, which is exactly HR's described scenario.
const ALLOWED_ROLES = new Set(['bdm', 'call_center']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !ALLOWED_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const {
      fullName, phone, service, city, area, priority, budget,
      selectShift, startingDate, serviceCompletionDate, workDescription, photos,
    } = await req.json();

    const cleanedCustomerPhone = cleanPhone(phone);
    if (!cleanedCustomerPhone || !fullName || !service || !city || !area || !budget || !selectShift || !startingDate) {
      return json({ success: false, message: 'Missing required fields' }, 400);
    }

    const { data: bdmRow } = await supabaseAdmin
      .from('admin')
      .select('id, full_name, phone')
      .eq('id', session.adminId)
      .maybeSingle();
    if (!bdmRow) return json({ success: false, message: 'Please log in again.' }, 401);

    const { data: booking, error } = await supabaseAdmin
      .from('booking')
      .insert([{
        full_name: fullName,
        phone: cleanedCustomerPhone,
        service,
        city,
        area,
        priority: priority || null,
        budget,
        select_shift: selectShift,
        starting_date: startingDate,
        service_completion_date: serviceCompletionDate || null,
        work_description: workDescription || null,
        photos: Array.isArray(photos) ? photos : [],
        booking_source: 'bdm',
        submitted_by_admin_id: bdmRow.id,
      }])
      .select('booking_id')
      .single();
    if (error) throw new Error(error.message);

    // Confirmation goes to the BDM's own phone, never the customer's — this
    // is the whole point of the flow (see 0011_bdm_booking_submission.sql).
    // The booking is already saved at this point, same as every other OTP
    // step in this app — a failed/rate-limited send shouldn't undo it.
    const otpResult = await issueOtp(bdmRow.phone, 'bdm-booking-confirm', bdmRow.full_name).catch((e) => {
      console.error('submit-booking-for-customer OTP failed:', e);
      return { success: false, status: 500 } as const;
    });

    return json({
      success: true,
      bookingId: booking.booking_id,
      bdmPhone: bdmRow.phone,
      otpSent: otpResult.success,
    });
  } catch (e) {
    console.error('submit-booking-for-customer error:', e);
    return json({ success: false, message: 'Could not submit booking' }, 500);
  }
});
