import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

// Admin directory of customers (an OTP-verified phone number, no login/session
// of its own — see customer-login's own comment on that model). Viewing is
// open to every back-office role; only the block/unblock toggle in
// toggle-customer-status.ts is restricted further.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !BACK_OFFICE_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { data, error } = await supabaseAdmin
      .from('customer')
      .select('id, full_name, phone, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return json({ success: true, customers: data });
  } catch (e) {
    console.error('list-customers error:', e);
    return json({ success: false, message: 'Could not load customers' }, 500);
  }
});
