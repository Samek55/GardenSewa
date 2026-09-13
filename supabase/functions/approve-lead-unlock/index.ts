import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const CAN_REVIEW = new Set(['super_admin', 'admin', 'bdm']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !CAN_REVIEW.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { id } = await req.json();
    if (!id) return json({ success: false, message: 'id is required' }, 400);

    // Atomic CAS on status, same guard as accept-booking/complete-booking —
    // without the `.eq('status', 'Pending')`, two admins acting on the same
    // request near-simultaneously (or a double-tap) could both succeed,
    // flipping it back and forth and firing duplicate/contradictory
    // approve+reject push notifications to the gardener.
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('lead_unlock_requests')
      .update({ status: 'Approved', reviewed_by: session.adminId, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'Pending')
      .select('booking_id, gardener_phone')
      .maybeSingle();
    if (claimError) throw new Error(claimError.message);
    if (!claimed) return json({ success: false, message: 'This request was already reviewed.' }, 409);

    // Actually unlocks the contact — see 0009_booking_and_leads.sql's comment
    // on why lead_unlocks is a separate table from the pending-review one.
    const { error: unlockError } = await supabaseAdmin.from('lead_unlocks').upsert(
      { booking_id: claimed.booking_id, gardener_phone: claimed.gardener_phone },
      { onConflict: 'booking_id,gardener_phone' }
    );
    if (unlockError) throw new Error(unlockError.message);

    return json({ success: true });
  } catch (e) {
    console.error('approve-lead-unlock error:', e);
    return json({ success: false, message: 'Could not approve this request' }, 500);
  }
});
