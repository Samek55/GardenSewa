import { invokeEdgeFunction } from './functionsClient';

export const listMyBookings = (phone) =>
    invokeEdgeFunction('list-my-bookings', { phone }, 'Could not load bookings');

export const listBookingMessages = (bookingId, viewerPhone) =>
    invokeEdgeFunction('list-booking-messages', { bookingId, viewerRole: 'customer', viewerPhone }, 'Could not load messages');

export const sendBookingMessage = (bookingId, senderPhone, body) =>
    invokeEdgeFunction('send-booking-message', { bookingId, senderRole: 'customer', senderPhone, body }, 'Could not send message');

export const submitRating = (bookingId, raterPhone, rating, comment) =>
    invokeEdgeFunction('submit-rating', { bookingId, raterRole: 'customer', raterPhone, rating, comment }, 'Could not submit rating');

export const listRatingsForBooking = (bookingId) =>
    invokeEdgeFunction(`list-ratings?bookingId=${encodeURIComponent(bookingId)}`, {}, 'Could not load rating');
