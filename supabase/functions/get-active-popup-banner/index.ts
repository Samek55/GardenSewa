import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// Public — called from the home screen before anyone is logged in, so no
// session check. Returns the single most-recently-created active banner, or
// null if none is active right now.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { data, error } = await supabaseAdmin
      .from('popup_banners')
      .select('id, title, message, image_url, button_text, button_link')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);

    return json({ success: true, banner: data || null });
  } catch (e) {
    console.error('get-active-popup-banner error:', e);
    return json({ success: false, message: 'Could not load banner' }, 500);
  }
});
