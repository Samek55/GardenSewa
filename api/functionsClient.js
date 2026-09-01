import { FunctionsHttpError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// A non-2xx response from an Edge Function still carries its structured JSON body
// (e.g. { success: false, message: '...' }) on error.context — read it instead of
// discarding it, since callers need that message, not just a generic error.
//
// requireSession: true attaches the logged-in admin's session token (see
// supabase/migrations/0004_admin_roles_and_customer.sql) as the
// x-admin-session-token header — never Authorization, which Supabase's
// gateway already consumes for the anon-key JWT check before function code
// runs. Only pass this for functions that actually verify the token
// server-side (everything except admin-login itself).
const INVOKE_TIMEOUT_MS = 15000;

export async function invokeEdgeFunction(name, body, fallbackMessage, options) {
    let headers;
    if (options?.requireSession) {
        const token = await AsyncStorage.getItem('adminSessionToken');
        if (token) headers = { 'x-admin-session-token': token };
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
        try {
            return await error.context.json();
        } catch {
            // body wasn't JSON — fall through to the generic error below
        }
    }
    throw new Error(error?.message || fallbackMessage);
}
