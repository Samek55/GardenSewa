import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

// Admin directory of approved, logged-in-capable gardeners — `gardener_account`
// holds login/account state, `gardener` (the original application row) holds
// the profile detail (expertise, city, experience, photo). Viewing is open to
// every back-office role, same as gardenerApplications.js; only the status
// toggle in toggle-gardener-status.ts is restricted further.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !BACK_OFFICE_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { data: accounts, error } = await supabaseAdmin
      .from('gardener_account')
      .select('id, gardener_id, full_name, phone, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const rows = accounts || [];
    const gardenerIds = rows.map((r) => r.gardener_id).filter(Boolean);

    let profilesById = new Map<string, Record<string, unknown>>();
    if (gardenerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('gardener')
        .select('id, area_of_expertise, expected_working_city, working_area, years_experience, profile_picture_url')
        .in('id', gardenerIds);
      profilesById = new Map((profiles || []).map((p) => [p.id, p]));
    }

    const gardeners = rows.map((row) => {
      const profile = profilesById.get(row.gardener_id) || {};
      return {
        id: row.id,
        fullName: row.full_name,
        phone: row.phone,
        status: row.status,
        createdAt: row.created_at,
        areaOfExpertise: profile.area_of_expertise || [],
        expectedWorkingCity: profile.expected_working_city || [],
        workingArea: profile.working_area || null,
        yearsExperience: profile.years_experience ?? null,
        profilePictureUrl: profile.profile_picture_url || null,
      };
    });

    return json({ success: true, gardeners });
  } catch (e) {
    console.error('list-gardeners error:', e);
    return json({ success: false, message: 'Could not load gardeners' }, 500);
  }
});
