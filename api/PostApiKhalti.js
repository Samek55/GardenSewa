import { invokeEdgeFunction } from './functionsClient';

export const initiateLeadPayment = (bookingId, returnUrl) =>
    invokeEdgeFunction(
        'initiate-lead-payment',
        { bookingId, returnUrl },
        'Could not start payment',
        { requireSession: true }
    );

export const verifyLeadPayment = (bookingId) =>
    invokeEdgeFunction('verify-lead-payment', { bookingId }, 'Could not verify payment', { requireSession: true });
