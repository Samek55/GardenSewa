// Khalti Payment Gateway (KPG v2) — initiates and verifies ePayment
// transactions server-side using a secret key stored as a Supabase Function
// secret (KHALTI_SECRET_KEY), never embedded client-side. Same base URL for
// both test and live: it's the `test_secret_key_...` vs `live_secret_key_...`
// prefix on the key itself that determines sandbox vs. real money, not the
// host — so there's no separate base-URL override needed here, unlike
// easyservice.ts's EASYSERVICE_API_BASE_URL.

const BASE_URL = 'https://khalti.com/api/v2';

function secretKey(): string {
  const key = Deno.env.get('KHALTI_SECRET_KEY');
  if (!key) throw new Error('KHALTI_SECRET_KEY is not configured');
  return key;
}

export interface InitiateKhaltiPaymentParams {
  amountPaisa: number;
  purchaseOrderId: string;
  purchaseOrderName: string;
  returnUrl: string;
  websiteUrl: string;
}

export interface InitiateKhaltiPaymentResult {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

export async function initiateKhaltiPayment(
  params: InitiateKhaltiPaymentParams
): Promise<InitiateKhaltiPaymentResult> {
  const res = await fetch(`${BASE_URL}/epayment/initiate/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${secretKey()}`,
    },
    body: JSON.stringify({
      amount: params.amountPaisa,
      purchase_order_id: params.purchaseOrderId,
      purchase_order_name: params.purchaseOrderName,
      return_url: params.returnUrl,
      website_url: params.websiteUrl,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Khalti initiate failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  return res.json();
}

export interface LookupKhaltiPaymentResult {
  pidx: string;
  total_amount: number;
  status: 'Completed' | 'Pending' | 'Expired' | 'User canceled' | 'Refunded' | string;
  transaction_id: string | null;
  fee: number;
  refunded: boolean;
}

export async function lookupKhaltiPayment(pidx: string): Promise<LookupKhaltiPaymentResult> {
  const res = await fetch(`${BASE_URL}/epayment/lookup/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${secretKey()}`,
    },
    body: JSON.stringify({ pidx }),
  });

  const body = await res.text();

  if (!res.ok) {
    // Observed live: Khalti's lookup endpoint returns a non-2xx status for
    // some terminal states (e.g. Expired) while still including the real
    // pidx/status in the JSON body — parse it instead of treating every
    // non-2xx response as a hard failure, so reconcilePayment can still mark
    // it Failed and let the caller mint a fresh payment, rather than this
    // throwing and surfacing as a generic 500 to the gardener.
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed.status === 'string') return parsed;
    } catch {
      // Not JSON — fall through to throw below.
    }
    throw new Error(`Khalti lookup failed (${res.status}): ${body.slice(0, 300)}`);
  }

  return JSON.parse(body);
}
