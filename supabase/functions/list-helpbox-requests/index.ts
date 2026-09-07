import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

// Any back-office role can view help requests — same as HomeSewa's HelpBox.tsx,
// which only checks adminTable === 'admins' (i.e. any of its back-office
// roles), not a specific one. Call Center in particular is likely to be the
// one actually calling these customers back.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !BACK_OFFICE_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { data, error } = await supabaseAdmin
      .from('helpbox')
      .select('id, phone, status, issue, reply, created_at, modified_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    return json({ success: true, requests: data });
  } catch (e) {
    console.error('list-helpbox-requests error:', e);
    return json({ success: false, message: 'Could not load help requests' }, 500);
  }
});
