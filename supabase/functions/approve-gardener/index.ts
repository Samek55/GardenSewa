import { hash } from 'npm:bcrypt-ts@5';
import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';
import { sendSms } from '../_shared/easyservice.ts';

// BDM is included deliberately — recruiting gardeners is core Business
// Development work, so BDM gets the same review authority as Admin here.
// Call Center is intentionally excluded (view-only, see list-gardener-applications).
const CAN_REVIEW = new Set(['super_admin', 'admin', 'bdm']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || !CAN_REVIEW.has(session.role)) {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { id } = await req.json();
    if (!id) return json({ success: false, message: 'id is required' }, 400);

    const { data: gardenerRow, error } = await supabaseAdmin
      .from('gardener')
      .update({
        status: 'Approved',
        reviewed_by: session.adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id)
      .select('full_name, phone')
      .single();

    if (error) throw new Error(error.message);

    // Provision (or reactivate) the login account — mirrors HomeSewa's
    // approve-professional, which activates the account and reveals the PIN
    // via SMS in the same step. If an account already exists for this phone
    // (e.g. re-approving after a status change), reactivate it instead of
    // generating a new PIN — the applicant already has working credentials,
    // so a fresh insert would just hit the unique(phone) constraint for no
    // reason and a new PIN would invalidate one they may already be using.
    const { data: existingAccount } = await supabaseAdmin
      .from('gardener_account')
      .select('id, status')
      .eq('phone', gardenerRow.phone)
      .maybeSingle();

    if (existingAccount) {
      if (existingAccount.status !== 'Active') {
        await supabaseAdmin.from('gardener_account').update({ status: 'Active' }).eq('id', existingAccount.id);
      }
    } else {
      const pin = String(Math.floor(1000 + Math.random() * 9000));
      const pinHash = await hash(pin, 10);

      const { error: acctError } = await supabaseAdmin.from('gardener_account').insert([{
        gardener_id: id,
        full_name: gardenerRow.full_name,
        phone: gardenerRow.phone,
        pin_hash: pinHash,
      }]);
      if (acctError) throw new Error(acctError.message);

      const firstName = (gardenerRow.full_name || '').split(' ')[0] || 'Gardener';
      const text = `Dear ${firstName}, congratulations! Your Garden Sewa Gardener application has been approved.\n\nYour Login Details:\nPhone: ${gardenerRow.phone}\nPIN: ${pin}\n\nDownload the Garden Sewa app and login using the details above.\n\nWelcome to Garden Sewa!\n( www.gardensewa.com )`;

      // Awaited deliberately — an un-awaited send here risks the edge runtime
      // tearing down before it completes, silently dropping the applicant's
      // only way to learn their PIN. A failure here shouldn't fail the whole
      // approval though — the account is already created and Active — so the
      // error is logged, not thrown.
      await sendSms(gardenerRow.phone, text).catch((e) => console.error('approve-gardener SMS failed:', e));
    }

    return json({ success: true });
  } catch (e) {
    console.error('approve-gardener error:', e);
    return json({ success: false, message: 'Could not approve this application' }, 500);
  }
});
