/**
 * firebase.ts
 * Mock/stub config since native JWT authentication is used and firebase package is not installed.
 */

export const auth = {
  currentUser: null,
};

export const googleProvider = {};

export const requestNativePhoneOtp = async (phoneNumber: string, applicationVerifier: any) => {
  console.log('[Firebase Auth Mock] Requesting OTP for:', phoneNumber);
  return { verificationId: 'mock-verification-id' };
};