import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const CAN_VIEW = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

// Generates a short-lived signed URL for a gardener's private citizenship/NID
// upload — the client's anon key has no read access to the id-documents
// bucket at all (see supabase/migrations/0001_create_gardener_table.sql), so
// this is the only way to view that document, and only for a logged-in
// reviewer.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !CAN_VIEW.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { id } = await req.json();
    if (!id) return json({ success: false, message: 'id is required' }, 400);

    const { data: row } = await supabaseAdmin
      .from('gardener')
      .select('citizenship_nid_path')
      .eq('id', id)
      .maybeSingle();

    if (!row?.citizenship_nid_path) return json({ success: false, message: 'Not found' }, 404);

    const { data, error } = await supabaseAdmin.storage
      .from('id-documents')
      .createSignedUrl(row.citizenship_nid_path, 60);

    if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not generate document link');

    return json({ success: true, url: data.signedUrl });
  } catch (e) {
    console.error('get-gardener-document-url error:', e);
    return json({ success: false, message: 'Could not generate document link' }, 500);
  }
});
