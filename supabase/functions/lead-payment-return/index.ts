import { corsHeaders } from '../_shared/cors.ts';

// Khalti's epayment/initiate rejects any return_url that isn't a real
// http(s) URL ("Enter a valid URL.") — see initiate-lead-payment, which
// can't hand it the gardener's app-scheme deep link (gardensewa://..., or
// exp://... in dev) directly. This function is the https bridge Khalti is
// given instead: it's a public, unauthenticated redirect that Khalti's
// checkout sends the gardener's browser to after payment, forwarding every
// query param Khalti attaches (pidx, status, transaction_id, ...) onto the
// real app_return_url so the app sees exactly what it would have gotten from
// a direct redirect. No payment state is trusted here — verify-lead-payment
// always re-checks with Khalti server-side regardless of what lands in these
// query params.
Deno.serve((req) => {
  const url = new URL(req.url);
  const appReturnUrl = url.searchParams.get('app_return_url');
  if (!appReturnUrl) {
    return new Response('Missing app_return_url', { status: 400, headers: corsHeaders });
  }

  let target: URL;
  try {
    target = new URL(appReturnUrl);
  } catch {
    return new Response('Invalid app_return_url', { status: 400, headers: corsHeaders });
  }

  for (const [key, value] of url.searchParams) {
    if (key === 'app_return_url') continue;
    target.searchParams.set(key, value);
  }

  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: target.toString() } });
});
