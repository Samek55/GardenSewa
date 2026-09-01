import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const token = req.headers.get('x-admin-session-token');
  if (token) await supabaseAdmin.from('admin_sessions').delete().eq('token', token);

  return json({ success: true });
});
