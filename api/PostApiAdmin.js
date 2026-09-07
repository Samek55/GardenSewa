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

export const listLeadUnlockRequests = (status) =>
    invokeEdgeFunction(
        `list-lead-unlock-requests${status ? `?status=${encodeURIComponent(status)}` : ''}`,
        {},
        'Could not load payment requests',
        { requireSession: true }
    );

export const approveLeadUnlock = (id) =>
    invokeEdgeFunction('approve-lead-unlock', { id }, 'Could not approve this request', { requireSession: true });

export const rejectLeadUnlock = (id) =>
    invokeEdgeFunction('reject-lead-unlock', { id }, 'Could not reject this request', { requireSession: true });

export const submitBookingForCustomer = (fields) =>
    invokeEdgeFunction('submit-booking-for-customer', fields, 'Could not submit booking', { requireSession: true });

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
