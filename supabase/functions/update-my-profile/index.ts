import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Mirrors get-my-profile's split: gardener writes go to both gardener_account
// (full_name only — that's the copy shown in session-derived UI like the
// drawer and admin lists) and gardener (the full application-time profile);
// every other role only ever touches admin.full_name/photo_url. Phone is
// never editable here for anyone — it's the login identity.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session) return json({ success: false, message: 'Please log in again.' }, 401);

    const body = await req.json();
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    if (!fullName) return json({ success: false, message: 'Full name is required.' }, 400);

    if (session.role === 'gardener') {
      const { data: account } = await supabaseAdmin
        .from('gardener_account')
        .select('id, gardener_id')
        .eq('id', session.gardenerAccountId)
        .maybeSingle();
      if (!account) return json({ success: false, message: 'Account not found.' }, 404);

      const areaOfExpertise = Array.isArray(body.areaOfExpertise) ? body.areaOfExpertise.slice(0, 5) : [];
      const expectedWorkingCity = Array.isArray(body.expectedWorkingCity) ? body.expectedWorkingCity : [];
      const yearsExperience = body.yearsExperience === '' || body.yearsExperience == null
        ? null
        : Number(body.yearsExperience);

      const { error: gardenerError } = await supabaseAdmin
        .from('gardener')
        .update({
          full_name: fullName,
          email: typeof body.email === 'string' ? body.email.trim() || null : null,
          gender: body.gender || null,
          years_experience: Number.isFinite(yearsExperience) ? yearsExperience : null,
          area_of_expertise: areaOfExpertise,
          expected_working_city: expectedWorkingCity,
          working_area: typeof body.workingArea === 'string' ? body.workingArea.trim() || null : null,
          profile_picture_url: typeof body.photoUrl === 'string' ? body.photoUrl : undefined,
        })
        .eq('id', account.gardener_id);
      if (gardenerError) throw new Error(gardenerError.message);

      const { error: accountError } = await supabaseAdmin
        .from('gardener_account')
        .update({ full_name: fullName })
        .eq('id', account.id);
      if (accountError) throw new Error(accountError.message);

      return json({ success: true, fullName });
    }

    const { error } = await supabaseAdmin
      .from('admin')
      .update({
        full_name: fullName,
        photo_url: typeof body.photoUrl === 'string' ? body.photoUrl : undefined,
      })
      .eq('id', session.adminId);
    if (error) throw new Error(error.message);

    return json({ success: true, fullName });
  } catch (e) {
    console.error('update-my-profile error:', e);
    return json({ success: false, message: 'Could not save profile' }, 500);
  }
});
