import { invokeEdgeFunction } from './functionsClient';

export const adminLogin = (phone, pin) =>
    invokeEdgeFunction('admin-login', { phone, pin }, 'Login failed');

export const adminLogout = () =>
    invokeEdgeFunction('admin-logout', {}, 'Logout failed', { requireSession: true });

export const listGardenerApplications = (status) =>
    invokeEdgeFunction(
        `list-gardener-applications${status ? `?status=${encodeURIComponent(status)}` : ''}`,
        {},
        'Could not load applications',
        { requireSession: true }
    );

export const approveGardener = (id) =>
    invokeEdgeFunction('approve-gardener', { id }, 'Could not approve this application', { requireSession: true });

export const rejectGardener = (id, reason) =>
    invokeEdgeFunction('reject-gardener', { id, reason }, 'Could not reject this application', { requireSession: true });

export const getGardenerDocumentUrl = (id) =>
    invokeEdgeFunction('get-gardener-document-url', { id }, 'Could not open document', { requireSession: true });

export const listAdmins = () =>
    invokeEdgeFunction('list-admins', {}, 'Could not load admin accounts', { requireSession: true });

export const createAdmin = (phone, fullName, pin, role, allowedCities) =>
    invokeEdgeFunction('admin-create', { phone, fullName, pin, role, allowedCities }, 'Could not create account', { requireSession: true });

export const toggleAdminStatus = (id, status) =>
    invokeEdgeFunction('toggle-admin-status', { id, status }, 'Could not update status', { requireSession: true });

export const updateAdminCities = (id, allowedCities) =>
    invokeEdgeFunction('update-admin-cities', { id, allowedCities }, 'Could not save', { requireSession: true });

export const submitBookingForCustomer = (fields) =>
    invokeEdgeFunction('submit-booking-for-customer', fields, 'Could not submit booking', { requireSession: true });

export const updateDraftBooking = (bookingId, fields) =>
    invokeEdgeFunction('update-draft-booking', { bookingId, ...fields }, 'Could not update this request', { requireSession: true });

export const publishBooking = (bookingId, visibility, assignedGardenerPhone) =>
    invokeEdgeFunction('publish-booking', { bookingId, visibility, assignedGardenerPhone }, 'Could not publish this request', { requireSession: true });

export const listHelpboxRequests = () =>
    invokeEdgeFunction('list-helpbox-requests', {}, 'Could not load help requests', { requireSession: true });

export const updateHelpboxRequest = (id, status, issue, reply) =>
    invokeEdgeFunction('update-helpbox-request', { id, status, issue, reply }, 'Could not save', { requireSession: true });

export const getMyProfile = () =>
    invokeEdgeFunction('get-my-profile', {}, 'Could not load profile', { requireSession: true });

export const updateMyProfile = (fields) =>
    invokeEdgeFunction('update-my-profile', fields, 'Could not save profile', { requireSession: true });

export const listPartnershipApplications = () =>
    invokeEdgeFunction('list-partnership-applications', {}, 'Could not load partnership applications', { requireSession: true });

export const updatePartnershipStatus = (id, status) =>
    invokeEdgeFunction('update-partnership-status', { id, status }, 'Could not save', { requireSession: true });

export const listGardeners = () =>
    invokeEdgeFunction('list-gardeners', {}, 'Could not load gardeners', { requireSession: true });

export const toggleGardenerStatus = (id, status) =>
    invokeEdgeFunction('toggle-gardener-status', { id, status }, 'Could not update status', { requireSession: true });

export const listCustomers = () =>
    invokeEdgeFunction('list-customers', {}, 'Could not load customers', { requireSession: true });

export const toggleCustomerStatus = (id, status) =>
    invokeEdgeFunction('toggle-customer-status', { id, status }, 'Could not update status', { requireSession: true });

export const changePin = (currentPin, newPin) =>
    invokeEdgeFunction('change-pin', { currentPin, newPin }, 'Could not change PIN', { requireSession: true });

export const reassignBooking = (bookingId, newGardenerPhone) =>
    invokeEdgeFunction('reassign-booking', { bookingId, newGardenerPhone }, 'Could not reassign this job', { requireSession: true });
