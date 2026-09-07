import { invokeEdgeFunction } from './functionsClient';

export const submitHelpbox = (phone, code) =>
    invokeEdgeFunction('submit-helpbox', { phone, code }, 'Could not submit your request');
