import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyD_T2pumFj4FvOUFAmCiZSk4Zpfb2tJ2TI",
  authDomain: "bybp-3f1aa.firebaseapp.com",
  projectId: "bybp-3f1aa",
  storageBucket: "bybp-3f1aa.firebasestorage.app",
  messagingSenderId: "833661381458",
  appId: "1:833661381458:web:60f00472081f5ac8cf688b",
  measurementId: "G-ESEWH5T9SY"
};

// Export functions to get Firebase services
export const getFirebaseAuth = async () => {
  // Native SDK imports
  const authModule = require('@react-native-firebase/auth').default;
  const { GoogleAuthProvider } = require('@react-native-firebase/auth');
  const auth = authModule();
  const googleProvider = new GoogleAuthProvider();

  const requestNativePhoneOtp = async (phoneNumber: string) => {
    try {
      console.log('[Firebase Native] Requesting OTP for:', phoneNumber);
      const confirmation = await auth.signInWithPhoneNumber(phoneNumber);
      return confirmation; // Contains .confirm(code) method
    } catch (error) {
      console.error('[Firebase Native] Error:', error);
      throw error;
    }
  };

  return { auth, requestNativePhoneOtp, googleProvider };
};