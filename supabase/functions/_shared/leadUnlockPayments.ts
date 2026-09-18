import { supabaseAdmin } from './supabaseAdmin.ts';
import { lookupKhaltiPayment } from './khalti.ts';

export interface LeadUnlockPaymentRow {
  id: number;
  booking_id: number;
  gardener_phone: string;
  amount: number;
  pidx: string;
  payment_url: string;
  status: string;
}

export type ReconcileOutcome =
  | { status: 'Completed' }
  | { status: 'Pending' }
  | { status: 'Failed'; khaltiStatus: string };

// Checks a lead_unlock_payments row against Khalti's own record of it and, if
// newly confirmed Completed, atomically claims the row and upserts
// lead_unlocks — the same compare-and-swap-then-unlock pattern as
// approve-lead-unlock, so this is safe to call from both
// initiate-lead-payment (reuse check) and verify-lead-payment (main path)
// without double-crediting a race between the two.
export async function reconcilePayment(row: LeadUnlockPaymentRow): Promise<ReconcileOutcome> {
  if (row.status === 'Completed') return { status: 'Completed' };

  const result = await lookupKhaltiPayment(row.pidx);

  if (result.status === 'Completed') {
    // Sanity check against the amount we actually initiated — a mismatch
    // here would mean something is very wrong (tampered pidx, Khalti-side
    // bug) and must never result in an unlock.
    const expectedPaisa = Math.round(row.amount * 100);
    if (result.total_amount !== expectedPaisa) {
      console.error(
        `lead_unlock_payments ${row.id}: Khalti amount ${result.total_amount} != expected ${expectedPaisa}`
      );
      await supabaseAdmin
        .from('lead_unlock_payments')
        .update({ status: 'Failed', updated_at: new Date().toISOString() })
        .eq('id', row.id)
        .eq('status', 'Pending');
      return { status: 'Failed', khaltiStatus: 'amount_mismatch' };
    }

    const { error: claimError } = await supabaseAdmin
      .from('lead_unlock_payments')
      .update({
        status: 'Completed',
        khalti_transaction_id: result.transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('status', 'Pending');
    if (claimError) throw new Error(claimError.message);

    // Whether this call won the compare-and-swap or a concurrent call
    // already did, the row is Completed either way — upsert is idempotent
    // (unique on booking_id, gardener_phone), so both paths are safe.
    const { error: unlockError } = await supabaseAdmin.from('lead_unlocks').upsert(
      { booking_id: row.booking_id, gardener_phone: row.gardener_phone },
      { onConflict: 'booking_id,gardener_phone' }
    );
    if (unlockError) throw new Error(unlockError.message);

    return { status: 'Completed' };
  }

  if (result.status === 'Pending') return { status: 'Pending' };

  await supabaseAdmin
    .from('lead_unlock_payments')
    .update({ status: 'Failed', updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', 'Pending');

  return { status: 'Failed', khaltiStatus: result.status };
}
