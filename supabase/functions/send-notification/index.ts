import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// Purpose-driven like send-otp's MESSAGES map, rather than HomeSewa's more open
// "client builds the full OneSignal payload" shape — this function has no session
// requirement (none of its callers hold one), so accepting free-text
// title/body/targets from the client would let anyone holding the anon key push
// arbitrary content to arbitrary recipients. Every handler below resolves its
// recipient(s) and message content entirely server-side from a database row
// looked up by an id the client supplies — the client never gets to name a phone
// number directly, only point at a request/booking id it should already know
// (its own submission's id, or one visible in an admin-only list).
// `audience` here is what actually gets persisted to the notifications log
// (see 0007/0015's audience CHECK) and is what list-my-notifications later
// filters by — 'admin_reviewers'/'gardener_specific'/'customer_specific'
// broadcast-vs-single-recipient distinctions, matching HomeSewa/RocketSingh's
// own real in-app notification inboxes rather than fire-and-forget push only.
// `linkId` is the row id a tap should deep-link to (paired with `screen`).
interface Resolved {
  phones: string[];
  title: string;
  body: string;
  screen?: string;
  audience: 'admin_reviewers' | 'gardener_specific' | 'customer_specific';
  linkId?: string;
}

const PURPOSE_HANDLERS: Record<string, (ctx: Record<string, any>) => Promise<Resolved | null>> = {
  // Admin/BDM/Super Admin can act on a new gardener application (see
  // approve-gardener/reject-gardener's CAN_REVIEW set); Call Center is
  // deliberately excluded here too — same view-only reasoning as elsewhere.
  'gardener-application-received': async (ctx) => {
    const { data } = await supabaseAdmin
      .from('admin')
      .select('phone')
      .in('role', ['super_admin', 'admin', 'bdm'])
      .eq('status', 'Active');
    const phones = (data || []).map((a) => a.phone).filter(Boolean);
    return {
      phones,
      title: 'New Gardener Application',
      body: `${ctx.applicantName || 'An applicant'} has submitted a Gardener application. Review it in Gardener Applications.`,
      screen: '/gardenerApplications',
      audience: 'admin_reviewers',
    };
  },

  // Business-development-adjacent, same reviewer set as gardener applications.
  'partnership-application-received': async (ctx) => {
    const { data } = await supabaseAdmin
      .from('admin')
      .select('phone')
      .in('role', ['super_admin', 'admin', 'bdm'])
      .eq('status', 'Active');
    const phones = (data || []).map((a) => a.phone).filter(Boolean);
    return {
      phones,
      title: 'New Partnership Application',
      body: `${ctx.organization || 'A business'} has applied to become a partner.`,
      screen: '/partnershipApplications',
      audience: 'admin_reviewers',
    };
  },

  'lead-unlock-approved': async (ctx) => {
    const { data: reqRow } = await supabaseAdmin
      .from('lead_unlock_requests')
      .select('gardener_phone, booking_id')
      .eq('id', ctx.requestId)
      .maybeSingle();
    if (!reqRow) return null;
    return {
      phones: [reqRow.gardener_phone],
      title: 'Payment Approved',
      body: `Your payment for Booking #${reqRow.booking_id} has been approved — you can now view the customer's contact details.`,
      screen: `/booking/${reqRow.booking_id}`,
      audience: 'gardener_specific',
      linkId: String(reqRow.booking_id),
    };
  },

  'lead-unlock-rejected': async (ctx) => {
    const { data: reqRow } = await supabaseAdmin
      .from('lead_unlock_requests')
      .select('gardener_phone, booking_id')
      .eq('id', ctx.requestId)
      .maybeSingle();
    if (!reqRow) return null;
    return {
      phones: [reqRow.gardener_phone],
      title: 'Payment Not Approved',
      body: `Your payment proof for Booking #${reqRow.booking_id} could not be verified. Please try again or contact support.`,
      screen: `/booking/${reqRow.booking_id}`,
      audience: 'gardener_specific',
      linkId: String(reqRow.booking_id),
    };
  },

  'booking-accepted': async (ctx) => {
    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('phone, service')
      .eq('booking_id', ctx.bookingId)
      .maybeSingle();
    if (!booking) return null;
    return {
      phones: [booking.phone],
      title: 'Gardener Assigned',
      body: `A gardener has accepted your ${booking.service} request and will be in touch soon.`,
      audience: 'customer_specific',
      linkId: String(ctx.bookingId),
    };
  },

  'job-completed': async (ctx) => {
    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('phone, service')
      .eq('booking_id', ctx.bookingId)
      .maybeSingle();
    if (!booking) return null;
    return {
      phones: [booking.phone],
      title: 'Job Completed',
      body: `Your ${booking.service} service has been marked as completed. Thank you for using Garden Sewa!`,
      audience: 'customer_specific',
      linkId: String(ctx.bookingId),
    };
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const appId = Deno.env.get('EXPO_PUBLIC_ONESIGNAL_APP_ID') || Deno.env.get('ONESIGNAL_APP_ID');
    if (!restApiKey || !appId) {
      return json({ success: false, message: 'Missing OneSignal config' }, 500);
    }

    const { purpose, ...ctx } = await req.json();
    const handler = PURPOSE_HANDLERS[purpose];
    if (!handler) return json({ success: false, message: 'Invalid purpose' }, 400);

    const resolved = await handler(ctx);
    if (!resolved || resolved.phones.filter(Boolean).length === 0) {
      // Not an error — e.g. no active reviewer accounts yet, or the id didn't
      // match a row — but nothing to push.
      return json({ success: true, sent: false });
    }
    const { phones, title, body, screen, audience, linkId } = resolved;

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
    // down before it completes, silently dropping the audit-log row. Only
    // 'gardener_specific'/'customer_specific' carry a single audience_phone —
    // 'admin_reviewers' can resolve to several admin phones at once, and any
    // matching admin viewer should see it, not just whichever phone happens
    // to be first in the array.
    const audiencePhone = audience === 'admin_reviewers' ? null : phones[0];
    const { error } = await supabaseAdmin.from('notifications').insert([{
      title,
      body,
      screen: screen || null,
      link_id: linkId || null,
      audience,
      audience_phone: audiencePhone,
    }]);
    if (error) console.error('notifications log insert failed:', error);

    return json({ success: true, sent: true });
  } catch (e) {
    console.error('send-notification error:', e);
    return json({ success: false, message: 'Could not send notification' }, 500);
  }
});
