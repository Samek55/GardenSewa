import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const CAN_VIEW_ANY = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

// Generates a short-lived signed URL for one of a booking's private
// work_documents (see 0025_booking_start_work.sql) — same reasoning as
// get-gardener-document-url: the client's anon key has no read access to the
// id-documents bucket at all. `path` must be one of the booking's own
// work_documents entries — otherwise this becomes an arbitrary-path signed
// URL oracle for the whole private bucket.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session) return json({ success: false, message: 'Please log in again.' }, 401);

    const { bookingId, path } = await req.json();
    if (!bookingId || !path) return json({ success: false, message: 'bookingId and path are required' }, 400);

    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('accepted_by_phone, work_documents')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (!booking) return json({ success: false, message: 'Not found' }, 404);

    const canView = CAN_VIEW_ANY.has(session.role) || await isAssignedGardener(session, booking.accepted_by_phone);
    if (!canView) return json({ success: false, message: 'Please log in again.' }, 401);

    if (!(booking.work_documents || []).includes(path)) {
      return json({ success: false, message: 'Not found' }, 404);
    }

    const { data, error } = await supabaseAdmin.storage
      .from('id-documents')
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not generate document link');

    return json({ success: true, url: data.signedUrl });
  } catch (e) {
    console.error('get-booking-document-url error:', e);
    return json({ success: false, message: 'Could not generate document link' }, 500);
  }
});

async function isAssignedGardener(session: { role: string; gardenerAccountId: string | null }, acceptedByPhone: string | null) {
  if (session.role !== 'gardener' || !session.gardenerAccountId || !acceptedByPhone) return false;
  const { data: account } = await supabaseAdmin
    .from('gardener_account')
    .select('phone')
    .eq('id', session.gardenerAccountId)
    .maybeSingle();
  return !!account && cleanPhone(account.phone) === cleanPhone(acceptedByPhone);
}
