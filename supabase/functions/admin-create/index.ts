// bcrypt-ts, not bcryptjs — see admin-login's comment: bcryptjs fails to boot on
// this project's Edge Runtime with a bare BOOT_ERROR, bcrypt-ts is a pure-TS
// implementation that boots fine and produces the same $2a$/$2b$ hash format
// admin-login verifies against.
import { hash } from 'npm:bcrypt-ts@5';
import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin, cleanPhone } from '../_shared/supabaseAdmin.ts';
import { verifySession } from '../_shared/session.ts';

const VALID_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

// Mirrors HomeSewa's admin-create (its super-admin "Add Admin" flow), adapted
// for two real differences: Garden Sewa has four distinct back-office roles
// instead of one flat 'admin', so role is now a required, validated input
// rather than hardcoded; and Garden Sewa hashes the PIN with bcrypt into
// pin_hash (0001_security_hardening.sql's crypt()-compatible column) instead
// of HomeSewa's plaintext `pin` column — admin-login already expects a bcrypt
// hash here, so this has to produce one, not carry HomeSewa's storage forward.
// No promotion-from-professional branch either — Garden Sewa's gardener
// applicants are a separate table with their own review flow, not a pool an
// admin account gets created from.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'super_admin') {
      return json({ success: false, message: 'Please log in again.' }, 401);
    }

    const { phone, fullName, pin, role, allowedCities } = await req.json();
    const cleaned = cleanPhone(phone);
    if (!cleaned) return json({ success: false, message: 'phone is required' }, 400);
    if (!fullName) return json({ success: false, message: 'fullName is required' }, 400);
    if (!pin || String(pin).length !== 4) {
      return json({ success: false, message: 'A 4-digit pin is required' }, 400);
    }
    if (!VALID_ROLES.has(role)) {
      return json({ success: false, message: 'A valid role is required' }, 400);
    }

    const { data: existing } = await supabaseAdmin
      .from('admin').select('id').eq('phone', cleaned).maybeSingle();
    if (existing) {
      return json({ success: false, message: 'This phone number already has an account.' }, 409);
    }

    const pinHash = await hash(String(pin), 10);

    const { error } = await supabaseAdmin.from('admin').insert([{
      full_name: fullName,
      phone: cleaned,
      pin_hash: pinHash,
      role,
      status: 'Active',
      allowed_cities: Array.isArray(allowedCities) && allowedCities.length > 0 ? allowedCities : null,
    }]);
    if (error) throw new Error(error.message);

    return json({ success: true });
  } catch (e) {
    console.error('admin-create error:', e);
    return json({ success: false, message: 'Could not create account' }, 500);
  }
});
