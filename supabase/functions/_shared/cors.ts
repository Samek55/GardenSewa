export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // x-admin-session-token is here because verifySession() (_shared/session.ts)
  // reads auth from that header for every session-gated admin function — on a
  // web build (expo start --web) the browser's CORS preflight would otherwise
  // block the real request client-side before it reaches the server.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session-token',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
