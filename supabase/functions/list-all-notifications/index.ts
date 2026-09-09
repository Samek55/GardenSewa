import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// Backs the "All Notifications" history tab in the Send Notification screen
// — every notification ever sent, across every audience, same as HomeSewa's
// AdminNotifications.tsx reading its notifications table directly. Garden
// Sewa's table has no anon/authenticated grants at all (unlike HomeSewa's),
// so this is its own super-admin-only Edge Function rather than a direct
// client read.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'super_admin') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, title, body, audience, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    return json({ success: true, notifications: data });
  } catch (e) {
    console.error('list-all-notifications error:', e);
    return json({ success: false, message: 'Could not load notifications' }, 500);
  }
});
