export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // x-admin-session-token/x-customer-session-token are here because
  // verifySession()/verifyCustomerSession() (_shared/session.ts) read auth
  // from those headers for every session-gated function — on a web build
  // (expo start --web) the browser's CORS preflight would otherwise block
  // the real request client-side before it reaches the server.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session-token, x-customer-session-token',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
