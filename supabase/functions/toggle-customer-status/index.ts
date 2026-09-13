import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const ALLOWED = new Set(['Active', 'Blocked']);

// Blocks/unblocks a customer's phone from creating new bookings — actual
// enforcement is the `booking_block_check` trigger added in
// 0019_customer_blocking.sql, since booking creation has no session/OTP gate
// to check this at. Super Admin only, same gate as staff/gardener management.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'super_admin') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { id, status } = await req.json();
    if (!id || !ALLOWED.has(status)) {
      return json({ success: false, message: 'id and a valid status are required' }, 400);
    }

    const { error } = await supabaseAdmin.from('customer').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('toggle-customer-status error:', e);
    return json({ success: false, message: 'Could not update status' }, 500);
  }
});
