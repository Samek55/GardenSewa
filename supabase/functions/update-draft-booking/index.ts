import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Lets admin/BDM/call-center edit a request while it's still sitting in the
// Draft review queue (see 0024_booking_draft_publish_status.sql) — the same
// fields submit-booking-for-customer/index.ts accepts on create. The
// `.eq('status','Draft')` guard means this can't silently rewrite a booking
// that's already been published.
const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !ALLOWED_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const {
      bookingId, fullName, phone, service, city, area, priority, budget,
      selectShift, startingDate, serviceCompletionDate, workDescription,
    } = await req.json();

    const cleanedPhone = cleanPhone(phone);
    if (!bookingId || !cleanedPhone || !fullName || !service || !city || !area || !budget || !selectShift || !startingDate) {
      return json({ success: false, message: 'Missing required fields' }, 400);
    }

    const { data: updated, error } = await supabaseAdmin
      .from('booking')
      .update({
        full_name: fullName,
        phone: cleanedPhone,
        service,
        city,
        area,
        priority: priority || null,
        budget,
        select_shift: selectShift,
        starting_date: startingDate,
        service_completion_date: serviceCompletionDate || null,
        work_description: workDescription || null,
      })
      .eq('booking_id', bookingId)
      .eq('status', 'Draft')
      .select('booking_id')
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!updated) {
      return json({ success: false, message: 'This request is no longer in Draft — refresh and try again.' }, 409);
    }

    return json({ success: true });
  } catch (e) {
    console.error('update-draft-booking error:', e);
    return json({ success: false, message: 'Could not update this request' }, 500);
  }
});
