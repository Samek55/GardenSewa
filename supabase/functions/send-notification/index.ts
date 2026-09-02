import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// Purpose-driven like send-otp's MESSAGES map, rather than HomeSewa's more open
// "client builds the full OneSignal payload" shape — this function has no session
// requirement (the one caller so far, the public gardener join form, never holds
// one), so accepting free-text title/body/targets from the client would let anyone
// holding the anon key push arbitrary content to arbitrary recipients. Fixing the
// message and recipient lookup server-side per purpose closes that off. Add a new
// entry here (and a matching `resolveRecipients` case) for each new trigger.
const MESSAGES: Record<string, (ctx: Record<string, any>) => { title: string; body: string; screen?: string }> = {
  'gardener-application-received': (ctx) => ({
    title: 'New Gardener Application',
    body: `${ctx.applicantName || 'An applicant'} has submitted a Gardener application. Review it in Gardener Applications.`,
    screen: '/gardenerApplications',
  }),
};

// Admin/BDM/Super Admin can act on a new gardener application (see
// approve-gardener/reject-gardener's CAN_REVIEW set); Call Center is
// deliberately excluded here too — same view-only reasoning as elsewhere.
async function resolveRecipients(purpose: string): Promise<string[]> {
  if (purpose === 'gardener-application-received') {
    const { data } = await supabaseAdmin
      .from('admin')
      .select('phone')
      .in('role', ['super_admin', 'admin', 'bdm'])
      .eq('status', 'Active');
    return (data || []).map((a) => a.phone).filter(Boolean);
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const appId = Deno.env.get('EXPO_PUBLIC_ONESIGNAL_APP_ID') || Deno.env.get('ONESIGNAL_APP_ID');
    if (!restApiKey || !appId) {
      return json({ success: false, message: 'Missing OneSignal config' }, 500);
    }

    const { purpose, ...ctx } = await req.json();
    if (!purpose || !MESSAGES[purpose]) {
      return json({ success: false, message: 'Invalid purpose' }, 400);
    }

    const phones = await resolveRecipients(purpose);
    if (phones.length === 0) {
      // Not an error — e.g. no active reviewer accounts yet — but nothing to push.
      return json({ success: true, sent: false });
    }

    const { title, body, screen } = MESSAGES[purpose](ctx);

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Key ${restApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: phones },
        target_channel: 'push',
        headings: { en: title },
        contents: { en: body },
        data: screen ? { screen } : undefined,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('OneSignal send failed:', data);
      return json({ success: false, message: data?.errors?.[0] || 'OneSignal request failed' }, 502);
    }

    // Awaited deliberately — an un-awaited insert risks the edge runtime tearing
    // down before it completes, silently dropping the audit-log row.
    const { error } = await supabaseAdmin.from('notifications').insert([{
      title,
      body,
      screen: screen || null,
      audience: 'admin_reviewers',
    }]);
    if (error) console.error('notifications log insert failed:', error);

    return json({ success: true, sent: true });
  } catch (e) {
    console.error('send-notification error:', e);
    return json({ success: false, message: 'Could not send notification' }, 500);
  }
});
