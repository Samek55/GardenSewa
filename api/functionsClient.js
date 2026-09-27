import { FunctionsHttpError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// A non-2xx response from an Edge Function still carries its structured JSON body
// (e.g. { success: false, message: '...' }) on error.context — read it instead of
// discarding it, since callers need that message, not just a generic error.
//
// requireSession: true attaches the logged-in admin's/gardener's session token
// (see supabase/migrations/0004_admin_roles_and_customer.sql) as the
// x-admin-session-token header — never Authorization, which Supabase's
// gateway already consumes for the anon-key JWT check before function code
// runs. Only pass this for functions that actually verify the token
// server-side (everything except admin-login itself).
//
// requireCustomerSession: true does the same for a logged-in customer's
// token (see 0029_customer_sessions.sql) as x-customer-session-token —
// separate header/table from the admin one since a customer session is a
// much lighter-weight thing (no role, no lockout) than an admin/gardener one.
const INVOKE_TIMEOUT_MS = 15000;

// Set by AdminAuthContext — called when a session-gated call comes back 401
// and session-status confirms the token itself is dead (expired, or the
// account was disabled), so the app signs out instead of looking logged in.
// A 401 alone isn't enough: many functions also answer a valid session with
// the wrong role with the same 401 "Please log in again."
let onAdminSessionEnded = null;
let checkingSession = false;
export const setAdminSessionEndedHandler = (handler) => {
    onAdminSessionEnded = handler;
};

async function checkAdminSessionEnded(headers) {
    if (!onAdminSessionEnded || checkingSession) return;
    checkingSession = true;
    try {
        const { data } = await supabase.functions.invoke('session-status', { body: {}, headers });
        if (data && data.valid === false) await onAdminSessionEnded();
    } catch {
        // Network trouble etc. — don't sign anyone out on a guess.
    } finally {
        checkingSession = false;
    }
}

export async function invokeEdgeFunction(name, body, fallbackMessage, options) {
    let headers;
    if (options?.requireSession) {
        const token = await AsyncStorage.getItem('adminSessionToken');
        if (token) headers = { 'x-admin-session-token': token };
    } else if (options?.requireCustomerSession) {
        const token = await AsyncStorage.getItem('customerSessionToken');
        if (token) headers = { 'x-customer-session-token': token };
    }

    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${name} timed out`)), INVOKE_TIMEOUT_MS)
    );

    const { data, error } = await Promise.race([
        supabase.functions.invoke(name, { body, headers }),
        timeout,
    ]);
    if (!error) return data;
    if (error instanceof FunctionsHttpError) {
        if (options?.requireSession && headers && error.context?.status === 401) {
            checkAdminSessionEnded(headers);
        }
        try {
            return await error.context.json();
        } catch {
            // body wasn't JSON — fall through to the generic error below
        }
    }
    throw new Error(error?.message || fallbackMessage);
}
