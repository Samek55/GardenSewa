import { supabaseAdmin } from './supabaseAdmin.ts';
import { sendSms } from './easyservice.ts';

const MAX_ATTEMPTS = 5;
const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 45;
const MAX_PER_DAY = 8;

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// One entry per OTP purpose in the app. Add new purposes here as new flows
// need OTP — mirrors HomeSewa's send-otp shape. Exported so both send-otp
// (the generic client-facing endpoint) and any function that needs to issue
// an OTP as a side effect of something else it's already doing (e.g.
// submit-booking-for-customer, confirming to the BDM's own phone rather than
// the customer's) share the exact same message templates and rate limits
// instead of re-implementing them.
export const OTP_MESSAGES: Record<string, (code: string, name: string) => string> = {
  'join-gardener': (code, name) =>
    `Dear ${name}, your Garden Sewa Gardener application OTP code is ${code}.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
  'customer-login': (code) =>
    `Your Garden Sewa login OTP code is ${code}.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
  booking: (code, name) =>
    `Dear ${name}, Your Service Booking OTP code is ${code}.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
  'work-completion': (code, name) =>
    `Dear ${name}, your Garden Sewa service is being marked as completed.\n\nYour completion OTP is: ${code}\n\nShare this code with the gardener to confirm.\n\nGarden Sewa ( www.gardensewa.com )`,
  'bdm-booking-confirm': (code, name) =>
    `Dear ${name}, your Garden Sewa booking submission OTP code is ${code}.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
  'become-partner': (code, name) =>
    `Dear ${name}, your Garden Sewa Partnership application OTP code is ${code}.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
  helpbox: (code) =>
    `Your Garden Sewa help request OTP code is ${code}.\n\nOur team will call you back shortly.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
  'pin-reset': (code) =>
    `Your Garden Sewa PIN reset OTP code is ${code}.\n\nIf you did not request this, please ignore this message.\n\nThank you for using Garden Sewa\n( www.gardensewa.com )`,
};

export interface OtpIssueResult {
  success: boolean;
  message?: string;
  status: number;
  waitSeconds?: number;
}

// Generates, stores, and SMS's a code for one purpose — the daily cap and
// resend cooldown live here so every caller gets them for free, not just
// send-otp's own HTTP handler.
export async function issueOtp(phone: string, purpose: string, name?: string): Promise<OtpIssueResult> {
  if (!OTP_MESSAGES[purpose]) return { success: false, message: 'Invalid purpose', status: 400 };

  const { count: sentToday } = await supabaseAdmin
    .from('otp_send_log')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .eq('purpose', purpose)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString());
  if ((sentToday || 0) >= MAX_PER_DAY) {
    return { success: false, message: 'Too many OTP requests for this number today. Please try again tomorrow.', status: 429 };
  }

  const { data: existing } = await supabaseAdmin
    .from('otp_codes')
    .select('id, created_at')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const secondsSinceLastSend = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
    if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
      return { success: false, message: `Please wait ${waitSeconds}s before requesting another code.`, status: 429, waitSeconds };
    }
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  const codeHash = await sha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  await supabaseAdmin.from('otp_codes').delete().eq('phone', phone).eq('purpose', purpose);
  const { error } = await supabaseAdmin.from('otp_codes').insert([{ phone, purpose, code_hash: codeHash, expires_at: expiresAt }]);
  if (error) throw new Error(error.message);

  await supabaseAdmin.from('otp_send_log').insert([{ phone, purpose }]);

  const text = OTP_MESSAGES[purpose](code, (name?.split(' ')?.[0]) || 'Applicant');
  await sendSms(phone, text);

  return { success: true, status: 200 };
}

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
