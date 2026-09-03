import { supabaseAdmin } from './supabaseAdmin.ts';

const MAX_ATTEMPTS = 5;

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export interface OtpCheckResult {
  verified: boolean;
  message?: string;
  status: number;
}

// Shared by verify-otp (standalone check) and customer-login (check + upsert
// in one call) so the hashing/expiry/attempt-lockout logic only lives in one
// place. Consumes the code on success, same as before — a verified code can
// never be replayed.
export async function checkOtp(phone: string, purpose: string, code: string): Promise<OtpCheckResult> {
  const { data: row } = await supabaseAdmin
    .from('otp_codes')
    .select('id, code_hash, attempts, expires_at')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return { verified: false, message: 'No OTP found. Please request a new one.', status: 404 };
  if (new Date(row.expires_at) < new Date()) {
    return { verified: false, message: 'OTP expired. Please request a new one.', status: 410 };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { verified: false, message: 'Too many attempts. Please request a new OTP.', status: 429 };
  }

  const codeHash = await sha256(String(code));
  if (codeHash !== row.code_hash) {
    // Atomic increment — a plain read-then-write here would let parallel
    // guesses all read the same stale `attempts`, so MAX_ATTEMPTS would never
    // actually trip under concurrent brute force.
    await supabaseAdmin.rpc('increment_otp_attempts', { p_id: row.id });
    return { verified: false, message: 'Incorrect OTP', status: 200 };
  }

  await supabaseAdmin.from('otp_codes').delete().eq('id', row.id);
  return { verified: true, status: 200 };
}
