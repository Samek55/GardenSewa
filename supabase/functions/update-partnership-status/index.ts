import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const CAN_VIEW = new Set(['super_admin', 'admin', 'bdm', 'call_center']);
const VALID_STATUS = new Set(['New', 'Reviewed']);

// Both HomeSewa and RocketSingh leave partnership review as view-only (no
// approve/reject); this "New/Reviewed" toggle is the one lightweight bit of
// workflow state Garden Sewa adds on top, same shape as helpbox's
// open/solved status — not a HomeSewa/RocketSingh feature to match, just a
// small usability addition.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !CAN_VIEW.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { id, status } = await req.json();
    if (!id || !VALID_STATUS.has(status)) {
      return json({ success: false, message: 'id and a valid status are required' }, 400);
    }

    const { data: updated, error } = await supabaseAdmin
      .from('partnership')
      .update({ status })
      .eq('id', id)
      .select('id');
    if (error) throw new Error(error.message);
    if (!updated || updated.length === 0) {
      return json({ success: false, message: 'No application matched.' }, 404);
    }

    return json({ success: true });
  } catch (e) {
    console.error('update-partnership-status error:', e);
    return json({ success: false, message: 'Could not save' }, 500);
  }
});
