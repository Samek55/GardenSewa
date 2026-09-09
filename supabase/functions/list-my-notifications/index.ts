import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);
const SELECT_COLUMNS = 'id, title, body, screen, link_id, created_at';

// The real in-app notification inbox HomeSewa/RocketSingh both have —
// send-notification already logs every push it sends to `notifications`
// (see 0007/0015); this just reads that log back, scoped to whichever
// identity the caller actually holds. Three distinct identity models in this
// app, so three branches: a staff/gardener session token proves who they
// are server-side, but a customer has no session at all (OTP-verified phone
// only, remembered locally) — same trust model as list-my-bookings.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    let query;

    if (session?.role === 'gardener') {
      const { data: account } = await supabaseAdmin
        .from('gardener_account')
        .select('phone')
        .eq('id', session.gardenerAccountId)
        .maybeSingle();
      if (!account) return json({ success: false, message: 'Please log in again.' }, 401);
      query = supabaseAdmin
        .from('notifications')
        .select(SELECT_COLUMNS)
        .or(`and(audience.eq.gardener_specific,audience_phone.eq.${account.phone}),audience.eq.gardener_all,audience.eq.all`);
    } else if (session && BACK_OFFICE_ROLES.has(session.role)) {
      query = supabaseAdmin
        .from('notifications')
        .select(SELECT_COLUMNS)
        .in('audience', ['admin_reviewers', 'all']);
    } else {
      const body = await req.json().catch(() => ({}));
      const cleaned = cleanPhone(body.phone);
      if (cleaned) {
        query = supabaseAdmin
          .from('notifications')
          .select(SELECT_COLUMNS)
          .or(`and(audience.eq.customer_specific,audience_phone.eq.${cleaned}),audience.eq.customer_all,audience.eq.all`);
      } else {
        // No session and no phone — an anonymous visitor. Not an error, just
        // nothing personal to show; company-wide broadcasts only.
        query = supabaseAdmin.from('notifications').select(SELECT_COLUMNS).eq('audience', 'all');
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);

    return json({ success: true, notifications: data });
  } catch (e) {
    console.error('list-my-notifications error:', e);
    return json({ success: false, message: 'Could not load notifications' }, 500);
  }
});
