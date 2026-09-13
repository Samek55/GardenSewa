import { corsHeaders, json } from '../_shared/cors.ts';
import { cleanPhone, supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// Public — called from the home screen before anyone is logged in, so no
// session check. The caller passes its own already-known userType
// ('Public' | 'Customer' | 'Workforce' | 'Admin') since there's no session
// to derive it from server-side. City targeting is stored on the row but
// still not enforced here — GardenSewa has no per-customer city data to
// filter against yet (see the migration's own comment) — but Profession
// targeting *is* enforced for a Workforce caller: the client passes its own
// phone (already known to it from AdminAuthContext), and this looks up that
// gardener's own area_of_expertise from their approved application to match
// against target_professions, the same vocabulary (data/servicesList
// categories) the admin composer picks from.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const userType: string = body.userType || 'Public';

    let callerProfessions: string[] = [];
    if (userType === 'Workforce' && body.phone) {
      // A phone can have more than one `gardener` application row (e.g. a
      // re-application after an earlier rejection) — .maybeSingle() would
      // throw on more than one match, so this takes the latest Approved one
      // by hand instead of asserting uniqueness.
      const { data: gardenerRows } = await supabaseAdmin
        .from('gardener')
        .select('area_of_expertise')
        .eq('phone', cleanPhone(body.phone))
        .eq('status', 'Approved')
        .order('created_at', { ascending: false })
        .limit(1);
      callerProfessions = gardenerRows?.[0]?.area_of_expertise || [];
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('popup_banners')
      .select(
        'id, title, message, image_url, button_text, button_link, ' +
        'close_countdown_enabled, close_countdown_seconds, start_date, end_date, ' +
        'target_user_types, target_professions'
      )
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);

    // Audience filter applied in code rather than the query itself — an
    // empty target_user_types/target_professions array means "everyone,"
    // which a single SQL `.contains()`/`.overlaps()` check can't express
    // cleanly alongside that default, and the candidate set here is small
    // (is_active + schedule already narrowed it) so this is cheap.
    const match = (data || []).find((row) => {
      const userTypeMatches = !row.target_user_types?.length || row.target_user_types.includes(userType);
      const professionMatches =
        !row.target_professions?.length ||
        row.target_professions.some((p: string) => callerProfessions.includes(p));
      return userTypeMatches && professionMatches;
    });

    if (!match) return json({ success: true, banner: null });

    const { target_user_types, target_professions, ...banner } = match;
    return json({ success: true, banner });
  } catch (e) {
    console.error('get-active-popup-banner error:', e);
    return json({ success: false, message: 'Could not load banner' }, 500);
  }
});
