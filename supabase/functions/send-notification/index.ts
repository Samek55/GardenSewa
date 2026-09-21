import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';
import { sendSms } from '../_shared/easyservice.ts';

// Matches HomeSewa's AdminNotifications screen exactly — super_admin only,
// same as its own AsyncStorage.getItem('adminRole') !== 'super_admin' gate.
const BROADCAST_ROLES = new Set(['super_admin']);
const BACK_OFFICE_ROLES = ['super_admin', 'admin', 'bdm', 'call_center'];

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
  audience: 'admin_reviewers' | 'gardener_specific' | 'gardener_all' | 'customer_specific';
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

  // Fired once by publish-booking's caller right after a Draft moves to
  // 'New / Open' (see 0024_booking_draft_publish_status.sql) — no session
  // check needed here, same reasoning as booking-accepted/job-completed
  // above: publish-booking already authorized the action that leads here.
  'booking-published': async (ctx) => {
    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('service, city, visibility, assigned_gardener_phone')
      .eq('booking_id', ctx.bookingId)
      .maybeSingle();
    if (!booking) return null;

    // One-shot claim (see 0028_booking_reassignment.sql): this endpoint has no
    // session check, so only the first call after a publish/reassign may send —
    // repeats can't be used to spam the assignee's push and SMS.
    const { data: claimedBooking } = await supabaseAdmin
      .from('booking')
      .update({ publish_notified_at: new Date().toISOString() })
      .eq('booking_id', ctx.bookingId)
      .eq('status', 'New / Open')
      .is('publish_notified_at', null)
      .select('booking_id')
      .maybeSingle();
    if (!claimedBooking) return null;

    if (booking.visibility === 'private') {
      if (!booking.assigned_gardener_phone) return null;
      // Best-effort SMS alongside push — HR's spec asks for both on a
      // Private assignment. Failure here shouldn't block the push send.
      sendSms(
        booking.assigned_gardener_phone,
        `New ${booking.service} job assigned to you on Garden Sewa. Open the app to view it.`
      ).catch((e) => console.error('booking-published SMS failed:', e));

      return {
        phones: [booking.assigned_gardener_phone],
        title: 'New Job Assigned',
        body: `A ${booking.service} job has been assigned to you.`,
        audience: 'gardener_specific',
        linkId: String(ctx.bookingId),
      };
    }

    // Public — same service+city matching as resolveBroadcastTarget's
    // 'professional' audience below, just resolved directly from the
    // booking row instead of admin-supplied serviceTypes/cities.
    const phones = await matchingGardenerPhones(booking.service, booking.city);
    if (phones.length === 0) return null;

    return {
      phones,
      title: 'New Job Posted',
      body: `A new ${booking.service} job is open in ${booking.city}.`,
      audience: 'gardener_all',
      linkId: String(ctx.bookingId),
    };
  },

  // Fired by the client right after reassign-booking takes a Private job off a
  // professional (see 0028_booking_reassignment.sql). Same session-less
  // one-shot claim pattern as booking-reopened below.
  'booking-revoked': async (ctx) => {
    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('service')
      .eq('booking_id', ctx.bookingId)
      .maybeSingle();
    if (!booking) return null;

    const { data: claimed } = await supabaseAdmin
      .from('booking_assignment_history')
      .update({ notified_at: new Date().toISOString() })
      .eq('booking_id', ctx.bookingId)
      .is('notified_at', null)
      .select('gardener_phone');
    if (!claimed || claimed.length === 0) return null;

    return {
      phones: claimed.map((c) => c.gardener_phone),
      title: 'Job Reassigned',
      body: `A ${booking.service} job is no longer assigned to you.`,
      audience: 'gardener_specific',
      linkId: String(ctx.bookingId),
    };
  },

  // Fired by the client right after reject-booking records a rejection (see
  // 0027_booking_rejections.sql). This endpoint has no session check, so it
  // atomically claims the not-yet-notified rejection rows first: each real
  // rejection can trigger exactly one re-notify, and a repeated/forged call
  // finds nothing to claim and sends nothing.
  'booking-reopened': async (ctx) => {
    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('service, city, status, visibility')
      .eq('booking_id', ctx.bookingId)
      .maybeSingle();
    if (!booking || booking.status !== 'New / Open' || booking.visibility === 'private') return null;

    const { data: claimed } = await supabaseAdmin
      .from('booking_rejections')
      .update({ renotified_at: new Date().toISOString() })
      .eq('booking_id', ctx.bookingId)
      .is('renotified_at', null)
      .select('gardener_phone');
    if (!claimed || claimed.length === 0) return null;

    const { data: allRejections } = await supabaseAdmin
      .from('booking_rejections')
      .select('gardener_phone')
      .eq('booking_id', ctx.bookingId);
    const rejectorPhones = (allRejections || []).map((r) => r.gardener_phone);

    const phones = await matchingGardenerPhones(booking.service, booking.city, rejectorPhones);
    if (phones.length === 0) return null;

    return {
      phones,
      title: 'Job Still Open',
      body: `A ${booking.service} job in ${booking.city} is still open.`,
      audience: 'gardener_all',
      linkId: String(ctx.bookingId),
    };
  },
};

