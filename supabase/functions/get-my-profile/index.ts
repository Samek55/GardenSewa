import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Backs the one Update Profile screen shared by every logged-in role
// (super_admin/admin/bdm/call_center via `admin`, gardener via
// `gardener_account` + its linked `gardener` application row) — same split
// HomeSewa's UpdateProfile.tsx makes between its "admins" and "workforce"
// tables, just resolved from the session instead of an AsyncStorage flag.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session) return json({ success: false, message: 'Please log in again.' }, 401);

    if (session.role === 'gardener') {
      const { data: account } = await supabaseAdmin
        .from('gardener_account')
        .select('id, full_name, phone, gardener_id')
        .eq('id', session.gardenerAccountId)
        .maybeSingle();
      if (!account) return json({ success: false, message: 'Account not found.' }, 404);

      const { data: gardener } = await supabaseAdmin
        .from('gardener')
        .select('email, gender, years_experience, area_of_expertise, expected_working_city, working_area, profile_picture_url')
        .eq('id', account.gardener_id)
        .maybeSingle();

      return json({
        success: true,
        role: 'gardener',
        profile: {
          fullName: account.full_name,
          phone: account.phone,
          email: gardener?.email || '',
          gender: gardener?.gender || '',
          yearsExperience: gardener?.years_experience ?? null,
          areaOfExpertise: gardener?.area_of_expertise || [],
          expectedWorkingCity: gardener?.expected_working_city || [],
          workingArea: gardener?.working_area || '',
          photoUrl: gardener?.profile_picture_url || null,
        },
      });
    }

    const { data: admin } = await supabaseAdmin
      .from('admin')
      .select('full_name, phone, photo_url')
      .eq('id', session.adminId)
      .maybeSingle();
    if (!admin) return json({ success: false, message: 'Account not found.' }, 404);

    return json({
      success: true,
      role: session.role,
      profile: {
        fullName: admin.full_name,
        phone: admin.phone,
        photoUrl: admin.photo_url || null,
      },
    });
  } catch (e) {
    console.error('get-my-profile error:', e);
    return json({ success: false, message: 'Could not load profile' }, 500);
  }
});
