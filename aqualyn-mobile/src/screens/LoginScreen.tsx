import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Dimensions, Image
} from 'react-native';
import Animated, {
  FadeIn, FadeOut,
  useSharedValue, useAnimatedStyle, withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Droplet, ArrowRight, Mail, Eye, EyeOff, Check, Shield, Globe, Headset, Phone } from 'lucide-react-native';

import BubbleLoader from '../components/ui/BubbleLoader';
import GlassyDatePicker from '../components/GlassyDatePicker';
import { getSupabase } from '../config/supabase';
import { getFirebaseAuth } from '../config/firebase';
import { useAppContext } from '../context/AppContext';
import { ENDPOINTS, API_BASE_URL } from '../config/api';
import { apiFetch } from '../utils/fetcher';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const insets = useSafeAreaInsets();
  const { setCurrentUser } = useAppContext() || { setCurrentUser: () => {} };

  const [step, setStep] = useState<'intro' | 'email' | 'otp' | 'profile'>('intro');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [showBirthday, setShowBirthday] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<Array<TextInput | null>>([]);
  const switchVal = useSharedValue(showBirthday ? 22 : 2);
  useEffect(() => { switchVal.value = withSpring(showBirthday ? 22 : 2); }, [showBirthday]);
  const switchStyle = useAnimatedStyle(() => ({ transform: [{ translateX: switchVal.value }] }));

  useEffect(() => {
    let t: any;
    if (step === 'otp' && resendTimer > 0) t = setInterval(() => setResendTimer(p => p - 1), 1000);
    else if (resendTimer === 0) setCanResend(true);
    return () => clearInterval(t);
  }, [step, resendTimer]);

  // ── Send OTP via Supabase ──
  const handleSendOtp = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      const sb = getSupabase();
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw new Error(error.message);
      // Check existing user in our DB
      const res = await apiFetch(ENDPOINTS.AUTH_SEND_OTP, {
        method: 'POST', body: JSON.stringify({ identifier: email })
      });
      const data = await res.json().catch(() => ({}));
      setIsExistingUser(!!data.isExisting);
      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (e: any) {
      alert(e.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...otp]; next[i] = ''; setOtp(next);
      return;
    }
    
    // Handle pasting a full code
    if (clean.length > 1) {
      const chars = clean.split('').slice(0, 6);
      const next = [...otp];
      for (let j = 0; j < chars.length; j++) {
        if (i + j < 6) next[i + j] = chars[j];
      }
      setOtp(next);
      const nextFocus = Math.min(i + chars.length, 5);
      otpRefs.current[nextFocus]?.focus();
      return;
    }

    // Handle single digit input
    const next = [...otp]; next[i] = clean; setOtp(next);
    if (i < 5) otpRefs.current[i + 1]?.focus();
  };

  // ── Verify OTP via Supabase then sync with backend ──
  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const sb = getSupabase();
      const { data, error } = await sb.auth.verifyOtp({ email, token: otp.join(''), type: 'email' });
      if (error || !data.session) throw new Error(error?.message || 'Invalid or expired OTP');
      const accessToken = data.session.access_token;
      await AsyncStorage.setItem('auth_token', accessToken);
      await syncWithBackend(accessToken);
    } catch (e: any) {
      alert(e.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithBackend = async (supabaseToken: string, extra: Record<string, any> = {}) => {
    const res = await apiFetch(ENDPOINTS.AUTH_SYNC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseToken}` },
      body: JSON.stringify(extra)
    });
    const resData = await res.json().catch(() => ({}));
    if (res.status === 401) { setStep('email'); return; }
    if (!res.ok) throw new Error(resData.error || 'Sync failed');
    if (resData.token) {
      await AsyncStorage.setItem('auth_token', resData.token);
    }
    if (resData.status === 'needs_profile') {
      if (resData.user?.displayName) setDisplayName(resData.user.displayName);
      setStep('profile'); return;
    }
    if (resData.user) {
      setCurrentUser({ ...resData.user,
        following: resData.user.following?.map((f: any) => f.followingId || f.userId).filter(Boolean) || [],
        followers: resData.user.followers?.map((f: any) => f.followerId || f.userId).filter(Boolean) || []
      });
      if (resData.user.dob && resData.user.displayName) onLogin();
      else setStep('profile');
    }
  };

  const handleCompleteSetup = async () => {
    if (!displayName.trim() || !dob) return;
    setIsLoading(true);
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession().catch(() => ({ data: { session: null } }));
      const token = session?.access_token || await AsyncStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await apiFetch(ENDPOINTS.AUTH_SYNC, {
        method: 'POST', headers, body: JSON.stringify({ displayName, dob, showBirthday })
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Setup failed');
      if (resData.token) {
        await AsyncStorage.setItem('auth_token', resData.token);
      }
      if (resData.user) {
        setCurrentUser({ ...resData.user,
          following: resData.user.following?.map((f: any) => f.followingId || f.userId).filter(Boolean) || [],
          followers: resData.user.followers?.map((f: any) => f.followerId || f.userId).filter(Boolean) || []
        });
        onLogin();
      }
    } catch (e: any) { alert(e.message || 'Server error'); }
    finally { setIsLoading(false); }
  };

  // ── Google sign-in via Firebase ──
  const handleGoogleSignIn = async () => {
    alert('Google Auth requires native configuration. Please use Email OTP to sign in for now while we configure it.');
  };

  const GoogleIcon = () => (
    <View style={{ width: 18, height: 18, position: 'relative' }}>
      <View style={[s.gbar, { backgroundColor: '#4285F4', top: 0, left: 4, width: 10, height: 4 }]} />
      <View style={[s.gbar, { backgroundColor: '#34A853', bottom: 0, left: 4, width: 10, height: 4 }]} />
      <View style={[s.gbar, { backgroundColor: '#FBBC05', left: 0, top: 4, width: 4, height: 10 }]} />
      <View style={[s.gbar, { backgroundColor: '#EA4335', right: 0, top: 4, width: 4, height: 10 }]} />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        bounces={false} showsVerticalScrollIndicator={false}>
        <View style={s.bgTop} /><View style={s.bgBot} />

        <Animated.View style={s.shell}>
          {/* ── INTRO ── */}
          {step === 'intro' && (
            <Animated.View   style={s.center}>
              <View style={{ marginBottom: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={require('../../assets/images/aqualyn.png')} style={{ width: 140, height: 140, resizeMode: 'contain', borderRadius: 32 }} />
              </View>
              <Text style={[s.brand, { fontSize: 44, marginBottom: 8 }]}>Aqualyn</Text>
              <Text style={[s.subtitle, { fontSize: 24, marginBottom: 12 }]}>India's Best Messaging App</Text>
              <Text style={[s.body, { fontSize: 16, marginBottom: 40, paddingHorizontal: 10 }]}>Experience crystal clear, fluid communication designed for the modern world.</Text>
              <TouchableOpacity style={[s.btn, { height: 60, borderRadius: 9999, width: '90%' }]} onPress={() => setStep('email')}>
                <Text style={[s.btnTxt, { fontSize: 18 }]}>Get Started</Text><ArrowRight size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── EMAIL ── */}
          {step === 'email' && (
            <Animated.View   style={s.card}>
              <Text style={s.cardTitle}>{isExistingUser === true ? 'Welcome Back' : 'Join Aqualyn'}</Text>
              <Text style={s.cardDesc}>{isExistingUser === true ? 'Sign in to continue.' : "Create an account and start messaging."}</Text>

              <View style={s.fields}>
                <Text style={s.label}>Email Address</Text>
                <View style={s.iconRow}>
                  <Mail size={18} color="#64748b" style={s.iconLeft} />
                  <TextInput keyboardType="email-address" autoCapitalize="none" value={email}
                    onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor="rgba(15,23,42,0.3)"
                    style={[s.input, { paddingLeft: 44 }]} />
                </View>

                <TouchableOpacity style={[s.btn, !email && s.disabled]} onPress={handleSendOtp} disabled={!email || isLoading}>
                  {isLoading ? <BubbleLoader size={24} /> : <><Text style={s.btnTxt}>Send OTP</Text><ArrowRight size={20} color="#fff" /></>}
                </TouchableOpacity>

                <View style={s.divider}><View style={s.line} /><Text style={s.or}>OR</Text><View style={s.line} /></View>

                <TouchableOpacity style={s.secondary} onPress={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                  {isGoogleLoading ? <BubbleLoader size={24} /> : <><GoogleIcon /><Text style={s.secTxt}>Continue with Google</Text></>}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* ── OTP ── */}
          {step === 'otp' && (
            <Animated.View   style={s.card}>
              <Text style={s.cardTitle}>Check your email</Text>
              <Text style={s.cardDesc}>We sent a 6-digit code to <Text style={{ fontWeight: '700', color: '#0057bd' }}>{email}</Text></Text>

              <View style={s.otpRow}>
                {otp.map((d, i) => (
                  <TextInput key={i} ref={el => { otpRefs.current[i] = el; }} 
                    keyboardType="number-pad" textContentType="oneTimeCode"
                    maxLength={6} value={d} onChangeText={v => handleOtpChange(i, v)}
                    onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !d && i > 0) otpRefs.current[i - 1]?.focus(); }}
                    style={s.otpBox} />
                ))}
              </View>

              <View style={{ gap: 14, marginTop: 24 }}>
                <TouchableOpacity style={[s.btn, otp.some(d => !d) && s.disabled]} onPress={handleVerifyOtp} disabled={otp.some(d => !d) || isLoading}>
                  {isLoading ? <BubbleLoader size={24} /> : <><Text style={s.btnTxt}>Verify &amp; Enter</Text><ArrowRight size={20} color="#fff" /></>}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendOtp} disabled={!canResend} style={s.link}>
                  <Text style={[s.linkTxt, !canResend && { color: '#94a3b8' }]}>
                    {canResend ? 'Resend Code' : `Resend in 00:${resendTimer.toString().padStart(2, '0')}`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('email')} style={s.link}>
                  <Text style={[s.linkTxt, { fontSize: 12, color: '#94a3b8' }]}>← Change email</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* ── PROFILE ── */}
          {step === 'profile' && (
            <Animated.View   style={s.card}>
              <Text style={s.cardTitle}>Complete Profile</Text>
              <Text style={s.cardDesc}>Just a few details to get you started.</Text>
              <View style={s.fields}>
                <Text style={s.label}>Display Name</Text>
                <TextInput value={displayName} onChangeText={setDisplayName} placeholder="e.g. Alex Rivero"
                  placeholderTextColor="rgba(15,23,42,0.3)" style={s.input} />

                <Text style={s.label}>Date of Birth</Text>
                <GlassyDatePicker value={dob} onChange={setDob} />

                <View style={s.toggleRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    {showBirthday ? <Eye size={18} color="#0057bd" /> : <EyeOff size={18} color="#94a3b8" />}
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>Show Birthday</Text>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>Let friends know it's your special day</Text>
                    </View>
                  </View>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => setShowBirthday(!showBirthday)}
                    style={[s.track, showBirthday ? { backgroundColor: '#0057bd' } : { backgroundColor: '#cbd5e1' }]}>
                    <Animated.View style={[s.thumb, switchStyle]} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[s.btn, (!displayName.trim() || !dob) && s.disabled, { marginTop: 8 }]}
                  onPress={handleCompleteSetup} disabled={!displayName.trim() || !dob || isLoading}>
                  {isLoading ? <BubbleLoader size={24} /> : <><Text style={s.btnTxt}>Complete Setup</Text><Check size={20} color="#fff" /></>}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {step !== 'intro' && (
          <View style={s.footer}>
            {[Globe, Shield, Headset].map((Icon, i) => (
              <TouchableOpacity key={i} style={s.footBtn}><Icon size={20} color="#64748b" /></TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[s.status, { paddingBottom: insets.bottom + 12 }]}>
        <View style={s.dot} /><Text style={s.statusTxt}>Network Secure</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  bgTop: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(0,87,189,0.06)', zIndex: -1 },
  bgBot: { position: 'absolute', bottom: -50, right: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(8,145,178,0.06)', zIndex: -1 },
  shell: { width: '100%', maxWidth: 400 },
  center: { alignItems: 'center', width: '100%' },
  logoBg: { width: 112, height: 112, marginBottom: 32 },
  logoCard: { width: '100%', height: '100%', backgroundColor: '#fff', borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0057bd', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  brand: { fontSize: 44, fontWeight: '900', color: '#0057bd', letterSpacing: -1.5 },
  subtitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 8, textAlign: 'center' },
  body: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 12, marginBottom: 40, paddingHorizontal: 20, lineHeight: 20 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 36, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 4 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  cardDesc: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 20, lineHeight: 18 },
  fields: { gap: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: -8 },
  input: { height: 52, backgroundColor: '#f1f5f9', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  iconRow: { position: 'relative', justifyContent: 'center' },
  iconLeft: { position: 'absolute', left: 14, zIndex: 5 },
  btn: { height: 52, backgroundColor: '#0057bd', borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#0057bd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  or: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
  secondary: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secTxt: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 16 },
  otpBox: { width: (W - 88) / 6, maxWidth: 52, height: 52, backgroundColor: '#f1f5f9', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#0057bd' },
  link: { alignItems: 'center', paddingVertical: 4 },
  linkTxt: { fontSize: 13, fontWeight: '700', color: '#0057bd' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#f1f5f9', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  track: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 32 },
  footBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  status: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  statusTxt: { fontSize: 9, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  gbar: { position: 'absolute', borderRadius: 1 },
});