// Active gardeners whose expertise includes the job's service and whose
// working cities include its city — minus anyone in excludePhones (e.g.
// professionals who already rejected the job).
async function matchingGardenerPhones(service: string, city: string, excludePhones: string[] = []): Promise<string[]> {
  const { data: accounts } = await supabaseAdmin
    .from('gardener_account')
    .select('gardener_id, phone')
    .eq('status', 'Active');
  if (!accounts || accounts.length === 0) return [];

  const gardenerIds = accounts.map((a) => a.gardener_id);
  const { data: gardeners } = await supabaseAdmin
    .from('gardener')
    .select('id, area_of_expertise, expected_working_city')
    .in('id', gardenerIds);
  type GardenerRow = { id: string; area_of_expertise: string[] | null; expected_working_city: string[] | null };
  const gardenerById = new Map<string, GardenerRow>((gardeners || []).map((g: GardenerRow) => [g.id, g]));

  const excluded = new Set(excludePhones);
  return accounts
    .filter((a) => {
      const g = gardenerById.get(a.gardener_id);
      if (!g || excluded.has(a.phone)) return false;
      return (g.area_of_expertise || []).includes(service) && (g.expected_working_city || []).includes(city);
    })
    .map((a) => a.phone)
    .filter(Boolean);
}

// Resolves the OneSignal targeting shape + notifications-log audience for
// each of HomeSewa's five broadcast tabs. Returns null if there's nothing to
// send to (e.g. no gardener matched the service/city filter) — same
// "not an error, just nothing to push" convention as PURPOSE_HANDLERS above.
async function resolveBroadcastTarget(ctx: Record<string, any>): Promise<{
  target: Record<string, any>;
  dbAudience: string;
  title: string;
} | null> {
  const audience = ctx.audience;

  if (audience === 'admin') {
    const { data } = await supabaseAdmin
      .from('admin')
      .select('phone')
      .in('role', BACK_OFFICE_ROLES)
      .eq('status', 'Active');
    const phones = (data || []).map((a) => a.phone).filter(Boolean);
    if (phones.length === 0) return null;
    return {
      target: { include_aliases: { external_id: phones }, target_channel: 'push' },
      dbAudience: 'admin_reviewers',
      title: String(ctx.title || '').trim(),
    };
  }

  if (audience === 'customer') {
    const serviceTypes: string[] = Array.isArray(ctx.serviceTypes) ? ctx.serviceTypes.filter(Boolean) : [];
    if (serviceTypes.length > 0) {
      const { data } = await supabaseAdmin.from('booking').select('phone').in('service', serviceTypes);
      const phones = [...new Set((data || []).map((b) => b.phone).filter(Boolean))];
      if (phones.length === 0) return null;
      return {
        target: { include_aliases: { external_id: phones }, target_channel: 'push' },
        dbAudience: 'customer_all',
        title: String(ctx.title || '').trim(),
      };
    }
    return {
      target: { filters: [{ field: 'tag', key: 'role', relation: '=', value: 'customer' }] },
      dbAudience: 'customer_all',
      title: String(ctx.title || '').trim(),
    };
  }

  if (audience === 'professional') {
    const serviceTypes: string[] = Array.isArray(ctx.serviceTypes) ? ctx.serviceTypes.filter(Boolean) : [];
    const cities: string[] = Array.isArray(ctx.cities) ? ctx.cities.filter(Boolean) : [];
    if (serviceTypes.length === 0 || cities.length === 0) return null;

    const { data: accounts } = await supabaseAdmin
      .from('gardener_account')
      .select('gardener_id, phone')
      .eq('status', 'Active');
    if (!accounts || accounts.length === 0) return null;

    const gardenerIds = accounts.map((a) => a.gardener_id);
    const { data: gardeners } = await supabaseAdmin
      .from('gardener')
      .select('id, area_of_expertise, expected_working_city')
      .in('id', gardenerIds);
    type GardenerRow = { id: string; area_of_expertise: string[] | null; expected_working_city: string[] | null };
    const gardenerById = new Map<string, GardenerRow>((gardeners || []).map((g: GardenerRow) => [g.id, g]));

    const phones = accounts
      .filter((a) => {
        const g = gardenerById.get(a.gardener_id);
        if (!g) return false;
        const matchesService = (g.area_of_expertise || []).some((s) => serviceTypes.includes(s));
        const matchesCity = (g.expected_working_city || []).some((c) => cities.includes(c));
        return matchesService && matchesCity;
      })
      .map((a) => a.phone)
      .filter(Boolean);
    if (phones.length === 0) return null;

    return {
      target: { include_aliases: { external_id: phones }, target_channel: 'push' },
      dbAudience: 'gardener_all',
      title: `Garden Sewa — ${serviceTypes.join(', ')} in ${cities.join(', ')}`,
    };
  }

  if (audience === 'public') {
    return {
      target: { filters: [{ field: 'tag', key: 'role', relation: 'not_exists' }] },
      dbAudience: 'public_all',
      title: String(ctx.title || '').trim(),
    };
  }

  if (audience === 'all') {
    return {
      target: { included_segments: ['All'] },
      dbAudience: 'all',
      title: String(ctx.title || '').trim(),
    };
  }

  return null;
}

