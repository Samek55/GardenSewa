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
