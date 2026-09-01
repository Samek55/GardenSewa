import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Call Center is read-only here — they can look up an applicant while on a
// call, but only super_admin/admin/bdm can actually approve or reject
// (see approve-gardener/reject-gardener's CAN_REVIEW set).
const CAN_VIEW = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !CAN_VIEW.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let query = supabaseAdmin
      .from('gardener')
      .select(
        'id, full_name, phone, gender, blood_group, citizenship_number, issued_district, ' +
        'profile_picture_url, area_of_expertise, work_preference, expected_working_city, ' +
        'years_experience, status, created_at, reviewed_at, rejection_reason'
      )
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    // A plain "admin" (not super_admin/bdm/call_center) is scoped to their
    // allowed_cities — same pattern as HomeSewa's per-admin city scoping.
    if (session.role === 'admin') {
      const { data: adminRow } = await supabaseAdmin
        .from('admin')
        .select('allowed_cities')
        .eq('id', session.adminId)
        .maybeSingle();
      if (adminRow?.allowed_cities?.length) {
        query = query.overlaps('expected_working_city', adminRow.allowed_cities);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return json({ success: true, applications: data });
  } catch (e) {
    console.error('list-gardener-applications error:', e);
    return json({ success: false, message: 'Could not load applications' }, 500);
  }
});
