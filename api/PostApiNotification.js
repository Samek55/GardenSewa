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

export const notifyPartnershipApplicationReceived = (organization) =>
    invokeEdgeFunction('send-notification', { purpose: 'partnership-application-received', organization }, 'Could not send notification');

// Staff/gardener: identified by their session token. Customer: no session
// exists for that identity in this app, so the phone they're already
// remembered by (AuthContext) is passed instead — same trust model as
// list-my-bookings.
export const listMyNotificationsAsStaff = () =>
    invokeEdgeFunction('list-my-notifications', {}, 'Could not load notifications', { requireSession: true });

export const listMyNotificationsAsCustomer = (phone) =>
    invokeEdgeFunction('list-my-notifications', { phone }, 'Could not load notifications');
