import { invokeEdgeFunction } from './functionsClient';

// These four now require a customer session (see 0029_customer_sessions.sql)
// — the phone argument each still takes is kept for the caller's own local
// use (e.g. it's already threaded through from AuthContext at the call
// site), but the server derives who's actually asking from the session
// token, not from any phone the client sends.
export const listMyBookings = (phone) =>
    invokeEdgeFunction('list-my-bookings', { phone }, 'Could not load bookings', { requireCustomerSession: true });

export const listBookingMessages = (bookingId, viewerPhone) =>
    invokeEdgeFunction('list-booking-messages', { bookingId, viewerRole: 'customer', viewerPhone }, 'Could not load messages', { requireCustomerSession: true });

export const sendBookingMessage = (bookingId, senderPhone, body) =>
    invokeEdgeFunction('send-booking-message', { bookingId, senderRole: 'customer', senderPhone, body }, 'Could not send message', { requireCustomerSession: true });

export const submitRating = (bookingId, raterPhone, rating, comment) =>
    invokeEdgeFunction('submit-rating', { bookingId, raterRole: 'customer', raterPhone, rating, comment }, 'Could not submit rating', { requireCustomerSession: true });

export const listRatingsForBooking = (bookingId) =>
    invokeEdgeFunction(`list-ratings?bookingId=${encodeURIComponent(bookingId)}`, {}, 'Could not load rating');
