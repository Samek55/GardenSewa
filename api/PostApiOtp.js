import { invokeEdgeFunction } from './functionsClient';

// scopeKey narrows the OTP to one specific thing (e.g. a booking id) for
// purposes where the same phone can have more than one of that purpose in
// flight at once — 'work-completion' and 'schedule-update' pass their
// bookingId here so two concurrent bookings for the same customer can't
// invalidate each other's pending code (see supabase/functions/_shared/otp.ts).
export const sendOtp = (phone, purpose, name, scopeKey) =>
    invokeEdgeFunction('send-otp', { phone, purpose, name, scopeKey }, 'Could not send OTP');

export const verifyOtp = (phone, purpose, code) =>
    invokeEdgeFunction('verify-otp', { phone, purpose, code }, 'Verification failed');

export const resetPin = (phone, otpCode, newPin) =>
    invokeEdgeFunction('reset-pin', { phone, otpCode, newPin }, 'Could not reset PIN');
