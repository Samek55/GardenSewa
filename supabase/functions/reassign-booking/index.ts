import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Takes a Private job off its assigned professional and gives it to another
// (HR spec Function 5). Only allowed while the job is still 'New / Open' —
// once the assignee accepts it (Pending) it's locked to them. The pushes
// (new assignee via 'booking-published', old assignee via 'booking-revoked')
// are separate client calls, same client-orchestrated pattern as publish.
const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !ALLOWED_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId, newGardenerPhone } = await req.json();
    if (!bookingId || !newGardenerPhone) {
      return json({ success: false, message: 'bookingId and newGardenerPhone are required' }, 400);
    }

    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('status, visibility, assigned_gardener_phone')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!booking) return json({ success: false, message: 'Booking not found' }, 404);
    if (booking.status !== 'New / Open' || booking.visibility !== 'private' || !booking.assigned_gardener_phone) {
      return json({ success: false, message: 'Only a Private job that has not been accepted yet can be reassigned.' }, 409);
    }
    const oldPhone = booking.assigned_gardener_phone;
    if (newGardenerPhone === oldPhone) {
      return json({ success: false, message: 'That professional is already assigned to this job.' }, 400);
    }

    const { data: account } = await supabaseAdmin
      .from('gardener_account')
      .select('phone, status')
      .eq('phone', newGardenerPhone)
      .maybeSingle();
    if (!account || account.status !== 'Active') {
      return json({ success: false, message: 'That professional is not an active account.' }, 400);
    }

    // Atomic claim — guards against the assignee accepting, or another admin
    // reassigning, between the read above and this write.
    const { data: updated, error } = await supabaseAdmin
      .from('booking')
      .update({ assigned_gardener_phone: account.phone, publish_notified_at: null })
      .eq('booking_id', bookingId)
      .eq('status', 'New / Open')
      .eq('visibility', 'private')
      .eq('assigned_gardener_phone', oldPhone)
      .select('booking_id')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) {
      return json({ success: false, message: 'This job just changed — refresh and try again.' }, 409);
    }

    const { error: historyError } = await supabaseAdmin
      .from('booking_assignment_history')
      .insert([{ booking_id: bookingId, gardener_phone: oldPhone, revoked_by_admin_id: session.adminId }]);
    if (historyError) console.error('reassign-booking history insert failed:', historyError);

    return json({ success: true });
  } catch (e) {
    console.error('reassign-booking error:', e);
    return json({ success: false, message: 'Could not reassign this job' }, 500);
  }
});
