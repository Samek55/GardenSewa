import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifyCustomerSession } from '../_shared/session.ts';

// Customer-facing "My Bookings" list. Used to trust a bare client-claimed
// `phone` with nothing behind it — anyone who knew a customer's number could
// pull their entire booking history (address, budget, schedule, work
// description, photos, payment status) with a single call. Now requires the
// session customer-login mints (see 0029_customer_sessions.sql) and scopes
// the query to the phone that session actually proved, never the one the
// client claims. There is nothing masked here the way list-open-bookings
// masks a booking from other gardeners, since a customer is always allowed
// to see their own submission in full — the fix is who can prove they're
// that customer, not what they see once they have.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifyCustomerSession(req);
    if (!session) return json({ success: false, message: 'Please log in again.' }, 401);
    const cleaned = session.phone;

    const { data: bookings, error } = await supabaseAdmin
      .from('booking')
      .select(
        'booking_id, service, city, area, priority, budget, select_shift, starting_date, ' +
        'service_completion_date, work_description, photos, completion_photos, status, ' +
        'accepted_by_phone, deal_amount, deal_note, payment_status, created_at'
      )
      .eq('phone', cleaned)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const rows = bookings || [];
    const gardenerPhones = [...new Set(rows.map((r) => r.accepted_by_phone).filter(Boolean))];
    let gardenerNames: Record<string, string> = {};
    if (gardenerPhones.length > 0) {
      const { data: gardeners } = await supabaseAdmin
        .from('gardener_account')
        .select('phone, full_name')
        .in('phone', gardenerPhones);
      gardenerNames = Object.fromEntries((gardeners || []).map((g) => [g.phone, g.full_name]));
    }

    const result = rows.map((row) => ({
      bookingId: row.booking_id,
      service: row.service,
      city: row.city,
      area: row.area,
      priority: row.priority,
      budget: row.budget,
      shift: row.select_shift,
      startingDate: row.starting_date,
      completionDate: row.service_completion_date,
      workDescription: row.work_description,
      photos: row.photos,
      completionPhotos: row.completion_photos,
      status: row.status,
      gardenerPhone: row.accepted_by_phone,
      gardenerName: row.accepted_by_phone ? (gardenerNames[row.accepted_by_phone] || null) : null,
      dealAmount: row.deal_amount,
      dealNote: row.deal_note,
      paymentStatus: row.payment_status,
      createdAt: row.created_at,
    }));

    return json({ success: true, bookings: result });
  } catch (e) {
    console.error('list-my-bookings error:', e);
    return json({ success: false, message: 'Could not load bookings' }, 500);
  }
});
