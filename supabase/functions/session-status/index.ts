import { corsHeaders, json } from '../_shared/cors.ts';
import { verifySession } from '../_shared/session.ts';

// Lets the app tell "your session is gone (expired, or the account was
// disabled)" apart from "your role can't call that" — many functions answer
// both with the same 401 "Please log in again." (see functionsClient.js).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const session = await verifySession(req);
  return json({ valid: !!session });
});
