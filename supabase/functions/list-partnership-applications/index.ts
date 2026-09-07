import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Business-development-adjacent, same viewer set as gardener applications
// (see list-gardener-applications' CAN_VIEW comment).
const CAN_VIEW = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !CAN_VIEW.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { data, error } = await supabaseAdmin
      .from('partnership')
      .select(
        'id, full_name, organization, phone, email, area, no_of_employees, business_type, ' +
        'services_offered, partnership_interest, hear_about_us, message, company_photos, ' +
        'registration_documents, status, created_at'
      )
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return json({ success: true, applications: data });
  } catch (e) {
    console.error('list-partnership-applications error:', e);
    return json({ success: false, message: 'Could not load partnership applications' }, 500);
  }
});