// The one purpose that doesn't fit the server-resolves-everything model
// above: super_admin composes free-text title/body themselves, so it needs
// its own session check (every other purpose is only ever called right
// after an action that action's own edge function already authorized).
// Mirrors HomeSewa's AdminNotifications screen tab-for-tab — see
// resolveBroadcastTarget above for each audience's targeting logic.
async function handleAdminBroadcast(req: Request, ctx: Record<string, any>, restApiKey: string, appId: string) {
  const session = await verifySession(req);
  if (!session || !BROADCAST_ROLES.has(session.role)) {
    return json({ success: false, message: 'Please log in again.' }, 401);
  }

  const body = String(ctx.body || '').trim();
  if (!body) {
    return json({ success: false, message: 'Message is required.' }, 400);
  }
  if (ctx.audience !== 'professional' && !String(ctx.title || '').trim()) {
    return json({ success: false, message: 'Title is required.' }, 400);
  }

  const resolved = await resolveBroadcastTarget(ctx);
  if (!resolved) {
    return json({ success: true, sent: false });
  }
  const { target, dbAudience, title } = resolved;

  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Key ${restApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: appId,
      ...target,
      headings: { en: title },
      contents: { en: body },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('OneSignal send failed:', data);
    return json({ success: false, message: data?.errors?.[0] || 'OneSignal request failed' }, 502);
  }

  const { error } = await supabaseAdmin.from('notifications').insert([{
    title,
    body,
    screen: null,
    link_id: null,
    audience: dbAudience,
    audience_phone: null,
  }]);
  if (error) console.error('notifications log insert failed:', error);

  return json({ success: true, sent: true });
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
    if (purpose === 'admin-broadcast') {
      return await handleAdminBroadcast(req, ctx, restApiKey, appId);
    }

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
    const audiencePhone = (audience === 'admin_reviewers' || audience === 'gardener_all') ? null : phones[0];
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
