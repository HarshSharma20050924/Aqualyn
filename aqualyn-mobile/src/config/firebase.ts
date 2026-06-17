import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyD_T2pumFj4FvOUFAmCiZSk4Zpfb2tJ2TI",
  authDomain: "bybp-3f1aa.firebaseapp.com",
  projectId: "bybp-3f1aa",
  storageBucket: "bybp-3f1aa.firebasestorage.app",
  messagingSenderId: "833661381458",
  appId: "1:833661381458:web:60f00472081f5ac8cf688b",
  measurementId: "G-ESEWH5T9SY"
};

// App and Auth will be initialized inside the getter to avoid SSR issues
let app: any;
let auth: any;

// Export functions to get Firebase services
export const getFirebaseAuth = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth cannot be initialized on the server side.');
  }

  // Dynamically import firebase/auth so it's not evaluated during SSR
  const { 
    getAuth, 
    setPersistence, 
    browserSessionPersistence, 
    signInWithPhoneNumber, 
    GoogleAuthProvider,
    RecaptchaVerifier,
    signInWithPopup
  } = await import('firebase/auth');

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  if (!auth) {
    auth = getAuth(app);
  }

  // Set persistence
  await setPersistence(auth, browserSessionPersistence);
  
  console.log('[Firebase Web] Auth initialized with browser session persistence');

  const googleProvider = new GoogleAuthProvider();

  const requestNativePhoneOtp = async (phoneNumber: string, applicationVerifier: any) => {
    try {
      console.log('[Firebase Web] Requesting OTP for:', phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
      return confirmationResult; // Contains .confirm(code) method
    } catch (error) {
      console.error('[Firebase Web] Error:', error);
      throw error;
    }
  };

  return { 
    auth, 
    requestNativePhoneOtp, 
    googleProvider,
    RecaptchaVerifier,
    signInWithPopup
  };
};
