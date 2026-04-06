import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, ArrowRight, Phone, Mail, ChevronDown, Calendar, Eye, EyeOff, Check, Shield, Globe, Headset } from 'lucide-react';

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
];

import GlassyDatePicker from '../components/GlassyDatePicker';

import { auth, googleProvider, setupRecaptcha } from '../config/firebase';
import { signInWithPhoneNumber, signInWithPopup, ConfirmationResult, signInWithEmailLink, sendSignInLinkToEmail, isSignInWithEmailLink } from 'firebase/auth';
import { User } from '../types';
import { useAppContext } from '../context/AppContext';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { setCurrentUser } = useAppContext() || { setCurrentUser: () => {} };
  const [step, setStep] = useState<'intro' | 'phone' | 'email' | 'otp' | 'profile'>('intro');
  
  // Auth States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isEmailMock, setIsEmailMock] = useState(false);
  
  // OTP Timer
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Profile States
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [showBirthday, setShowBirthday] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    try {
      if (step === 'phone') {
        const fullPhone = `${selectedCountry.code}${phoneNumber}`;
        const appVerifier = setupRecaptcha('recaptcha-container');
        const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
        setConfirmationResult(confirmation);
        setIsEmailMock(false);
      } else {
        // Email mock login
        setIsEmailMock(true);
      }
      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleResendOtp = () => {
    handleSendOtp();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    try {
      if (isEmailMock) {
        if (code === '123456') {
          setStep('profile');
        } else {
          alert('Invalid Mock OTP. Use 123456');
        }
      } else if (confirmationResult) {
        await confirmationResult.confirm(code);
        setStep('profile');
      }
    } catch (error: any) {
      alert("Invalid OTP: " + error.message);
    }
  };

  const syncProfileWithBackend = async (data: any) => {
    try {
      // Clear the logged-out flag so session persists on next reload
      localStorage.removeItem('aqualyn_logged_out');
      let idToken = '';
      if (isEmailMock) {
        idToken = `MOCK_TOKEN_${email}`;
        localStorage.setItem('mock_auth_token', idToken);
      } else {
        idToken = await auth.currentUser?.getIdToken() || '';
        localStorage.removeItem('mock_auth_token'); // Clear it if using real auth
      }
      
      const res = await fetch('http://localhost:5000/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to sync profile');
      const resData = await res.json();
      setCurrentUser(resData.user);
      onLogin(); 
    } catch (error) {
      console.error(error);
      alert('Failed to sync with server');
    }
  };

  const handleCompleteSetup = () => {
    if (displayName.trim()) {
      syncProfileWithBackend({ displayName, dob, showBirthday, phone: phoneInput });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Auto-sync to check if profile is complete
      const idToken = await user.getIdToken();
      const res = await fetch('http://localhost:5000/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({}) // Initial sync
      });
      
      if (res.ok) {
        const resData = await res.json();
        setCurrentUser(resData.user);
        // Clear logged-out flag
        localStorage.removeItem('aqualyn_logged_out');
        
        // If user already has a dob, they have completed setup
        if (resData.user.dob) {
           onLogin();
        } else {
           if (user.displayName) setDisplayName(user.displayName);
           setStep('profile');
        }
      } else {
        throw new Error('Failed to sync with backend');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center liquid-bg px-4 py-8 relative overflow-hidden"
    >
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-secondary-fixed/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] -right-[5%] w-[40%] h-[40%] rounded-full bg-primary-container/20 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center w-full"
            >
              <div className="w-28 h-28 mb-8 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-[2.5rem] rotate-12 opacity-40 group-hover:rotate-45 transition-transform duration-700"></div>
                <div className="relative w-full h-full bg-surface-container-lowest rounded-[2.5rem] flex items-center justify-center glass-card inner-glow aqua-glow shadow-2xl">
                  <Droplet className="text-secondary w-14 h-14 fill-secondary" />
                </div>
              </div>
              <h1 className="font-headline text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary mb-4">Aqualyn</h1>
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">India's Best Messaging App</h2>
              <p className="font-body text-on-surface-variant text-base font-medium tracking-wide mb-12 max-w-xs leading-relaxed">
                Not your average chat app. Experience crystal clear, fluid communication designed for the modern world.
              </p>
              <button onClick={() => setStep('phone')} className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {(step === 'phone' || step === 'email') && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full glass-card border border-white/30 rounded-[2.5rem] p-8 sm:p-10 inner-glow shadow-2xl"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-headline text-on-surface mb-2">Welcome Back</h2>
                <p className="text-on-surface-variant text-sm">
                  {step === 'phone' ? 'Enter your phone number to continue.' : 'Enter your email address to continue.'}
                </p>
              </div>

              <div className="space-y-5">
                {step === 'phone' ? (
                  <div className="space-y-2">
                    <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">Phone Number</label>
                    <div className="flex gap-2 relative w-full" ref={dropdownRef}>
                      <button 
                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        className="h-14 px-3 sm:px-4 bg-white/40 border-outline-variant/20 border rounded-2xl flex items-center gap-1 sm:gap-2 hover:bg-white/60 transition-colors shadow-inner shrink-0"
                      >
                        <span className="text-lg sm:text-xl">{selectedCountry.flag}</span>
                        <span className="font-semibold text-on-surface text-sm sm:text-base">{selectedCountry.code}</span>
                        <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                      </button>
                      
                      <AnimatePresence>
                        {isCountryDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-[calc(100%+8px)] left-0 w-64 glass-card border border-white/40 rounded-2xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar"
                          >
                            {COUNTRIES.map((country) => (
                              <button
                                key={country.code}
                                onClick={() => { setSelectedCountry(country); setIsCountryDropdownOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/40 transition-colors text-left"
                              >
                                <span className="text-xl">{country.flag}</span>
                                <span className="font-semibold text-on-surface flex-1 truncate">{country.name}</span>
                                <span className="text-on-surface-variant text-sm shrink-0">{country.code}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="000 000 0000" 
                        className="flex-1 min-w-0 h-14 bg-white/40 border-outline-variant/20 border rounded-2xl px-3 sm:px-4 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface font-semibold tracking-wide shadow-inner text-sm sm:text-base"
                        autoFocus
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">Email Address</label>
                    <div className="relative group">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com" 
                        className="w-full h-14 bg-white/40 border-outline-variant/20 border rounded-2xl pl-12 pr-4 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface shadow-inner"
                        autoFocus
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSendOtp} 
                  disabled={step === 'phone' ? !phoneNumber : !email}
                  className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/20"></div>
                  <span className="flex-shrink-0 mx-4 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-white/20"></div>
                </div>

                <button 
                  onClick={handleGoogleSignIn}
                  className="w-full h-14 glass-card bg-white/40 border border-white/40 text-on-surface font-headline font-bold rounded-2xl hover:bg-white/60 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <button 
                  onClick={() => setStep(step === 'phone' ? 'email' : 'phone')}
                  className="w-full py-2 text-sm font-bold text-secondary hover:text-primary transition-colors text-center"
                >
                  {step === 'phone' ? 'Use email instead' : 'Use phone number instead'}
                </button>
              </div>
              <div id="recaptcha-container"></div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div 
              key="otp"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full glass-card border border-white/30 rounded-[2.5rem] p-8 sm:p-10 inner-glow shadow-2xl"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-headline text-on-surface mb-2">Verify it's you</h2>
                <p className="text-on-surface-variant text-sm">
                  We sent a 6-digit code to <span className="font-semibold text-on-surface">{email || `${selectedCountry.code} ${phoneNumber}`}</span>
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otp.map((digit, i) => (
                    <input 
                      key={i} 
                      id={`otp-${i}`}
                      type="text" 
                      maxLength={1} 
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value.replace(/\D/g, ''))}
                      className="w-10 h-12 sm:w-12 sm:h-14 glass-card bg-white/50 border border-white/40 rounded-xl sm:rounded-2xl text-center text-xl sm:text-2xl font-headline font-bold text-primary focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none shadow-inner" 
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleVerifyOtp} 
                    disabled={otp.some(d => !d)}
                    className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Verify & Enter
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  
                  <button 
                    onClick={handleResendOtp}
                    disabled={!canResend}
                    className={`text-sm font-bold transition-colors text-center ${canResend ? 'text-secondary hover:text-primary' : 'text-on-surface-variant/50 cursor-not-allowed'}`}
                  >
                    {canResend ? 'Resend Code' : `Resend Code in 00:${resendTimer.toString().padStart(2, '0')}`}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full glass-card border border-white/30 rounded-[2.5rem] p-8 sm:p-10 inner-glow shadow-2xl"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-headline text-on-surface mb-2">Complete Profile</h2>
                <p className="text-on-surface-variant text-sm">Just a few details to get you started.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivero" 
                    className="w-full h-14 bg-white/40 border-outline-variant/20 border rounded-2xl px-4 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface shadow-inner"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">Date of Birth</label>
                  <GlassyDatePicker value={dob} onChange={setDob} />
                </div>

                <div className="flex items-center justify-between p-4 glass-card bg-white/30 border border-white/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    {showBirthday ? <Eye className="w-5 h-5 text-secondary" /> : <EyeOff className="w-5 h-5 text-on-surface-variant" />}
                    <div>
                      <p className="font-semibold text-sm text-on-surface">Show Birthday</p>
                      <p className="text-xs text-on-surface-variant">Let friends know it's your special day</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowBirthday(!showBirthday)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${showBirthday ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                  >
                    <motion.div 
                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                      animate={{ x: showBirthday ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <button 
                  onClick={handleCompleteSetup} 
                  disabled={!displayName.trim() || !dob}
                  className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-4"
                >
                  Complete Setup
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 'intro' && (
          <footer className="mt-12 text-center w-full">
            <div className="flex items-center justify-center gap-6">
              {[Globe, Shield, Headset].map((Icon, i) => (
                <div key={i} className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer border border-white/20">
                  <Icon className="w-5 h-5" />
                </div>
              ))}
            </div>
          </footer>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 p-6 sm:p-8 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-secondary-fixed shadow-[0_0_10px_#0bfbff] animate-pulse"></div>
        <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Network Secure</span>
      </div>
    </motion.div>
  );
}
