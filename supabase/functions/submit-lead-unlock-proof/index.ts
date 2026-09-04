import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

// The gardener pays via the static SRIYOG Consulting QR (outside the app, no
// gateway to verify against) and submits a screenshot as proof. This only
// records the submission for admin review — it does NOT unlock anything
// itself. See approve-lead-unlock, which is what actually inserts into
// lead_unlocks after a human confirms the payment. Direct port of HomeSewa's
// real submit-lead-unlock-proof.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'gardener') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { bookingId, proofUrl, referenceNote } = await req.json();
    if (!bookingId || !proofUrl) {
      return json({ success: false, message: 'bookingId and proofUrl are required' }, 400);
    }

    const { data: account } = await supabaseAdmin
      .from('gardener_account')
      .select('phone, status')
      .eq('id', session.gardenerAccountId)
      .maybeSingle();

    if (!account || account.status !== 'Active') {
      return json({ success: false, message: 'Your account is not active' }, 403);
    }

    const { data: existingUnlock } = await supabaseAdmin
      .from('lead_unlocks')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('gardener_phone', account.phone)
      .maybeSingle();

    if (existingUnlock) {
      return json({ success: true, status: 'already_unlocked' });
    }

    const { error } = await supabaseAdmin.from('lead_unlock_requests').upsert(
      {
        booking_id: bookingId,
        gardener_phone: account.phone,
        proof_url: proofUrl,
        reference_note: referenceNote ?? null,
        status: 'Pending',
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'booking_id,gardener_phone' }
    );
    if (error) throw new Error(error.message);

    return json({ success: true, status: 'Pending' });
  } catch (e) {
    console.error('submit-lead-unlock-proof error:', e);
    return json({ success: false, message: 'Could not submit payment proof' }, 500);
  }
});
