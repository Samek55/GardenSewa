import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);
const VALID_STATUS = new Set(['open', 'solved']);

// Combines HomeSewa's "Save Note" and "Mark as Solved" (HelpBoxDetail.tsx) —
// both are the same update with a different target status, so one endpoint
// covers both instead of two near-identical ones.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !BACK_OFFICE_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { id, status, issue, reply } = await req.json();
    if (!id || !VALID_STATUS.has(status)) {
      return json({ success: false, message: 'id and a valid status are required' }, 400);
    }

    const { data: updated, error } = await supabaseAdmin
      .from('helpbox')
      .update({ status, issue: issue || null, reply: reply || null, modified_at: new Date().toISOString() })
      .eq('id', id)
      .select('id');
    if (error) throw new Error(error.message);
    if (!updated || updated.length === 0) {
      return json({ success: false, message: 'No request matched.' }, 404);
    }

    return json({ success: true });
  } catch (e) {
    console.error('update-helpbox-request error:', e);
    return json({ success: false, message: 'Could not save' }, 500);
  }
});
