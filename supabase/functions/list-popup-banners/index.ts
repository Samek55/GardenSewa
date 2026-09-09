import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Any back-office role can manage the popup banner — same as HomeSewa's
// AdminRoadBlock.tsx, which only checks adminTable === 'admins' (any of its
// back-office roles), not a specific one.
const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !BACK_OFFICE_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { data, error } = await supabaseAdmin
      .from('popup_banners')
      .select('id, title, message, image_url, button_text, button_link, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    return json({ success: true, banners: data });
  } catch (e) {
    console.error('list-popup-banners error:', e);
    return json({ success: false, message: 'Could not load banners' }, 500);
  }
});
