import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// HomeSewa's equivalent "Admins" tab reads the `admin` table directly from the
// client, since its RLS is still USING(true) for the anon key (documented debt
// in HomeSewa's own 0001_security_hardening.sql). Garden Sewa closed that gap
// on Day 88 — zero anon/authenticated access to `admin` at all — so listing
// accounts needs its own service-role Edge Function, same pattern as
// list-gardener-applications. Super Admin only: managing back-office accounts
// is a Super Admin-only capability, same gate as admin-create/toggle-admin-status.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'super_admin') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { data, error } = await supabaseAdmin
      .from('admin')
      .select('id, full_name, phone, role, status, allowed_cities, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return json({ success: true, admins: data });
  } catch (e) {
    console.error('list-admins error:', e);
    return json({ success: false, message: 'Could not load admin accounts' }, 500);
  }
});
