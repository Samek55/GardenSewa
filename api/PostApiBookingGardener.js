import { invokeEdgeFunction } from './functionsClient';

export const listOpenBookings = () =>
    invokeEdgeFunction('list-open-bookings', {}, 'Could not load bookings', { requireSession: true });

export const submitLeadUnlockProof = (bookingId, proofUrl, referenceNote) =>
    invokeEdgeFunction('submit-lead-unlock-proof', { bookingId, proofUrl, referenceNote }, 'Could not submit payment proof', { requireSession: true });

export const acceptBooking = (bookingId, dealAmount, dealNote) =>
    invokeEdgeFunction('accept-booking', { bookingId, dealAmount, dealNote }, 'Could not accept this job', { requireSession: true });

export const completeBooking = (bookingId, code, completionPhotos) =>
    invokeEdgeFunction('complete-booking', { bookingId, code, completionPhotos }, 'Could not mark this job as completed', { requireSession: true });

export const updateBookingSchedule = (bookingId, code, { budget, startDate, endDate, workDescription }) =>
    invokeEdgeFunction(
        'update-booking-schedule',
        { bookingId, code, budget, startDate, endDate, workDescription },
        'Could not update this booking',
        { requireSession: true }
    );
