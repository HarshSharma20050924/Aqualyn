import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, ArrowRight, Mail, Eye, EyeOff, Check, Shield, Globe, Headset, Phone } from 'lucide-react';

import GlassyDatePicker from '../components/GlassyDatePicker';
import BubbleLoader from '../components/ui/BubbleLoader';
import { supabase } from '../config/supabase';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { useAppContext } from '../context/AppContext';
import { ENDPOINTS } from '../config/api';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { setCurrentUser, currentUser } = useAppContext() || { setCurrentUser: () => {}, currentUser: null };
  const [step, setStep] = useState<'intro' | 'email' | 'otp' | 'profile'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [showBirthday, setShowBirthday] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(p => p - 1), 1000);
    } else if (resendTimer === 0) setCanResend(true);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  useEffect(() => {
    if (currentUser && !currentUser.id) {
      setStep('profile');
      if (currentUser.displayName) setDisplayName(currentUser.displayName);
      if (currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser]);

  // ── Detect mobile ──
  const isMobile = typeof window !== 'undefined' && (
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Mobile/i.test(navigator.userAgent) ||
    window.matchMedia('(hover: none)').matches
  );

  // ── Send OTP via Supabase ──
  const handleSendOtp = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) throw new Error(error.message);

      // Check if already in our DB
      const res = await fetch(`${ENDPOINTS.AUTH_SEND_OTP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email })
      });
      // We just use the response for isExisting flag; OTP is sent by Supabase above
      const data = await res.json().catch(() => ({}));
      setIsExistingUser(!!data.isExisting);

      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      alert(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  // ── Verify OTP via Supabase then sync with backend ──
  const handleVerifyOtp = async () => {
    setIsLoading(true);
    const code = otp.join('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      });
      if (error || !data.session) throw new Error(error?.message || 'Invalid or expired OTP');

      const supabaseAccessToken = data.session.access_token;
      await syncWithBackend(supabaseAccessToken);
    } catch (err: any) {
      alert(err.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sync Supabase session with our backend ──
  const syncWithBackend = async (supabaseToken: string, extraBody: Record<string, any> = {}) => {
    setIsLoading(true);
    try {
      const res = await fetch(ENDPOINTS.AUTH_SYNC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseToken}`
        },
        credentials: 'include',
        body: JSON.stringify(extraBody)
      });
      const resData = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 404) { setStep('intro'); return; }
      if (!res.ok) throw new Error(resData.error || 'Sync failed');

      if (resData.status === 'needs_profile') {
        setStep('profile');
        if (resData.user?.displayName) setDisplayName(resData.user.displayName);
        return;
      }
      if (resData.user) {
        const mapped = {
          ...resData.user,
          following: resData.user.following?.map((f: any) => f.followingId || f.userId).filter(Boolean) || [],
          followers: resData.user.followers?.map((f: any) => f.followerId || f.userId).filter(Boolean) || [],
        };
        setCurrentUser(mapped);
        if (resData.user.dob && resData.user.displayName) { onLogin(); }
        else setStep('profile');
      }
    } catch (err: any) {
      alert(err.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!displayName.trim() || !dob) return;
    setIsLoading(true);
    try {
      // Try to get a Supabase session token (for email OTP flow)
      // If there's no Supabase session, we rely on the httpOnly cookie set by Google sign-in
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(ENDPOINTS.AUTH_SYNC, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ displayName, dob, showBirthday })
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Setup failed');
      if (resData.user) {
        const mapped = {
          ...resData.user,
          following: resData.user.following?.map((f: any) => f.followingId || f.userId).filter(Boolean) || [],
          followers: resData.user.followers?.map((f: any) => f.followerId || f.userId).filter(Boolean) || [],
        };
        setCurrentUser(mapped);
        onLogin();
      }
    } catch (err: any) {
      alert(err.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google sign-in (Firebase → our /api/auth/google-signin) ──
  const handleGoogleSignIn = useCallback(async () => {
    if (isLoading || isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      let firebaseResult: any;
      if (isMobile) {
        localStorage.setItem('_gg_signin_active', '1');
        await signInWithRedirect(auth, googleProvider);
        return;
      } else {
        firebaseResult = await signInWithPopup(auth, googleProvider);
      }
      if (!firebaseResult?.user) return;
      await processGoogleUser(firebaseResult);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      alert(err.message || 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  }, [isLoading, isGoogleLoading, isMobile, onLogin]);

  const processGoogleUser = async (result: any) => {
    const idToken = await result.user.getIdToken();
    const res = await fetch(`${ENDPOINTS.AUTH_SYNC.replace('/sync', '/google-signin')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken })
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(resData.error || 'Google sign-in failed');

    if (resData.status === 'needs_profile') {
      // Prefill profile data from Google
      if (resData.user?.displayName) setDisplayName(resData.user.displayName);
      if (resData.user?.email) setEmail(resData.user.email);
      setStep('profile');
      return;
    }
    if (resData.user) {
      const mapped = {
        ...resData.user,
        following: resData.user.following?.map((f: any) => f.followingId || f.userId).filter(Boolean) || [],
        followers: resData.user.followers?.map((f: any) => f.followerId || f.userId).filter(Boolean) || [],
      };
      setCurrentUser(mapped);
      onLogin();
    }
  };

  // Handle Google redirect result on mount
  useEffect(() => {
    if (!localStorage.getItem('_gg_signin_active')) return;
    setIsGoogleLoading(true);
    getRedirectResult(auth).then(async (result) => {
      if (!result?.user) return;
      localStorage.removeItem('_gg_signin_active');
      await processGoogleUser(result);
    }).catch(console.error).finally(() => setIsGoogleLoading(false));
  }, []);

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center liquid-bg px-4 py-8 relative overflow-hidden"
    >
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-secondary-fixed/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] -right-[5%] w-[40%] h-[40%] rounded-full bg-primary-container/20 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center w-full">
              <div className="w-28 h-28 mb-8 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-[2.5rem] rotate-12 opacity-40 group-hover:rotate-45 transition-transform duration-700" />
                <div className="relative w-full h-full bg-surface-container-lowest rounded-[2.5rem] flex items-center justify-center glass-card inner-glow aqua-glow shadow-2xl">
                  <Droplet className="text-secondary w-14 h-14 fill-secondary" />
                </div>
              </div>
              <h1 className="font-headline text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary mb-4">Aqualyn</h1>
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">India's Best Messaging App</h2>
              <p className="font-body text-on-surface-variant text-base font-medium tracking-wide mb-12 max-w-xs leading-relaxed">
                Experience crystal clear, fluid communication designed for the modern world.
              </p>
              <button onClick={() => setStep('email')}
                className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg">
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── EMAIL STEP ── */}
          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full glass-card border border-white/30 rounded-[2.5rem] p-8 sm:p-10 inner-glow shadow-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-headline text-on-surface mb-2">
                  {isExistingUser === true ? 'Welcome Back' : 'Join Aqualyn'}
                </h2>
                <p className="text-on-surface-variant text-sm">
                  {isExistingUser === true ? 'Sign in to continue your conversations.' : "Create an account and start messaging."}
                </p>
              </div>

              <div className="space-y-4">
                {/* Email input */}
                <div className="space-y-2">
                  <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">Email Address</label>
                  <div className="relative group">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && email && handleSendOtp()}
                      placeholder="name@example.com"
                      className="w-full h-14 bg-white/40 border-outline-variant/20 border rounded-2xl pl-12 pr-4 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface shadow-inner"
                      autoFocus />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-secondary transition-colors" />
                  </div>
                </div>

                <button onClick={handleSendOtp} disabled={!email || isLoading}
                  className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
                  {isLoading ? <BubbleLoader width={24} height={24} /> : <><span>Send OTP</span><ArrowRight className="w-5 h-5" /></>}
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/20" />
                  <span className="flex-shrink-0 mx-4 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-white/20" />
                </div>

                <button onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}
                  className="w-full h-14 glass-card bg-white/40 border border-white/40 text-on-surface font-headline font-bold rounded-2xl hover:bg-white/60 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:pointer-events-none">
                  {isGoogleLoading ? <BubbleLoader width={24} height={24} /> : <><GoogleIcon /><span>Continue with Google</span></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── OTP STEP ── */}
          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full glass-card border border-white/30 rounded-[2.5rem] p-8 sm:p-10 inner-glow shadow-2xl">
              <div className="mb-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-secondary/20 to-primary-container/20 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-secondary" />
                </motion.div>
                <h2 className="text-2xl font-bold font-headline text-on-surface mb-2 text-center">Check your email</h2>
                <p className="text-on-surface-variant text-sm text-center">
                  We sent a 6-digit code to <span className="font-semibold text-on-surface">{email}</span>
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otp.map((digit, i) => (
                    <motion.input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => { if (e.key === 'Backspace' && !digit && i > 0) document.getElementById(`otp-${i - 1}`)?.focus(); }}
                      className="w-10 h-12 sm:w-12 sm:h-14 glass-card bg-white/50 border border-white/40 rounded-xl sm:rounded-2xl text-center text-xl sm:text-2xl font-headline font-bold text-primary focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none shadow-inner"
                      autoFocus={i === 0}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 300 }}
                      whileFocus={{ scale: 1.1 }}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <button onClick={handleVerifyOtp} disabled={otp.some(d => !d) || isLoading}
                    className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
                    {isLoading ? <BubbleLoader width={24} height={24} /> : <><span>Verify &amp; Enter</span><ArrowRight className="w-5 h-5" /></>}
                  </button>
                  <button onClick={handleSendOtp} disabled={!canResend}
                    className={`text-sm font-bold transition-colors text-center ${canResend ? 'text-secondary hover:text-primary' : 'text-on-surface-variant/50 cursor-not-allowed'}`}>
                    {canResend ? 'Resend Code' : `Resend in 00:${resendTimer.toString().padStart(2, '0')}`}
                  </button>
                  <button onClick={() => setStep('email')} className="text-xs text-on-surface-variant/60 hover:text-secondary transition-colors text-center">
                    ← Change email
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PROFILE STEP ── */}
          {step === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full glass-card border border-white/30 rounded-[2.5rem] p-8 sm:p-10 inner-glow shadow-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-headline text-on-surface mb-2">Complete Profile</h2>
                <p className="text-on-surface-variant text-sm">Just a few details to get you started.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">Display Name</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivero"
                    className="w-full h-14 bg-white/40 border-outline-variant/20 border rounded-2xl px-4 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface shadow-inner"
                    autoFocus />
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
                  <button onClick={() => setShowBirthday(!showBirthday)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${showBirthday ? 'bg-secondary' : 'bg-surface-container-highest'}`}>
                    <motion.div className="w-4 h-4 rounded-full bg-white shadow-sm"
                      animate={{ x: showBirthday ? 24 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  </button>
                </div>
                <button onClick={handleCompleteSetup} disabled={!displayName.trim() || !dob || isLoading}
                  className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-4">
                  {isLoading ? <BubbleLoader width={24} height={24} /> : <><span>Complete Setup</span><Check className="w-5 h-5" /></>}
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
        <div className="w-3 h-3 rounded-full bg-secondary-fixed shadow-[0_0_10px_#0bfbff] animate-pulse" />
        <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Network Secure</span>
      </div>
    </motion.div>
  );
}
