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

    const { error } = await supabaseAdmin
      .from('lead_unlock_requests')
      .update({ status: 'Rejected', reviewed_by: session.adminId, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('reject-lead-unlock error:', e);
    return json({ success: false, message: 'Could not reject this request' }, 500);
  }
});
