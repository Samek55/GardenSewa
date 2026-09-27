import { supabaseAdmin } from './supabaseAdmin.ts';

// Which account a phone logs in as (admin-login) / resets the PIN of
// (reset-pin). One person can have both an admin row and a gardener_account
// row: the admin account wins only while it's Active, so a Super Admin
// disabling someone's back-office access leaves them able to use their
// professional account instead of being told "Account status: Inactive".
// With no gardener account to fall back to, the (inactive) admin row is still
// returned so the caller reports its real status.
export async function resolveLoginAccount(phone: string, columns: string): Promise<{
  account: any | null;
  isGardener: boolean;
}> {
  // Typed as plain string: supabase-js can't parse a runtime-built column list.
  const adminColumns: string = `${columns}, status, role`;
  const gardenerColumns: string = `${columns}, status`;

  const { data: adminData } = await supabaseAdmin
    .from('admin')
    .select(adminColumns)
    .eq('phone', phone)
    .maybeSingle();
  const adminRow = adminData as any;
  if (adminRow && adminRow.status === 'Active') return { account: adminRow, isGardener: false };

  const { data: gardenerRow } = await supabaseAdmin
    .from('gardener_account')
    .select(gardenerColumns)
    .eq('phone', phone)
    .maybeSingle();
  if (gardenerRow) return { account: gardenerRow, isGardener: true };

  return { account: adminRow, isGardener: false };
}
