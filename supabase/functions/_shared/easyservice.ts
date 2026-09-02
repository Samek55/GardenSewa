// EasyService SMS gateway (https://app.easyservice.com.np) — sends OTP codes and
// transactional SMS server-side from the Edge Function, using an API key stored as
// a Supabase Function secret (EASYSERVICE_SMS_API_KEY), never embedded client-side.
//
// NOTE ON HomeSewa's PRIOR APPROACH: HomeSewa originally sent SMS the same way
// (server-side, from send-otp/send-sms) but had to move delivery client-side because
// its provider (Sparrow) rejected Supabase's outbound IP — Sparrow's account-level
// allowlist doesn't accept Supabase's rotating AWS ap-south-1 addresses. EasyService's
// docs don't mention IP allowlisting, so this starts server-side; if sends start
// failing with an auth/IP error, that's the same failure mode and delivery would need
// to move client-side like HomeSewa's did (see HomeSewa's send-otp/send-sms comments).
//
// ENDPOINT: the API guide (assets/sms_api_guide.html) only ever shows the endpoint as
// a "your-domain.com" placeholder — never a concrete example. The base URL below is
// inferred from the guide's own `host=app.easyservice.com.np` query param, but this is
// unverified until the first real send succeeds; override via EASYSERVICE_API_BASE_URL
// if it turns out to be wrong.
//
// SENDER ID: required per-operator by the API. Confirmed via live testing that
// 'MD_Alert' is the approved sender ID for both NT and Ncell on this account, so it's
// set as the single shared EASYSERVICE_SENDER_ID secret rather than per-operator ones.
// If a given account ever has different approved IDs per operator, set
// EASYSERVICE_SENDER_ID_NT / EASYSERVICE_SENDER_ID_NCELL instead — they take priority
// over the shared fallback below.

const DEFAULT_BASE_URL = 'https://app.easyservice.com.np/api/v1/sms/send/';

function senderIdMap(): Record<string, string> {
  const shared = Deno.env.get('EASYSERVICE_SENDER_ID');
  const nt = Deno.env.get('EASYSERVICE_SENDER_ID_NT') || shared;
  const ncell = Deno.env.get('EASYSERVICE_SENDER_ID_NCELL') || shared;
  if (!nt || !ncell) {
    throw new Error(
      'EasyService sender ID not configured — set EASYSERVICE_SENDER_ID (or ' +
      'EASYSERVICE_SENDER_ID_NT / EASYSERVICE_SENDER_ID_NCELL) as a Supabase Function secret.'
    );
  }
  return { NT: nt, Ncell: ncell };
}

// phone: local 10-digit Nepali number (already cleaned via cleanPhone()).
export async function sendSms(phone: string, text: string): Promise<void> {
  const apiKey = Deno.env.get('EASYSERVICE_SMS_API_KEY');
  if (!apiKey) throw new Error('EASYSERVICE_SMS_API_KEY is not configured');

  const baseUrl = Deno.env.get('EASYSERVICE_API_BASE_URL') || DEFAULT_BASE_URL;

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      to: ['977' + phone],
      text,
      message_type: 'plain',
      sender_id: senderIdMap(),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`EasyService SMS send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}
