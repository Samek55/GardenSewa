import { invokeEdgeFunction } from './functionsClient';

export const notifyGardenerApplicationReceived = (applicantName) =>
    invokeEdgeFunction('send-notification', { purpose: 'gardener-application-received', applicantName }, 'Could not send notification');

export const notifyLeadUnlockApproved = (requestId) =>
    invokeEdgeFunction('send-notification', { purpose: 'lead-unlock-approved', requestId }, 'Could not send notification');

export const notifyLeadUnlockRejected = (requestId) =>
    invokeEdgeFunction('send-notification', { purpose: 'lead-unlock-rejected', requestId }, 'Could not send notification');

export const notifyBookingAccepted = (bookingId) =>
    invokeEdgeFunction('send-notification', { purpose: 'booking-accepted', bookingId }, 'Could not send notification');

export const notifyJobCompleted = (bookingId) =>
    invokeEdgeFunction('send-notification', { purpose: 'job-completed', bookingId }, 'Could not send notification');
