import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Same review authority as gardener applications — Call Center is
// deliberately excluded (view-only elsewhere, no reason to grant it here).
const CAN_REVIEW = new Set(['super_admin', 'admin', 'bdm']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !CAN_REVIEW.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let query = supabaseAdmin
      .from('lead_unlock_requests')
      .select('id, booking_id, gardener_phone, proof_url, reference_note, status, reviewed_at, created_at')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return json({ success: true, requests: data });
  } catch (e) {
    console.error('list-lead-unlock-requests error:', e);
    return json({ success: false, message: 'Could not load payment requests' }, 500);
  }
});
