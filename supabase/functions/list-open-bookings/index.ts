import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

// Masks a full name for privacy before a gardener has paid to unlock the
// contact — same shape as HomeSewa's maskCustomerName, e.g. "Ram Thapa" ->
// "Ram... Tha...". Done here server-side rather than client-side like
// HomeSewa's own version: the raw name/phone must never reach the client at
// all for a locked booking, not just be hidden by the UI (see
// 0009_booking_and_leads.sql's comment on why `booking` itself has zero
// anon/authenticated SELECT).
function maskName(fullName: string): string {
  const name = (fullName || '').trim();
  if (!name) return 'Someone';
  return name.split(/\s+/).map((w) => `${w.slice(0, 3)}...`).join(' ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || (session.role !== 'gardener' && !BACK_OFFICE_ROLES.has(session.role))) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const isAdmin = BACK_OFFICE_ROLES.has(session.role);

    // A gardener's own phone — needed to know which bookings they've already
    // unlocked/accepted. Admins see everything unmasked regardless, so this
    // is only looked up for a gardener session.
    let gardenerPhone: string | null = null;
    if (!isAdmin) {
      const { data: acct } = await supabaseAdmin
        .from('gardener_account')
        .select('phone')
        .eq('id', session.gardenerAccountId)
        .maybeSingle();
      gardenerPhone = acct?.phone ?? null;
    }

    // Gardeners see open jobs plus anything they've already accepted; admins
    // see everything so they can review the whole pipeline.
    let query = supabaseAdmin
      .from('booking')
      .select(
        'booking_id, full_name, phone, service, city, area, priority, budget, select_shift, ' +
        'starting_date, service_completion_date, work_description, photos, completion_photos, ' +
        'status, accepted_by_phone, deal_amount, deal_note, created_at'
      )
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.or(`status.eq.New / Open,accepted_by_phone.eq.${gardenerPhone}`);
    }

    const { data: bookings, error } = await query;
    if (error) throw new Error(error.message);

    const rows = bookings || [];
    let unlockedIds = new Set<number>();
    if (!isAdmin && rows.length > 0) {
      const { data: unlocks } = await supabaseAdmin
        .from('lead_unlocks')
        .select('booking_id')
        .eq('gardener_phone', gardenerPhone)
        .in('booking_id', rows.map((r) => r.booking_id));
      unlockedIds = new Set((unlocks || []).map((u) => u.booking_id));
    }

    const result = rows.map((row) => {
      const isUnlocked = isAdmin || unlockedIds.has(row.booking_id) || row.accepted_by_phone === gardenerPhone;
      return {
        bookingId: row.booking_id,
        fullName: isUnlocked ? row.full_name : maskName(row.full_name),
        phone: isUnlocked ? row.phone : null,
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
        acceptedByPhone: row.accepted_by_phone,
        dealAmount: isUnlocked ? row.deal_amount : null,
        dealNote: isUnlocked ? row.deal_note : null,
        unlocked: isUnlocked,
        createdAt: row.created_at,
      };
    });

    return json({ success: true, bookings: result });
  } catch (e) {
    console.error('list-open-bookings error:', e);
    return json({ success: false, message: 'Could not load bookings' }, 500);
  }
});
