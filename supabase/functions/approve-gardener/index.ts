import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// BDM is included deliberately — recruiting gardeners is core Business
// Development work, so BDM gets the same review authority as Admin here.
// Call Center is intentionally excluded (view-only, see list-gardener-applications).
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

    const { error } = await supabaseAdmin
      .from('gardener')
      .update({
        status: 'Approved',
        reviewed_by: session.adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('approve-gardener error:', e);
    return json({ success: false, message: 'Could not approve this application' }, 500);
  }
});
