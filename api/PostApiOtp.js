import { invokeEdgeFunction } from './functionsClient';

export const sendOtp = (phone, purpose, name) =>
    invokeEdgeFunction('send-otp', { phone, purpose, name }, 'Could not send OTP');

export const verifyOtp = (phone, purpose, code) =>
    invokeEdgeFunction('verify-otp', { phone, purpose, code }, 'Verification failed');
