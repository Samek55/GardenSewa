import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Any back-office role can manage the popup banner — same reasoning as
// list-popup-banners.
const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

const toContentFields = (input: Record<string, any>) => ({
  title: String(input.title || '').trim(),
  message: String(input.message || '').trim(),
  image_url: String(input.imageUrl || '').trim(),
  button_text: String(input.buttonText || 'View More').trim(),
  button_link: String(input.buttonLink || '/').trim(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !BACK_OFFICE_ROLES.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { action, id, isActive, row: input } = await req.json();

    if (action === 'create') {
      if (!input?.title || !input?.message || !input?.imageUrl) {
        return json({ success: false, message: 'Title, message and image are required.' }, 400);
      }
      const phone = session.adminId ? await lookupPhone(session.adminId) : null;
      const { error } = await supabaseAdmin
        .from('popup_banners')
        .insert([{ ...toContentFields(input), created_by_phone: phone }]);
      if (error) throw new Error(error.message);
      return json({ success: true });
    }

    if (action === 'update') {
      if (!id) return json({ success: false, message: 'id is required' }, 400);
      if (!input?.title || !input?.message || !input?.imageUrl) {
        return json({ success: false, message: 'Title, message and image are required.' }, 400);
      }
      const { error } = await supabaseAdmin
        .from('popup_banners')
        .update({ ...toContentFields(input), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return json({ success: true });
    }

    if (action === 'setActive') {
      if (!id) return json({ success: false, message: 'id is required' }, 400);
      const { error } = await supabaseAdmin
        .from('popup_banners')
        .update({ is_active: !!isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return json({ success: true });
    }

    return json({ success: false, message: 'Invalid action' }, 400);
  } catch (e) {
    console.error('popup-banner-write error:', e);
    return json({ success: false, message: 'Could not save banner' }, 500);
  }
});

async function lookupPhone(adminId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('admin').select('phone').eq('id', adminId).maybeSingle();
  return data?.phone || null;
}
