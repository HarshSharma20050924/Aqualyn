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

let auth: any = null;
let requestNativePhoneOtp: any = null;

if (Platform.OS === 'web') {
  // Web SDK imports (using require so it doesn't crash React Native bundler if unlinked)
  const { initializeApp } = require('firebase/app');
  const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = require('firebase/auth');
  
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  requestNativePhoneOtp = async (phoneNumber: string, applicationVerifier: any) => {
    try {
      console.log('[Firebase Web] Requesting OTP for:', phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
      return confirmationResult; // Contains .confirm(code) method
    } catch (error) {
      console.error('[Firebase Web] Error:', error);
      throw error;
    }
  };
} else {
  // Native SDK imports
  const authModule = require('@react-native-firebase/auth').default;
  auth = authModule();

  requestNativePhoneOtp = async (phoneNumber: string) => {
    try {
      console.log('[Firebase Native] Requesting OTP for:', phoneNumber);
      const confirmation = await auth.signInWithPhoneNumber(phoneNumber);
      return confirmation; // Contains .confirm(code) method
    } catch (error) {
      console.error('[Firebase Native] Error:', error);
      throw error;
    }
  };
}

export { auth, requestNativePhoneOtp };
