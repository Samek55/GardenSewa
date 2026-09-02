import { invokeEdgeFunction } from './functionsClient';

export const notifyGardenerApplicationReceived = (applicantName) =>
    invokeEdgeFunction('send-notification', { purpose: 'gardener-application-received', applicantName }, 'Could not send notification');
