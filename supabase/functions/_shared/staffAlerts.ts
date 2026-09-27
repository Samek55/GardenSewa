import { sendSms } from './easyservice.ts';
import { supabaseAdmin } from './supabaseAdmin.ts';

// Office numbers that get an SMS for every new service request, whichever
// flow created it (customer self-service in verify-otp, BDM/Call Center in
// submit-booking-for-customer).
const BOOKING_ALERT_PHONES = ['9852024365', '9852025735'];

// Every back-office role can act on a new booking (publish-booking /
// reassign-booking allow all four), so all of them get the push.
const BOOKING_PUSH_ROLES = ['super_admin', 'admin', 'bdm', 'call_center'];

export interface BookingAlertFields {
  booking_id?: number | string;
  full_name: string;
  service: string;
  area: string;
  phone: string;
}

// SMS to the office numbers + push to every active admin. Never throws — the
// booking is already saved by the time this runs, so a failed alert must not
// turn the caller's response into an error.
export async function notifyStaffOfBooking(booking: BookingAlertFields): Promise<void> {
  const firstName = booking.full_name?.trim().split(/\s+/)[0] || 'A customer';
  const text = `${firstName} has requested ${booking.service} in ${booking.area}, ${booking.phone}. GardenSewa`;

  const results = await Promise.allSettled([
    ...BOOKING_ALERT_PHONES.map((p) => sendSms(p, text)),
    pushAdmins('New Service Request', `${firstName} has requested ${booking.service} in ${booking.area}.`, booking.booking_id),
  ]);
  results.forEach((r) => {
    if (r.status === 'rejected') console.error('booking staff alert failed:', r.reason);
  });
}

// Admin devices register with OneSignal under their phone as external_id
// (see AdminAuthContext.js), same targeting send-notification uses.
async function pushAdmins(title: string, body: string, bookingId?: number | string) {
  const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  const appId = Deno.env.get('EXPO_PUBLIC_ONESIGNAL_APP_ID') || Deno.env.get('ONESIGNAL_APP_ID');
  if (!restApiKey || !appId) throw new Error('Missing OneSignal config');

  const { data } = await supabaseAdmin
    .from('admin')
    .select('phone')
    .in('role', BOOKING_PUSH_ROLES)
    .eq('status', 'Active');
  const phones = (data || []).map((a) => a.phone).filter(Boolean);
  if (phones.length === 0) return;

  const screen = '/bookings';
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { Authorization: `Key ${restApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: { external_id: phones },
      target_channel: 'push',
      headings: { en: title },
      contents: { en: body },
      data: { screen },
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`OneSignal send failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  // Same in-app inbox row send-notification writes for admin-facing pushes.
  const { error } = await supabaseAdmin.from('notifications').insert([{
    title,
    body,
    screen,
    link_id: bookingId != null ? String(bookingId) : null,
    audience: 'admin_reviewers',
    audience_phone: null,
  }]);
  if (error) console.error('notifications log insert failed:', error);
}
