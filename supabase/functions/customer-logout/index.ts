import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// Mirrors admin-logout for the customer_sessions table (see
// 0029_customer_sessions.sql) — actually revokes the token server-side
// instead of just forgetting it on-device, same reasoning as admin's.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const token = req.headers.get('x-customer-session-token');
  if (token) await supabaseAdmin.from('customer_sessions').delete().eq('token', token);

  return json({ success: true });
});
