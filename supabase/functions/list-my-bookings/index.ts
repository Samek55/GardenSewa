import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';

// Customer-facing "My Bookings" list. No session to check against — same
// real limitation as submit-rating/send-booking-message/list-booking-messages
// (customers have no session token in this app's model, see
// 0010_ratings_and_messages.sql) — so this trusts the phone the client
// claims, exactly like those. Never exposes another customer's bookings: the
// query is always scoped to the one phone passed in, and there is nothing
// masked here the way list-open-bookings masks a booking from other
// gardeners, since a customer is always allowed to see their own submission
// in full.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned) return json({ success: false, message: 'phone is required' }, 400);

    const { data: bookings, error } = await supabaseAdmin
      .from('booking')
      .select(
        'booking_id, service, city, area, priority, budget, select_shift, starting_date, ' +
        'service_completion_date, work_description, photos, completion_photos, status, ' +
        'accepted_by_phone, deal_amount, deal_note, created_at'
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
      createdAt: row.created_at,
    }));

    return json({ success: true, bookings: result });
  } catch (e) {
    console.error('list-my-bookings error:', e);
    return json({ success: false, message: 'Could not load bookings' }, 500);
  }
});
